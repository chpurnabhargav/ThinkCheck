// Converts raw model JSON into the exact shapes the frontend expects.
// Anything malformed is dropped; if nothing usable remains we throw so the
// LLM client can retry the request.

const str = (value) => (typeof value === 'string' ? value.trim() : '');

const strList = (value, max) =>
  (Array.isArray(value) ? value : [])
    .map((item) => str(typeof item === 'string' ? item : item?.text))
    .filter(Boolean)
    .slice(0, max);

const listFrom = (data, key) => (Array.isArray(data) ? data : data?.[key]);

function matchCategory(value, categories, index) {
  const wanted = str(value).toLowerCase();
  return categories.find((c) => c.toLowerCase() === wanted) || categories[index % categories.length];
}

// "a) Foo", "B. Foo", "(c) Foo" -> "Foo"
const stripOptionLabel = (text) => text.replace(/^\s*(?:\(?[a-dA-D]\)|[a-dA-D][.:])\s+/, '').trim();

function resolveCorrectIndex(q, options) {
  const raw = q.correctIndex ?? q.correct_index ?? q.answerIndex;
  const asNumber = typeof raw === 'string' && /^\d+$/.test(raw.trim()) ? Number(raw) : raw;
  if (Number.isInteger(asNumber) && asNumber >= 0 && asNumber < options.length) return asNumber;

  // Fall back to a letter ("b") or the option text itself.
  const answer = str(q.correctAnswer ?? q.answer);
  if (/^[a-d]\)?$/i.test(answer)) return answer.toLowerCase().charCodeAt(0) - 97;
  const byText = options.findIndex((opt) => opt.toLowerCase() === stripOptionLabel(answer).toLowerCase());
  return byText;
}

function normalizeMcqs(data, { count, difficulty, categories }) {
  const list = listFrom(data, 'questions');
  if (!Array.isArray(list)) throw new Error('missing "questions" array');

  const questions = [];
  list.forEach((q, i) => {
    const question = str(q?.question);
    const rawOptions = Array.isArray(q?.options) ? q.options : q?.choices;
    if (!question || !Array.isArray(rawOptions)) return;

    const options = rawOptions.map((opt) => stripOptionLabel(String(opt ?? ''))).filter(Boolean);
    if (options.length !== 4 || new Set(options.map((o) => o.toLowerCase())).size !== 4) return;

    const correctIndex = resolveCorrectIndex(q, options);
    if (correctIndex < 0 || correctIndex > 3) return;

    questions.push({
      question,
      options,
      correctIndex,
      explanation: str(q.explanation),
      hint: str(q.hint),
      category: matchCategory(q.category, categories, i),
      difficulty,
    });
  });

  if (questions.length === 0) throw new Error('no valid questions');
  return questions.slice(0, count);
}

function normalizeWritten(data, { count, difficulty, categories }) {
  const list = listFrom(data, 'questions');
  if (!Array.isArray(list)) throw new Error('missing "questions" array');

  const questions = list
    .map((q, i) => ({
      question: str(typeof q === 'string' ? q : q?.question),
      category: matchCategory(q?.category, categories, i),
      difficulty,
    }))
    .filter((q) => q.question);

  if (questions.length === 0) throw new Error('no valid questions');
  return questions.slice(0, count);
}

function normalizeEvaluation(data) {
  const score = Number(data?.score);
  if (!Number.isFinite(score)) throw new Error('missing numeric "score"');

  return {
    score: Math.min(100, Math.max(0, Math.round(score))),
    comments: str(data.comments) || str(data.feedback) || 'No specific feedback provided.',
    suggestions: strList(data.suggestions, 3),
    keyPoints: strList(data.keyPoints ?? data.key_points, 5),
  };
}

function normalizeRoadmap(data, { topic, level }) {
  const phases = (Array.isArray(data?.phases) ? data.phases : [])
    .map((phase, i) => ({
      title: str(phase?.title) || `Phase ${i + 1}`,
      weeks: (Array.isArray(phase?.weeks) ? phase.weeks : [])
        .map((week, j) => ({
          title: str(week?.title) || `Week ${j + 1}`,
          tasks: strList(week?.tasks, 8),
          project: str(week?.project) || null,
        }))
        .filter((week) => week.tasks.length > 0),
    }))
    .filter((phase) => phase.weeks.length > 0);

  if (phases.length === 0) throw new Error('roadmap has no phases');

  return {
    title: str(data.title) || `${topic} roadmap (${level})`,
    description: str(data.description),
    phases,
  };
}

// Splits Markdown notes into sections on "## " headings. "### " sub-headings
// stay inside their parent section so the hierarchy is preserved.
function parseNotes(markdown, fallbackTitle) {
  const text = str(markdown)
    .replace(/^```(?:markdown|md)?\s*\n/i, '')
    .replace(/\n```\s*$/, '');

  let title = fallbackTitle;
  const sections = [];
  let current = null;
  const intro = [];

  for (const line of text.split('\n')) {
    const h1 = line.match(/^#\s+(.+)/);
    const h2 = line.match(/^##\s+(.+)/);
    if (h1 && !current && sections.length === 0 && title === fallbackTitle) {
      title = h1[1].trim();
    } else if (h2) {
      current = { title: h2[1].trim(), content: [] };
      sections.push(current);
    } else if (current) {
      current.content.push(line);
    } else {
      intro.push(line);
    }
  }

  const result = sections.map((s) => ({ title: s.title, content: s.content.join('\n').trim() }));
  const introText = intro.join('\n').trim();
  if (introText) result.unshift({ title: 'Overview', content: introText });
  if (result.length === 0) result.push({ title, content: text });

  return { title, sections: result, fullText: text };
}

module.exports = {
  normalizeMcqs,
  normalizeWritten,
  normalizeEvaluation,
  normalizeRoadmap,
  parseNotes,
};
