import { useCallback, useMemo, useRef, useState } from 'react';
import TopBar from './TopBar';
import PathOverview from './PathOverview';
import ProgressStats from './ProgressStats';
import SkillRadar from './SkillRadar';
import LearningPath from './LearningPath';
import SkipModal from './SkipModal';
import DailyPlanner from './DailyPlanner';
import PaceTracker from './PaceTracker';
import PathChangelog from './PathChangelog';
import FeedbackModal from './FeedbackModal';
import ReadinessPanel from './ReadinessPanel';
import VerificationUpload from './VerificationUpload';
import { applyPathAdaptation, calculateProgress, getAllItems } from '../../utils/helpers';
import { getSkillLevels, getTargetSkillLevels, getTopSkills } from '../../utils/skillCalculations';
import { getPaceStatus, toDateKey } from '../../utils/studySession';
import { adaptPath } from '../../services/aiService';
import { saveCourseProgress } from '../../services/userDataService';
import { COURSE_CATALOG } from '../../data/courseCatalog';
import { ACTIONS } from '../../state/appReducer';

// Long enough for the completion checkmark to finish drawing before the
// feedback sheet slides over it.
const FEEDBACK_DELAY_MS = 800;

export default function DashboardView({ state, dispatch, userId }) {
  const [pendingSkip, setPendingSkip] = useState(null);
  const [pendingVerification, setPendingVerification] = useState(null);
  const [isAdapting, setIsAdapting] = useState(false);
  const [plannerPreset, setPlannerPreset] = useState(null);
  const plannerRef = useRef(null);

  const {
    path, profile, completedItems, skippedItems, skipReasons, expandedPhases,
    studySessions, streak, dailyPlan, changelog, notes, readinessScore,
    feedbackModalOpen, feedbackTargetCourse, pathStartedAt,
    verifications, verifyingItemId,
  } = state;

  const progress = useMemo(
    () => calculateProgress(path, completedItems, skippedItems, profile?.weekly_hours),
    [path, completedItems, skippedItems, profile?.weekly_hours]
  );

  const currentLevels = useMemo(
    () => getSkillLevels(path, completedItems, [], skippedItems, skipReasons),
    [path, completedItems, skippedItems, skipReasons]
  );
  const targetLevels = useMemo(() => getTargetSkillLevels(path), [path]);
  const radarSkills = useMemo(
    () => getTopSkills(currentLevels, targetLevels, 8),
    [currentLevels, targetLevels]
  );

  const paceStatus = useMemo(
    () => getPaceStatus(path, completedItems, pathStartedAt, profile?.timeline_months),
    [path, completedItems, pathStartedAt, profile?.timeline_months]
  );

  const totalCourses = useMemo(() => getAllItems(path).length, [path]);

  const notify = useCallback(
    (message, type = 'success') => dispatch({ type: ACTIONS.ADD_TOAST, payload: { message, type } }),
    [dispatch]
  );

  /** Completion now requires proof, so this opens the verification modal. */
  const handleComplete = useCallback(
    (item) => {
      setPendingVerification(item);
      dispatch({ type: ACTIONS.START_VERIFICATION, payload: item.item_id });
    },
    [dispatch]
  );

  /** Runs once proof is accepted, then asks how the course felt. */
  const handleVerified = useCallback(
    ({ verified, method, confidence }) => {
      const item = pendingVerification;
      setPendingVerification(null);
      if (!item) return;

      dispatch({
        type: ACTIONS.VERIFICATION_RESULT,
        payload: { itemId: item.item_id, verified, method, confidence },
      });
      notify('Completion verified');

      if (userId) {
        saveCourseProgress(userId, item.item_id, {
          status: 'completed',
          completed_at: new Date().toISOString(),
          verification_status: 'verified',
          verification_result: { method, confidence },
        }).catch(() => {});
      }

      setTimeout(() => {
        dispatch({ type: ACTIONS.OPEN_FEEDBACK, payload: item });
      }, FEEDBACK_DELAY_MS);
    },
    [dispatch, notify, pendingVerification, userId]
  );

  const handleVerificationClose = useCallback(() => {
    setPendingVerification(null);
    dispatch({ type: ACTIONS.CANCEL_VERIFICATION });
  }, [dispatch]);

  const handleTogglePhase = useCallback(
    (phaseId) => dispatch({ type: ACTIONS.TOGGLE_PHASE, payload: phaseId }),
    [dispatch]
  );

  const handleGoHome = useCallback(
    () => dispatch({ type: ACTIONS.SET_VIEW, payload: 'landing' }),
    [dispatch]
  );

  const handleAdjustPlan = useCallback(() => {
    setPlannerPreset(90);
    plannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  /**
   * Shared by the skip modal and the post-completion feedback sheet. The signal
   * is recorded locally first so the board updates immediately; the re-plan that
   * follows is an enhancement, and its failure is not the user's problem.
   */
  const runAdaptation = useCallback(
    async ({ item, rating, comment, record }) => {
      record?.();
      setIsAdapting(true);
      dispatch({ type: ACTIONS.SET_LOADING, payload: { isLoading: true, message: 'Reviewing your path' } });

      try {
        const diff = await adaptPath(
          { item_id: item.item_id, course_title: item.title, rating, comment },
          profile,
          path,
          COURSE_CATALOG,
          completedItems
        );

        const changes = [
          ...diff.removeItemIds.map((id) => ({
            type: 'removed',
            item_id: id,
            course_title: getAllItems(path).find((i) => i.item_id === id)?.title ?? id,
            reason: diff.summary,
          })),
          ...diff.addItems.map((added) => ({
            type: 'added',
            item_id: added.course_id,
            course_title: added.title,
            reason: added.rationale,
          })),
        ];

        if (changes.length > 0) {
          dispatch({
            type: ACTIONS.APPLY_PATH_CHANGES,
            payload: applyPathAdaptation(path, diff, completedItems),
          });
          dispatch({
            type: ACTIONS.ADD_CHANGELOG_ENTRY,
            payload: {
              id: `${item.item_id}-${Date.now()}`,
              date: toDateKey(),
              courseTitle: item.title,
              rating,
              changes,
              summary: diff.summary,
            },
          });
          notify(`Path updated — ${changes.length} change${changes.length > 1 ? 's' : ''}`, 'info');
        } else {
          notify(diff.summary || 'Your path still fits. Nothing changed.', 'info');
        }
      } catch {
        notify('Saved. The path could not be re-planned right now.', 'warning');
      } finally {
        setIsAdapting(false);
        dispatch({ type: ACTIONS.SET_LOADING, payload: { isLoading: false } });
      }
    },
    [completedItems, dispatch, notify, path, profile]
  );

  const handleSkipConfirm = useCallback(
    ({ reason, comment }) => {
      const item = pendingSkip;
      setPendingSkip(null);
      if (!item) return;
      void runAdaptation({
        item,
        rating: reason,
        comment,
        record: () => dispatch({ type: ACTIONS.SKIP_COURSE, payload: { itemId: item.item_id, reason } }),
      });
    },
    [dispatch, pendingSkip, runAdaptation]
  );

  const handleFeedbackSubmit = useCallback(
    ({ rating, comment }) => {
      const item = feedbackTargetCourse;
      dispatch({ type: ACTIONS.CLOSE_FEEDBACK });
      if (!item) return;
      if (rating === 'just_right') {
        notify('Thanks — keeping your path as it is.', 'info');
        return;
      }
      void runAdaptation({ item, rating, comment });
    },
    [dispatch, feedbackTargetCourse, notify, runAdaptation]
  );

  return (
    <div className="min-h-screen bg-slate-900 pt-14">
      <TopBar profile={profile} progress={progress} onHome={handleGoHome} />

      <main className="mx-auto max-w-4xl px-4 pb-24 sm:px-6">
        <div className="pt-10">
          <PathOverview path={path} totalCourses={totalCourses} totalWeeks={progress.totalWeeks} />
        </div>

        <div className="mt-8">
          <PaceTracker
            path={path}
            profile={profile}
            completedItems={completedItems}
            sessions={studySessions}
            startedAt={pathStartedAt}
            onAdjustPlan={handleAdjustPlan}
          />
        </div>

        <div className="mt-8" ref={plannerRef}>
          <DailyPlanner
            userId={userId}
            profile={profile}
            path={path}
            completedItems={completedItems}
            sessions={studySessions}
            streak={streak}
            plan={dailyPlan}
            paceStatus={paceStatus}
            presetMinutes={plannerPreset}
            dispatch={dispatch}
          />
        </div>

        <div className="mt-10">
          <ProgressStats progress={progress} />
        </div>

        <div className="mt-12">
          <SkillRadar
            currentLevels={currentLevels}
            targetLevels={targetLevels}
            skills={radarSkills}
          />
        </div>

        {changelog.length > 0 && (
          <div className="mt-8">
            <PathChangelog entries={changelog} />
          </div>
        )}

        <div className="mt-16">
          <LearningPath
            path={path}
            expandedPhases={expandedPhases}
            completedItems={completedItems}
            skippedItems={skippedItems}
            onTogglePhase={handleTogglePhase}
            onCompleteCourse={handleComplete}
            onSkipCourse={setPendingSkip}
            isBusy={isAdapting}
            userId={userId}
            notes={notes}
            dispatch={dispatch}
            verifications={verifications}
            verifyingItemId={verifyingItemId}
          />
        </div>

        {completedItems.length > 0 && (
          <div className="mt-16">
            <ReadinessPanel
              profile={profile}
              path={path}
              completedItems={completedItems}
              score={readinessScore}
              dispatch={dispatch}
            />
          </div>
        )}

        <footer className="mt-20 text-xs text-slate-400">
          Built for the HCL Amplified Hackathon
        </footer>
      </main>

      {pendingSkip && (
        <SkipModal
          courseTitle={pendingSkip.title}
          onConfirm={handleSkipConfirm}
          onClose={() => setPendingSkip(null)}
        />
      )}

      {pendingVerification && (
        <VerificationUpload
          course={pendingVerification}
          userId={userId}
          onVerified={handleVerified}
          onClose={handleVerificationClose}
        />
      )}

      {feedbackModalOpen && feedbackTargetCourse && (
        <FeedbackModal
          course={feedbackTargetCourse}
          onSubmit={handleFeedbackSubmit}
          onClose={() => dispatch({ type: ACTIONS.CLOSE_FEEDBACK })}
        />
      )}
    </div>
  );
}
