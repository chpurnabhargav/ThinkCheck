import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { ArrowLeft, Star, Trash2 } from 'lucide-react';
import Markdown from '../components/Markdown';
import { postJSON } from '../lib/api';

const CATEGORIES = ['Fundamentals', 'Definitions', 'Practical Applications', 'History', 'Advanced Concepts'];
const DIFFICULTIES = ['easy', 'medium', 'hard'];
const MAX_QUESTIONS = 10; // must match the backend limit
const LETTERS = ['A', 'B', 'C', 'D'];

// localStorage can throw (private mode, quota), so never let it break the page.
const storage = {
  get(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore */
    }
  },
};

const formatTime = (seconds) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
const percent = (part, total) => (total ? Math.round((part / total) * 100) : 0);

export default function MCQQuizGenerator() {
  // Setup
  const [topic, setTopic] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState('medium');
  const [selectedCategories, setSelectedCategories] = useState([]);

  // Session
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState([]); // one entry per answered/skipped question
  const [showHint, setShowHint] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef(0);
  const questionStartRef = useRef(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [saved, setSaved] = useState([]);
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    setHistory(storage.get('quizHistory', []));
    // Old versions stored bare ids here; keep only full question objects.
    setSaved(storage.get('bookmarkedQuestions', []).filter((q) => q && typeof q === 'object'));
  }, []);

  const inQuiz = questions.length > 0 && !showResults;

  useEffect(() => {
    if (!inQuiz) return;
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [inQuiz]);

  const startQuiz = (qs) => {
    setQuestions(qs);
    setCurrent(0);
    setSelected(null);
    setAnswers([]);
    setShowHint(false);
    setShowResults(false);
    setElapsed(0);
    startTimeRef.current = Date.now();
    questionStartRef.current = Date.now();
  };

  const generateMCQs = async () => {
    if (!topic.trim()) {
      setError('Please enter a topic.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await postJSON('/generate-mcq', {
        topic: topic.trim(),
        numQuestions,
        difficulty,
        categories: selectedCategories.length ? selectedCategories : CATEGORIES,
      });
      startQuiz(data.questions.map((q, i) => ({ ...q, id: `${Date.now()}-${i}`, topic: topic.trim() })));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const question = questions[current];
  const answer = answers[current];
  const score = answers.filter((a) => a.isCorrect).length;

  const recordAnswer = (choice, skipped = false) => {
    const entry = {
      selected: choice,
      isCorrect: !skipped && choice === question.correctIndex,
      skipped,
      timeSpent: Math.round((Date.now() - questionStartRef.current) / 1000),
    };
    const next = [...answers];
    next[current] = entry;
    setAnswers(next);
    return next;
  };

  const finishQuiz = (finalAnswers) => {
    const totalTime = Math.floor((Date.now() - startTimeRef.current) / 1000);
    setElapsed(totalTime);
    const result = {
      id: Date.now(),
      topic: questions[0]?.topic || topic,
      score: finalAnswers.filter((a) => a?.isCorrect).length,
      totalQuestions: questions.length,
      totalTime,
      difficulty,
      date: new Date().toISOString(),
    };
    const nextHistory = [...history, result].slice(-20);
    setHistory(nextHistory);
    storage.set('quizHistory', nextHistory);
    setShowResults(true);
  };

  const goNext = (latestAnswers = answers) => {
    if (current + 1 < questions.length) {
      setCurrent(current + 1);
      setSelected(null);
      setShowHint(false);
      questionStartRef.current = Date.now();
    } else {
      finishQuiz(latestAnswers);
    }
  };

  const skipQuestion = () => goNext(recordAnswer(null, true));

  const isSaved = (q) => saved.some((s) => s.question === q.question);
  const toggleSaved = (q) => {
    const next = isSaved(q)
      ? saved.filter((s) => s.question !== q.question)
      : [...saved, { question: q.question, options: q.options, correctIndex: q.correctIndex, explanation: q.explanation, topic: q.topic }];
    setSaved(next);
    storage.set('bookmarkedQuestions', next);
  };

  const toggleCategory = (category) =>
    setSelectedCategories((prev) => (prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]));

  // ----- Derived data for results -----
  const categoryData = Object.entries(
    questions.reduce((acc, q, i) => {
      acc[q.category] ??= { correct: 0, total: 0 };
      acc[q.category].total += 1;
      if (answers[i]?.isCorrect) acc[q.category].correct += 1;
      return acc;
    }, {})
  ).map(([name, s]) => ({ name, percentage: percent(s.correct, s.total) }));

  const pieData = [
    { name: 'Correct', value: score },
    { name: 'Incorrect', value: answers.filter((a) => a && !a.isCorrect && !a.skipped).length },
    { name: 'Skipped', value: answers.filter((a) => a?.skipped).length },
  ].filter((d) => d.value > 0);
  const PIE_COLORS = { Correct: '#4ade80', Incorrect: '#f87171', Skipped: '#9ca3af' };

  const optionClass = (index) => {
    if (!answer) {
      return selected === index ? 'border-blue-500 bg-blue-900/40' : 'border-gray-600 hover:border-gray-500 hover:bg-gray-700';
    }
    if (index === question.correctIndex) return 'border-green-500 bg-green-900/30';
    if (index === answer.selected) return 'border-red-500 bg-red-900/30';
    return 'border-gray-700 opacity-70';
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <Head>
        <title>MCQ Mode · ThinkCheck</title>
      </Head>
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center text-sm text-gray-400 hover:text-white mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" /> Home
        </Link>
        <h1 className="text-4xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
          MCQ Quiz Generator
        </h1>

        {/* Setup form */}
        {!loading && questions.length === 0 && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-6 mb-6">
            <div className="mb-6">
              <label htmlFor="topic" className="block font-medium mb-2 text-gray-300">
                Topic/Concept:
              </label>
              <input
                id="topic"
                type="text"
                value={topic}
                maxLength={200}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && generateMCQs()}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                placeholder="e.g. DBMS, JavaScript, React Hooks"
              />
            </div>

            <div className="mb-6">
              <span className="block font-medium mb-2 text-gray-300">Number of Questions: {numQuestions}</span>
              <input
                type="range"
                min="1"
                max={MAX_QUESTIONS}
                value={numQuestions}
                onChange={(e) => setNumQuestions(Number(e.target.value))}
                className="w-full accent-blue-500"
                aria-label="Number of questions"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>1</span>
                <span>{MAX_QUESTIONS}</span>
              </div>
            </div>

            <div className="mb-6">
              <span className="block font-medium mb-2 text-gray-300">Difficulty Level:</span>
              <div className="flex space-x-4">
                {DIFFICULTIES.map((level) => (
                  <button
                    key={level}
                    onClick={() => setDifficulty(level)}
                    aria-pressed={difficulty === level}
                    className={`flex-1 py-2 rounded-lg capitalize ${
                      difficulty === level ? 'bg-blue-600 border border-blue-400' : 'bg-gray-700 border border-gray-600 hover:bg-gray-600'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <span className="block font-medium mb-2 text-gray-300">Categories:</span>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map((category) => (
                  <button
                    key={category}
                    onClick={() => toggleCategory(category)}
                    aria-pressed={selectedCategories.includes(category)}
                    className={`p-2 rounded-lg border text-left ${
                      selectedCategories.includes(category) ? 'bg-blue-600 border-blue-400' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-400 mt-2">
                {selectedCategories.length === 0 ? 'All categories will be included' : `Selected ${selectedCategories.length} categories`}
              </p>
            </div>

            <button
              onClick={generateMCQs}
              className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-lg font-medium shadow-lg transition duration-300 ease-in-out"
            >
              Generate Quiz
            </button>

            {error && (
              <p role="alert" className="mt-4 text-red-400 text-center">
                {error}
              </p>
            )}

            {history.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-700">
                <h3 className="text-xl font-bold text-gray-200 mb-4">Previous Quizzes</h3>
                <div className="space-y-3">
                  {history
                    .slice(-3)
                    .reverse()
                    .map((quiz) => (
                      <div key={quiz.id} className="flex justify-between items-center bg-gray-700 p-3 rounded-lg">
                        <div>
                          <p className="font-medium text-blue-300">{quiz.topic}</p>
                          <p className="text-sm text-gray-400">
                            {new Date(quiz.date).toLocaleDateString()} • {quiz.difficulty} • {percent(quiz.score, quiz.totalQuestions)}%
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">
                            {quiz.score}/{quiz.totalQuestions}
                          </p>
                          <p className="text-sm text-gray-400">Time: {formatTime(quiz.totalTime)}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {saved.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-700">
                <button onClick={() => setShowSaved(!showSaved)} className="text-xl font-bold text-gray-200 flex items-center">
                  <Star className="w-5 h-5 mr-2 text-yellow-400" /> Saved Questions ({saved.length})
                </button>
                {showSaved && (
                  <div className="mt-4 space-y-4">
                    {saved.map((q) => (
                      <div key={q.question} className="bg-gray-700 p-4 rounded-lg">
                        <div className="flex justify-between gap-4">
                          <p className="text-xs text-blue-300 mb-2">{q.topic}</p>
                          <button onClick={() => toggleSaved(q)} className="text-gray-400 hover:text-red-400" aria-label="Remove saved question">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <Markdown dark>{q.question}</Markdown>
                        <p className="mt-2 text-sm text-green-300">
                          Answer: {LETTERS[q.correctIndex]}. {q.options[q.correctIndex]}
                        </p>
                        {q.explanation && <p className="mt-1 text-sm text-gray-300">{q.explanation}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16" role="status">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-6 text-lg text-blue-400">Generating questions on {topic}...</p>
            <p className="text-gray-400 mt-2">
              Building {numQuestions} {difficulty} questions
            </p>
          </div>
        )}

        {/* Quiz */}
        {inQuiz && question && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-xl p-6">
            <div className="mb-6">
              <div className="h-2 w-full bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300"
                  style={{ width: `${percent(current + (answer ? 1 : 0), questions.length)}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-400">
                <span>
                  Question {current + 1} of {questions.length}
                </span>
                <span>Time: {formatTime(elapsed)}</span>
              </div>
            </div>

            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-blue-900 text-blue-200 rounded-full text-sm">{question.category}</span>
                <span
                  className={`px-3 py-1 rounded-full text-sm capitalize ${
                    question.difficulty === 'easy'
                      ? 'bg-green-900 text-green-200'
                      : question.difficulty === 'medium'
                      ? 'bg-yellow-900 text-yellow-200'
                      : 'bg-red-900 text-red-200'
                  }`}
                >
                  {question.difficulty}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="px-3 py-1 bg-purple-900 text-purple-200 rounded-full text-sm">Score: {score}</span>
                <button
                  onClick={() => toggleSaved(question)}
                  className={`p-1 rounded-full ${isSaved(question) ? 'text-yellow-400' : 'text-gray-400 hover:text-gray-300'}`}
                  aria-label={isSaved(question) ? 'Remove from saved questions' : 'Save question'}
                  aria-pressed={isSaved(question)}
                >
                  <Star className="w-5 h-5" fill={isSaved(question) ? 'currentColor' : 'none'} />
                </button>
              </div>
            </div>

            <div className="text-xl font-bold mb-6 text-gray-100">
              <Markdown dark className="prose-lg">
                {question.question}
              </Markdown>
            </div>

            <div className="space-y-4 mb-6">
              {question.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => !answer && setSelected(index)}
                  disabled={Boolean(answer)}
                  className={`w-full text-left p-4 border rounded-lg transition-all duration-200 flex items-baseline gap-3 ${optionClass(index)}`}
                >
                  <span className="font-bold text-gray-300">{LETTERS[index]}.</span>
                  <Markdown dark className="prose-p:my-0">
                    {option}
                  </Markdown>
                </button>
              ))}
            </div>

            {!answer && (
              <div className="flex justify-between mb-4">
                <button onClick={() => setShowHint(!showHint)} className="text-blue-400 hover:text-blue-300 text-sm underline">
                  {showHint ? 'Hide Hint' : 'Show Hint'}
                </button>
                <button
                  className="text-gray-400 hover:text-gray-300 text-sm"
                  onClick={() => confirm('Are you sure you want to skip this question?') && skipQuestion()}
                >
                  Skip Question
                </button>
              </div>
            )}

            {showHint && !answer && (
              <div className="mb-4 p-3 bg-gray-700 rounded-lg border border-blue-500 text-sm">
                <p className="text-blue-300">
                  Hint: {question.hint || `Think about the core principles of ${question.category.toLowerCase()} in ${question.topic}.`}
                </p>
              </div>
            )}

            {answer && (
              <div className="mb-6 p-4 rounded-lg bg-gray-700 border-l-4 border-blue-500" aria-live="polite">
                <p className="font-bold text-lg mb-2">{answer.isCorrect ? '✅ Correct!' : '❌ Incorrect!'}</p>
                <p className="text-gray-300">
                  <span className="font-medium text-blue-400">Explanation:</span>{' '}
                  {question.explanation || `The correct answer is ${LETTERS[question.correctIndex]}.`}
                </p>
              </div>
            )}

            <div className="flex justify-end">
              {!answer ? (
                <button
                  onClick={() => recordAnswer(selected)}
                  disabled={selected === null}
                  className={`px-6 py-3 rounded-lg shadow-lg font-medium transition duration-300 ${
                    selected === null ? 'bg-gray-600 cursor-not-allowed' : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
                  }`}
                >
                  Submit Answer
                </button>
              ) : (
                <button
                  onClick={() => goNext()}
                  className="px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg font-medium transition duration-300"
                >
                  {current + 1 < questions.length ? 'Next Question' : 'View Results'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Results */}
        {showResults && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-xl p-6">
            <h2 className="text-2xl font-bold mb-6 text-center text-blue-400">Quiz Results</h2>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-gradient-to-br from-blue-900 to-blue-800 p-4 rounded-lg text-center shadow-lg">
                <div className="text-3xl font-bold text-blue-300">{score}</div>
                <div className="text-sm text-blue-400">Correct</div>
              </div>
              <div className="bg-gradient-to-br from-red-900 to-red-800 p-4 rounded-lg text-center shadow-lg">
                <div className="text-3xl font-bold text-red-300">{questions.length - score}</div>
                <div className="text-sm text-red-400">Wrong / Skipped</div>
              </div>
              <div className="bg-gradient-to-br from-purple-900 to-purple-800 p-4 rounded-lg text-center shadow-lg">
                <div className="text-3xl font-bold text-purple-300">{percent(score, questions.length)}%</div>
                <div className="text-sm text-purple-400">Score</div>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4 text-gray-200">Performance Analytics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h4 className="text-center text-blue-300 mb-2">Overall Results</h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, percent: p }) => `${name}: ${(p * 100).toFixed(0)}%`}
                        >
                          {pieData.map((d) => (
                            <Cell key={d.name} fill={PIE_COLORS[d.name]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value} questions`, '']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-gray-700 p-4 rounded-lg">
                  <h4 className="text-center text-blue-300 mb-2">Performance by Category</h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoryData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                        <YAxis tick={{ fill: '#9ca3af' }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                        <Tooltip formatter={(v) => [`${v}%`, 'Score']} contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151' }} />
                        <Bar dataKey="percentage" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-8 p-4 bg-gray-700 rounded-lg">
              <h3 className="text-lg font-bold mb-2 text-gray-200">Time Statistics</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-blue-300">{formatTime(elapsed)}</p>
                  <p className="text-sm text-blue-400">Total Time</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-300">{formatTime(Math.floor(elapsed / questions.length))}</p>
                  <p className="text-sm text-green-400">Avg per Question</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-300">
                    {formatTime(Math.max(0, ...answers.map((a) => a?.timeSpent || 0)))}
                  </p>
                  <p className="text-sm text-purple-400">Longest Question</p>
                </div>
              </div>
            </div>

            <h3 className="text-xl font-bold mb-4 text-gray-200">Question Review</h3>
            <div className="space-y-6 mb-8">
              {questions.map((q, qIndex) => {
                const a = answers[qIndex];
                const status = a?.isCorrect ? 'correct' : a?.skipped ? 'skipped' : 'wrong';
                return (
                  <div
                    key={q.id}
                    className={`p-4 rounded-lg border ${
                      status === 'correct' ? 'border-green-500 bg-green-900/20' : status === 'skipped' ? 'border-gray-600 bg-gray-700' : 'border-red-500 bg-red-900/20'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-4 mb-2">
                      <div className="flex gap-2 font-bold text-lg">
                        <span>{qIndex + 1}.</span>
                        <Markdown dark>{q.question}</Markdown>
                      </div>
                      <span className={status === 'correct' ? 'text-green-400' : status === 'skipped' ? 'text-gray-400' : 'text-red-400'}>
                        {status === 'correct' ? '✓' : status === 'skipped' ? 'Skipped' : '✗'}
                      </span>
                    </div>

                    <div className="space-y-2 mt-4">
                      {q.options.map((option, cIndex) => (
                        <div
                          key={cIndex}
                          className={`p-2 border rounded flex items-baseline gap-2 ${
                            cIndex === q.correctIndex
                              ? 'bg-green-900/30 border-green-500'
                              : cIndex === a?.selected
                              ? 'bg-red-900/30 border-red-500'
                              : 'border-gray-600'
                          }`}
                        >
                          <span className="font-bold">{LETTERS[cIndex]}.</span>
                          <Markdown dark className="prose-p:my-0">
                            {option}
                          </Markdown>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 text-sm">
                      <p className="text-blue-400 font-medium">Explanation:</p>
                      <p className="text-gray-300">{q.explanation || `The correct answer is ${LETTERS[q.correctIndex]}.`}</p>
                    </div>

                    <div className="flex justify-between mt-4 text-xs text-gray-400">
                      <span>Category: {q.category}</span>
                      <span>Time spent: {formatTime(a?.timeSpent || 0)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setQuestions([]);
                  setShowResults(false);
                }}
                className="flex-1 py-3 px-6 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition"
              >
                New Quiz
              </button>
              <button
                onClick={() => startQuiz(questions)}
                className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-lg font-medium shadow-lg transition"
              >
                Retry Quiz
              </button>
            </div>
          </div>
        )}

        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Questions are generated by AI and may occasionally contain mistakes.</p>
        </div>
      </div>
    </div>
  );
}
