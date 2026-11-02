require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { rateLimit } = require('express-rate-limit');

const { createLLM, resolveConfig, LLMError } = require('./lib/llm');
const prompts = require('./lib/prompts');
const {
  normalizeMcqs,
  normalizeWritten,
  normalizeEvaluation,
  normalizeRoadmap,
  parseNotes,
} = require('./lib/normalize');

const LIMITS = {
  topicLength: 200,
  answerLength: 5000,
  mcqQuestions: 10,
  writtenQuestions: 5,
};
const DIFFICULTIES = ['easy', 'medium', 'hard'];
const CATEGORIES = ['Fundamentals', 'Definitions', 'Practical Applications', 'History', 'Advanced Concepts'];
const ROADMAP_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const NOTE_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'];
const NOTE_FORMATS = ['structured', 'detailed', 'concise', 'visual'];

// ---------------------------------------------------------------------------
// Input validation helpers
// ---------------------------------------------------------------------------

class BadRequest extends Error {
  constructor(message) {
    super(message);
    this.status = 400;
  }
}

function requireText(value, field, maxLength = LIMITS.topicLength) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) throw new BadRequest(`"${field}" is required.`);
  if (text.length > maxLength) throw new BadRequest(`"${field}" must be at most ${maxLength} characters.`);
  return text;
}

function clampInt(value, min, max, fallback) {
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? fallback : Math.min(max, Math.max(min, n));
}

function oneOf(value, allowed, fallback) {
  const match = allowed.find((option) => option.toLowerCase() === String(value ?? '').toLowerCase());
  return match || fallback;
}

// Accepts an array or a comma-separated string; keeps only known categories.
function parseCategories(value) {
  const list = Array.isArray(value) ? value : String(value ?? '').split(',');
  const picked = list.map((c) => oneOf(String(c).trim(), CATEGORIES, null)).filter(Boolean);
  return picked.length ? [...new Set(picked)] : CATEGORIES;
}

// Express 4 does not forward rejected promises to the error handler.
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

function createApp({ llm, env = process.env } = {}) {
  const app = express();
  app.set('trust proxy', 1); // Render and most hosts sit behind one proxy.
  app.use(express.json({ limit: '100kb' }));

  const allowedOrigins = (env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.use(cors(allowedOrigins.length ? { origin: allowedOrigins } : undefined));

  // Every AI request costs money / quota, so cap requests per IP.
  const aiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: Number(env.RATE_LIMIT_MAX) || 40,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Too many requests. Please wait a few minutes and try again.' },
  });

  app.get('/', (req, res) => {
    res.json({
      name: 'ThinkCheck API',
      endpoints: ['/generate-mcq', '/generate-written', '/evaluate-answers', '/generate-roadmap', '/notes', '/health'],
    });
  });

  app.get('/health', (req, res) => {
    const { provider, model, apiKey, requiresKey } = llm.config;
    res.json({ ok: true, provider, model, configured: Boolean(apiKey) || !requiresKey });
  });

  app.get(
    '/health/llm',
    aiLimiter,
    asyncHandler(async (req, res) => {
      const reply = await llm.generateText({
        system: 'You are a health check.',
        prompt: 'Reply with the single word: pong',
        temperature: 0,
      });
      res.json({ ok: true, provider: llm.config.provider, model: llm.config.model, reply: reply.trim() });
    })
  );

  app.post(
    '/generate-mcq',
    aiLimiter,
    asyncHandler(async (req, res) => {
      const topic = requireText(req.body.topic, 'topic');
      const count = clampInt(req.body.numQuestions, 1, LIMITS.mcqQuestions, 5);
      const difficulty = oneOf(req.body.difficulty, DIFFICULTIES, 'medium');
      const categories = parseCategories(req.body.categories);

      const questions = await llm.generateJSON({
        ...prompts.mcqPrompt({ topic, count, difficulty, categories }),
        temperature: 0.4,
        validate: (data) => normalizeMcqs(data, { count, difficulty, categories }),
      });
      res.json({ topic, difficulty, questions });
    })
  );

  app.post(
    '/generate-written',
    aiLimiter,
    asyncHandler(async (req, res) => {
      const topic = requireText(req.body.topic, 'topic');
      const count = clampInt(req.body.numQuestions, 1, LIMITS.writtenQuestions, 3);
      const difficulty = oneOf(req.body.difficulty, DIFFICULTIES, 'medium');
      const categories = parseCategories(req.body.categories);

      const questions = await llm.generateJSON({
        ...prompts.writtenPrompt({ topic, count, difficulty, categories }),
        temperature: 0.5,
        validate: (data) => normalizeWritten(data, { count, difficulty, categories }),
      });
      res.json({ topic, difficulty, questions });
    })
  );

  app.post(
    '/evaluate-answers',
    aiLimiter,
    asyncHandler(async (req, res) => {
      const { questions, answers } = req.body;
      if (!Array.isArray(questions) || !Array.isArray(answers) || questions.length !== answers.length) {
        throw new BadRequest('"questions" and "answers" must be arrays of the same length.');
      }
      if (questions.length === 0 || questions.length > LIMITS.writtenQuestions) {
        throw new BadRequest(`Submit between 1 and ${LIMITS.writtenQuestions} answers.`);
      }

      const topic = typeof req.body.topic === 'string' ? req.body.topic.slice(0, LIMITS.topicLength) : '';
      const difficulty = oneOf(req.body.difficulty, DIFFICULTIES, 'medium');

      const feedback = await Promise.all(
        questions.map(async (q, i) => {
          // The frontend sends question objects; older clients sent strings.
          const question = typeof q === 'string' ? q : q?.question;
          const answer = typeof answers[i] === 'string' ? answers[i].trim() : '';
          if (!question) throw new BadRequest(`Question ${i + 1} is missing its text.`);
          if (answer.length > LIMITS.answerLength) {
            throw new BadRequest(`Answer ${i + 1} is longer than ${LIMITS.answerLength} characters.`);
          }
          if (!answer) {
            return { score: 0, comments: 'No answer was provided.', suggestions: ['Attempt every question, even briefly.'], keyPoints: [] };
          }

          try {
            return await llm.generateJSON({
              ...prompts.evaluationPrompt({ question, answer, topic, difficulty }),
              temperature: 0.1,
              validate: normalizeEvaluation,
            });
          } catch (err) {
            // Report the failure instead of inventing a score.
            console.error(`[evaluate] question ${i + 1}: ${err.message}`);
            return { score: null, error: true, comments: 'This answer could not be graded right now. Please try again.', suggestions: [], keyPoints: [] };
          }
        })
      );

      const graded = feedback.filter((f) => typeof f.score === 'number');
      if (graded.length === 0) {
        return res.status(502).json({ error: 'Could not grade any answers. Please try again.' });
      }
      const overallScore = Math.round(graded.reduce((sum, f) => sum + f.score, 0) / graded.length);
      res.json({ feedback, overallScore, gradedCount: graded.length });
    })
  );

  app.post(
    '/generate-roadmap',
    aiLimiter,
    asyncHandler(async (req, res) => {
      const topic = requireText(req.body.topic, 'topic');
      const timeframe = oneOf(req.body.timeframe, Object.keys(prompts.TIMEFRAME_WEEKS), '3 months');
      const level = oneOf(req.body.level, ROADMAP_LEVELS, 'Beginner');

      const roadmap = await llm.generateJSON({
        ...prompts.roadmapPrompt({ topic, timeframe, level }),
        temperature: 0.4,
        validate: (data) => normalizeRoadmap(data, { topic, level }),
      });
      res.json({ topic, timeframe, level, roadmap });
    })
  );

  app.post(
    '/notes',
    aiLimiter,
    asyncHandler(async (req, res) => {
      const subject = requireText(req.body.subject, 'subject');
      const level = oneOf(req.body.level, NOTE_LEVELS, 'intermediate');
      const format = oneOf(req.body.format, NOTE_FORMATS, 'structured');

      const markdown = await llm.generateText({ ...prompts.notesPrompt({ subject, level, format }), temperature: 0.4 });
      res.json({ subject, level, format, notes: { ...parseNotes(markdown, subject), level } });
    })
  );

  app.use((req, res) => res.status(404).json({ error: 'Not found' }));

  // Error handler must be registered last.
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'Request body must be valid JSON.' });
    }
    const known = err instanceof BadRequest || err instanceof LLMError;
    const status = known ? err.status : 500;
    if (status >= 500) console.error(`[error] ${req.method} ${req.path}: ${err.message}`);
    res.status(status).json({ error: known ? err.message : 'Internal server error' });
  });

  return app;
}

// The default app. `npm start` runs it as a normal server; serverless hosts
// such as Vercel import this module and use the exported app directly.
const config = resolveConfig();
const app = createApp({ llm: createLLM(config) });

if (config.requiresKey && !config.apiKey) {
  console.warn(`WARNING: no API key found. Set ${config.keyEnvName} in backend/.env`);
}

if (require.main === module) {
  const port = process.env.PORT || 5000;
  app.listen(port, () => {
    console.log(`ThinkCheck API listening on port ${port}`);
    console.log(`LLM provider: ${config.provider} (model: ${config.model})`);
  });
}

module.exports = app;
module.exports.createApp = createApp;
