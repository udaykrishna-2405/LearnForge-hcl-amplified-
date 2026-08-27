import { useCallback, useMemo, useState } from 'react';
import TopBar from './TopBar';
import PathOverview from './PathOverview';
import ProgressStats from './ProgressStats';
import SkillRadarChart from './SkillRadarChart';
import LearningPath from './LearningPath';
import SkipModal from './SkipModal';
import { applyPathAdaptation, calculateProgress, calculateSkillLevels, getAllItems } from '../../utils/helpers';
import { adaptPath } from '../../services/aiService';
import { COURSE_CATALOG } from '../../data/courseCatalog';
import { ACTIONS } from '../../state/appReducer';

export default function DashboardView({ state, dispatch }) {
  const [pendingSkip, setPendingSkip] = useState(null);
  const [isAdapting, setIsAdapting] = useState(false);

  const { path, profile, completedItems, skippedItems, skipReasons, expandedPhases } = state;

  const progress = useMemo(
    () => calculateProgress(path, completedItems, skippedItems, profile?.weekly_hours),
    [path, completedItems, skippedItems, profile?.weekly_hours]
  );

  const skillLevels = useMemo(
    () => calculateSkillLevels(path, completedItems, skippedItems, skipReasons),
    [path, completedItems, skippedItems, skipReasons]
  );

  const totalCourses = useMemo(() => getAllItems(path).length, [path]);

  const notify = useCallback(
    (message, type = 'success') => dispatch({ type: ACTIONS.ADD_TOAST, payload: { message, type } }),
    [dispatch]
  );

  const handleComplete = useCallback(
    (itemId) => {
      dispatch({ type: ACTIONS.COMPLETE_COURSE, payload: itemId });
      notify('Course marked complete');
    },
    [dispatch, notify]
  );

  const handleTogglePhase = useCallback(
    (phaseId) => dispatch({ type: ACTIONS.TOGGLE_PHASE, payload: phaseId }),
    [dispatch]
  );

  const handleGoHome = useCallback(
    () => dispatch({ type: ACTIONS.SET_VIEW, payload: 'landing' }),
    [dispatch]
  );

  /**
   * The skip is recorded locally first so the board updates immediately; the
   * re-plan that follows is an enhancement, and its failure is not the user's
   * problem to solve.
   */
  const handleSkipConfirm = useCallback(
    async ({ reason, comment }) => {
      const item = pendingSkip;
      setPendingSkip(null);
      if (!item) return;

      dispatch({ type: ACTIONS.SKIP_COURSE, payload: { itemId: item.item_id, reason } });
      setIsAdapting(true);
      dispatch({ type: ACTIONS.SET_LOADING, payload: { isLoading: true, message: 'Adjusting the rest of your path' } });

      try {
        const diff = await adaptPath(
          { type: 'skip', item_id: item.item_id, reason, comment },
          profile,
          path,
          COURSE_CATALOG,
          completedItems
        );

        const changed = diff.removeItemIds.length > 0 || diff.addItems.length > 0;
        if (changed) {
          dispatch({
            type: ACTIONS.UPDATE_PATH,
            payload: applyPathAdaptation(path, diff, completedItems),
          });
        }
        notify(
          diff.summary || (changed ? 'Path updated around your skip' : 'Skip saved. The rest of your path still fits.'),
          'info'
        );
      } catch {
        notify('Skip saved. The path could not be re-planned right now.', 'warning');
      } finally {
        setIsAdapting(false);
        dispatch({ type: ACTIONS.SET_LOADING, payload: { isLoading: false } });
      }
    },
    [completedItems, dispatch, notify, path, pendingSkip, profile]
  );

  return (
    <div className="min-h-screen bg-slate-900 pt-14">
      <TopBar profile={profile} progress={progress} onHome={handleGoHome} />

      <main className="mx-auto max-w-4xl px-4 pb-24 sm:px-6">
        <div className="pt-10">
          <PathOverview path={path} totalCourses={totalCourses} totalWeeks={progress.totalWeeks} />
        </div>

        <div className="mt-10">
          <ProgressStats progress={progress} />
        </div>

        <div className="mt-12">
          <SkillRadarChart skillProgression={path.skill_progression} currentLevels={skillLevels} />
        </div>

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
          />
        </div>

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
    </div>
  );
}
