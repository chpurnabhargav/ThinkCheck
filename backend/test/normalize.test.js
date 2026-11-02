const test = require('node:test');
const assert = require('node:assert/strict');
const {
  normalizeMcqs,
  normalizeWritten,
  normalizeEvaluation,
  normalizeRoadmap,
  parseNotes,
} = require('../lib/normalize');

const categories = ['Fundamentals', 'Definitions'];

test('normalizeMcqs keeps valid questions and strips option labels', () => {
  const result = normalizeMcqs(
    {
      questions: [
        { question: 'Q1', options: ['a) One', 'b) Two', 'c) Three', 'd) Four'], correctIndex: 2, category: 'definitions' },
        { question: 'Too few options', options: ['A', 'B'], correctIndex: 0 },
        { question: 'Duplicate options', options: ['A', 'A', 'B', 'C'], correctIndex: 0 },
        { question: 'Bad index', options: ['A', 'B', 'C', 'D'], correctIndex: 7 },
      ],
    },
    { count: 5, difficulty: 'hard', categories }
  );

  assert.equal(result.length, 1);
  assert.deepEqual(result[0].options, ['One', 'Two', 'Three', 'Four']);
  assert.equal(result[0].correctIndex, 2);
  assert.equal(result[0].category, 'Definitions');
  assert.equal(result[0].difficulty, 'hard');
});

test('normalizeMcqs accepts a letter or option text as the correct answer', () => {
  const [byLetter, byText] = normalizeMcqs(
    [
      { question: 'L', options: ['A', 'B', 'C', 'D'], correctAnswer: 'b)' },
      { question: 'T', options: ['Red', 'Green', 'Blue', 'Pink'], answer: 'Blue' },
    ],
    { count: 5, difficulty: 'easy', categories }
  );
  assert.equal(byLetter.correctIndex, 1);
  assert.equal(byText.correctIndex, 2);
});

test('normalizeMcqs throws when nothing usable is returned (so the client retries)', () => {
  assert.throws(() => normalizeMcqs({ questions: [] }, { count: 5, difficulty: 'easy', categories }));
  assert.throws(() => normalizeMcqs({ foo: 1 }, { count: 5, difficulty: 'easy', categories }));
});

test('normalizeMcqs never returns more than requested', () => {
  const q = { question: 'Q', options: ['A', 'B', 'C', 'D'], correctIndex: 0 };
  assert.equal(normalizeMcqs([q, q, q], { count: 2, difficulty: 'easy', categories }).length, 2);
});

test('normalizeWritten accepts objects or plain strings', () => {
  const result = normalizeWritten({ questions: ['Explain X', { question: 'Compare Y', category: 'Fundamentals' }, {}] }, {
    count: 5,
    difficulty: 'medium',
    categories,
  });
  assert.deepEqual(
    result.map((q) => q.question),
    ['Explain X', 'Compare Y']
  );
});

test('normalizeEvaluation clamps scores and limits list sizes', () => {
  const result = normalizeEvaluation({ score: 140.4, comments: 'ok', suggestions: ['a', 'b', 'c', 'd'], keyPoints: ['k'] });
  assert.equal(result.score, 100);
  assert.equal(result.suggestions.length, 3);
  assert.deepEqual(result.keyPoints, ['k']);
  assert.equal(normalizeEvaluation({ score: '-5' }).score, 0);
  assert.throws(() => normalizeEvaluation({ comments: 'no score' }));
});

test('normalizeRoadmap drops empty weeks and phases', () => {
  const roadmap = normalizeRoadmap(
    {
      title: 'Learn SQL',
      phases: [
        { title: 'Month 1', weeks: [{ title: 'Week 1', tasks: ['SELECT basics'], project: '' }, { title: 'Empty', tasks: [] }] },
        { title: 'Empty phase', weeks: [] },
      ],
    },
    { topic: 'SQL', level: 'Beginner' }
  );
  assert.equal(roadmap.phases.length, 1);
  assert.equal(roadmap.phases[0].weeks.length, 1);
  assert.equal(roadmap.phases[0].weeks[0].project, null);
  assert.throws(() => normalizeRoadmap({ phases: [] }, { topic: 'SQL', level: 'Beginner' }));
});

test('parseNotes splits on ## headings and keeps ### inside sections', () => {
  const notes = parseNotes(
    '# Databases\nIntro text.\n## Keys\nPrimary keys...\n### Composite keys\nMore.\n## Summary\nDone.',
    'fallback'
  );
  assert.equal(notes.title, 'Databases');
  assert.deepEqual(
    notes.sections.map((s) => s.title),
    ['Overview', 'Keys', 'Summary']
  );
  assert.match(notes.sections[1].content, /### Composite keys/);
});

test('parseNotes falls back to a single section and strips outer code fences', () => {
  const notes = parseNotes('```markdown\nJust some text\n```', 'Topic');
  assert.equal(notes.title, 'Topic');
  assert.equal(notes.sections.length, 1);
  assert.equal(notes.sections[0].content, 'Just some text');
});
