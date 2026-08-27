export const SKILL_TAXONOMY = {
  'Python': { prerequisites: [], levels: ['beginner', 'intermediate', 'advanced'] },
  'Statistics': { prerequisites: [], levels: ['beginner', 'intermediate'] },
  'Linear Algebra': { prerequisites: [], levels: ['beginner', 'intermediate'] },
  'Calculus': { prerequisites: ['Statistics:beginner'], levels: ['beginner', 'intermediate'] },
  'Data Analysis': { prerequisites: ['Python:beginner'], levels: ['beginner', 'intermediate'] },
  'Pandas': { prerequisites: ['Python:beginner'], levels: ['beginner', 'intermediate'] },
  'Data Visualization': { prerequisites: ['Python:beginner', 'Pandas:beginner'], levels: ['beginner', 'intermediate'] },
  'SQL': { prerequisites: [], levels: ['beginner', 'intermediate'] },
  'ML Theory': { prerequisites: ['Python:intermediate', 'Statistics:intermediate', 'Linear Algebra:beginner'], levels: ['beginner', 'intermediate', 'advanced'] },
  'Supervised Learning': { prerequisites: ['ML Theory:beginner'], levels: ['beginner', 'intermediate'] },
  'Unsupervised Learning': { prerequisites: ['ML Theory:beginner'], levels: ['beginner', 'intermediate'] },
  'Feature Engineering': { prerequisites: ['ML Theory:beginner', 'Pandas:beginner'], levels: ['beginner', 'intermediate'] },
  'Deep Learning': { prerequisites: ['ML Theory:intermediate', 'Python:intermediate', 'Linear Algebra:intermediate'], levels: ['beginner', 'intermediate', 'advanced'] },
  'CNNs': { prerequisites: ['Deep Learning:beginner'], levels: ['beginner', 'intermediate'] },
  'RNNs': { prerequisites: ['Deep Learning:beginner'], levels: ['beginner', 'intermediate'] },
  'Transformers': { prerequisites: ['Deep Learning:intermediate'], levels: ['beginner', 'intermediate', 'advanced'] },
  'NLP': { prerequisites: ['ML Theory:intermediate', 'Python:intermediate'], levels: ['beginner', 'intermediate'] },
  'Computer Vision': { prerequisites: ['Deep Learning:beginner', 'CNNs:beginner'], levels: ['beginner', 'intermediate'] },
  'Object Detection': { prerequisites: ['Computer Vision:beginner'], levels: ['beginner', 'intermediate'] },
  'Docker': { prerequisites: [], levels: ['beginner', 'intermediate'] },
  'Model Serving': { prerequisites: ['ML Theory:beginner', 'Docker:beginner', 'Python:intermediate'], levels: ['beginner', 'intermediate'] },
  'MLOps': { prerequisites: ['Model Serving:beginner', 'Docker:beginner'], levels: ['beginner', 'intermediate'] },
  'Data Engineering': { prerequisites: ['SQL:beginner', 'Python:intermediate'], levels: ['beginner', 'intermediate'] },
  'NumPy': { prerequisites: ['Python:beginner'], levels: ['beginner', 'intermediate'] },
  'Scikit-learn': { prerequisites: ['Python:intermediate', 'ML Theory:beginner'], levels: ['beginner', 'intermediate'] }
};

export const DOMAIN_SKILL_REQUIREMENTS = {
  'ML Engineer': [
    { skill: 'Python', level: 'advanced' },
    { skill: 'ML Theory', level: 'intermediate' },
    { skill: 'Deep Learning', level: 'intermediate' },
    { skill: 'MLOps', level: 'beginner' },
    { skill: 'Docker', level: 'beginner' },
    { skill: 'SQL', level: 'beginner' },
    { skill: 'Statistics', level: 'intermediate' },
    { skill: 'Linear Algebra', level: 'intermediate' }
  ],
  'Data Scientist': [
    { skill: 'Python', level: 'advanced' },
    { skill: 'Statistics', level: 'intermediate' },
    { skill: 'Data Analysis', level: 'intermediate' },
    { skill: 'Pandas', level: 'intermediate' },
    { skill: 'Data Visualization', level: 'intermediate' },
    { skill: 'ML Theory', level: 'intermediate' },
    { skill: 'SQL', level: 'intermediate' },
    { skill: 'Feature Engineering', level: 'intermediate' }
  ],
  'AI Researcher': [
    { skill: 'Python', level: 'advanced' },
    { skill: 'ML Theory', level: 'advanced' },
    { skill: 'Deep Learning', level: 'advanced' },
    { skill: 'Statistics', level: 'intermediate' },
    { skill: 'Linear Algebra', level: 'intermediate' },
    { skill: 'Calculus', level: 'intermediate' },
    { skill: 'Transformers', level: 'intermediate' },
    { skill: 'CNNs', level: 'intermediate' }
  ],
  'Data Analyst': [
    { skill: 'SQL', level: 'intermediate' },
    { skill: 'Data Analysis', level: 'intermediate' },
    { skill: 'Data Visualization', level: 'intermediate' },
    { skill: 'Python', level: 'beginner' },
    { skill: 'Pandas', level: 'beginner' },
    { skill: 'Statistics', level: 'beginner' }
  ],
  'NLP Engineer': [
    { skill: 'Python', level: 'advanced' },
    { skill: 'NLP', level: 'intermediate' },
    { skill: 'Transformers', level: 'intermediate' },
    { skill: 'Deep Learning', level: 'intermediate' },
    { skill: 'ML Theory', level: 'intermediate' },
    { skill: 'RNNs', level: 'intermediate' },
    { skill: 'Model Serving', level: 'beginner' }
  ],
  'Computer Vision Engineer': [
    { skill: 'Python', level: 'advanced' },
    { skill: 'Computer Vision', level: 'intermediate' },
    { skill: 'CNNs', level: 'intermediate' },
    { skill: 'Object Detection', level: 'intermediate' },
    { skill: 'Deep Learning', level: 'intermediate' },
    { skill: 'ML Theory', level: 'intermediate' },
    { skill: 'Model Serving', level: 'beginner' }
  ]
};
