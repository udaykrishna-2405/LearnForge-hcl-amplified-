/**
 * Offline fallback shown when path generation cannot reach the model. Mirrors
 * the exact schema the generator returns so every downstream view — timeline,
 * radar, progress — behaves identically to a live path.
 */
export const SAMPLE_PATH = {
  path_title: 'Machine Learning Engineer Track',
  estimated_weeks: 24,
  summary:
    'A four-phase route from working Python into production machine learning. Foundations come first so the modelling work later rests on solid statistics, then core ML, then deployment, then a portfolio capstone.',
  phases: [
    {
      phase_id: 'p1',
      title: 'Foundations',
      description: 'Close the Python and mathematics gaps that everything later depends on.',
      duration_weeks: 6,
      items: [
        {
          item_id: 'item-1',
          course_id: 'python-intermediate',
          title: 'Intermediate Python Programming',
          provider: 'DataCamp',
          duration_hours: 25,
          difficulty: 'intermediate',
          format: 'interactive',
          cost: '$19',
          skills_addressed: ['Python:intermediate'],
          rationale:
            'Your profile shows working Python but not the generators, decorators, and OOP patterns that scikit-learn and PyTorch code assumes. This lands first because every later course reads that style of code.',
          priority: 'required',
        },
        {
          item_id: 'item-2',
          course_id: 'statistics-fundamentals',
          title: 'Probability and Statistics in Data Science using Python',
          provider: 'Khan Academy',
          duration_hours: 30,
          difficulty: 'beginner',
          format: 'video',
          cost: 'Free',
          skills_addressed: ['Statistics:beginner'],
          rationale:
            'Model evaluation is applied statistics. Without distributions and hypothesis testing, the metrics in Phase 2 are numbers you cannot interpret.',
          priority: 'required',
        },
      ],
      milestone: {
        title: 'Exploratory Data Analysis Report',
        description: 'Profile a public dataset end to end and defend your statistical conclusions in writing.',
        skills_validated: ['Python', 'Statistics'],
      },
    },
    {
      phase_id: 'p2',
      title: 'Core Machine Learning',
      description: 'Supervised and unsupervised learning with a production-grade library.',
      duration_weeks: 8,
      items: [
        {
          item_id: 'item-3',
          course_id: 'ml-intro',
          title: 'Machine Learning Specialization',
          provider: 'Coursera',
          duration_hours: 60,
          difficulty: 'beginner',
          format: 'video',
          cost: 'Free',
          skills_addressed: ['ML Theory:beginner'],
          rationale:
            'Gives you the theory behind the algorithms rather than only the API calls, which is what separates an ML engineer from a library user in interviews.',
          priority: 'required',
        },
        {
          item_id: 'item-4',
          course_id: 'feature-engineering',
          title: 'Feature Engineering for Machine Learning',
          provider: 'Google',
          duration_hours: 20,
          difficulty: 'intermediate',
          format: 'interactive',
          cost: 'Free',
          skills_addressed: ['Feature Engineering:intermediate'],
          rationale:
            'Placed immediately after the theory course so the concepts are still fresh when you first implement them against real, messy data.',
          priority: 'required',
        },
      ],
      milestone: {
        title: 'End-to-End Prediction Model',
        description: 'Ship a validated model with a documented feature pipeline and honest error analysis.',
        skills_validated: ['ML Theory', 'Feature Engineering'],
      },
    },
    {
      phase_id: 'p3',
      title: 'Deep Learning',
      description: 'Neural networks and the architectures behind current systems.',
      duration_weeks: 6,
      items: [
        {
          item_id: 'item-5',
          course_id: 'neural-networks-basics',
          title: 'Practical Deep Learning for Coders',
          provider: 'fast.ai',
          duration_hours: 50,
          difficulty: 'intermediate',
          format: 'video',
          cost: 'Free',
          skills_addressed: ['Deep Learning:beginner'],
          rationale:
            'Targets the deep learning gap your ML Engineer goal requires. It sits in Phase 3 because backpropagation is far easier once classical optimisation is familiar.',
          priority: 'required',
        },
      ],
      milestone: {
        title: 'Neural Network From Scratch',
        description: 'Implement and train a network without a high-level framework to prove you understand the gradients.',
        skills_validated: ['Deep Learning'],
      },
    },
    {
      phase_id: 'p4',
      title: 'Deployment & Portfolio',
      description: 'Take a model out of the notebook and put it in front of users.',
      duration_weeks: 4,
      items: [
        {
          item_id: 'item-6',
          course_id: 'ml-pipelines-mlops',
          title: 'Machine Learning Engineering for Production (MLOps)',
          provider: 'Coursera',
          duration_hours: 60,
          difficulty: 'advanced',
          format: 'video',
          cost: '$79',
          skills_addressed: ['MLOps:intermediate', 'Model Serving:beginner'],
          rationale:
            'The deployment gap is the single most common reason strong candidates fail ML Engineer loops. Last in sequence because you need a model worth deploying first.',
          priority: 'required',
        },
      ],
      milestone: {
        title: 'Deployed Inference Service',
        description: 'A containerised model behind a live endpoint, with monitoring and a rollback story.',
        skills_validated: ['MLOps', 'Model Serving'],
      },
    },
  ],
  skill_progression: {
    Python: { start: 'beginner', target: 'advanced' },
    Statistics: { start: 'none', target: 'intermediate' },
    'ML Theory': { start: 'none', target: 'intermediate' },
    'Feature Engineering': { start: 'none', target: 'intermediate' },
    'Deep Learning': { start: 'none', target: 'intermediate' },
    'Model Serving': { start: 'none', target: 'intermediate' },
    MLOps: { start: 'none', target: 'intermediate' },
  },
};
