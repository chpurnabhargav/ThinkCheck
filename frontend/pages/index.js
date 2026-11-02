import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  BookOpen,
  FileText,
  Map,
  NotebookPen,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  X,
  Check,
  GraduationCap,
  ClipboardList,
  Target,
} from 'lucide-react';

const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

// Sample questions for the in-page demo (no API call needed).
const demoQuestions = [
  {
    question: "What is the primary purpose of React's useEffect hook?",
    options: [
      'To create new state variables',
      'To handle side effects in functional components',
      'To replace class components entirely',
      'To optimize rendering performance',
    ],
    correctAnswer: 1,
    explanation:
      'The useEffect hook manages side effects like data fetching, subscriptions, or DOM manipulation in functional components.',
  },
  {
    question: 'Which data structure uses the LIFO (Last In, First Out) principle?',
    options: ['Queue', 'Linked List', 'Stack', 'Binary Tree'],
    correctAnswer: 2,
    explanation: 'Stacks follow the LIFO principle: the most recently added element is the first one removed.',
  },
  {
    question: 'Which algorithm has O(n log n) average time complexity?',
    options: ['Bubble Sort', 'Quick Sort', 'Insertion Sort', 'Selection Sort'],
    correctAnswer: 1,
    explanation: 'Quick Sort averages O(n log n), though its worst case is O(n²).',
  },
];

const testimonials = [
  {
    text: "ThinkCheck has transformed my exam preparation process. The adaptive question algorithm somehow knows exactly which concepts I'm struggling with and targets them precisely. After just 3 weeks, I improved my practice test scores by 24%.",
    name: 'Gowtham M',
    role: 'Computer Science Student',
    image: '/gowtham.jpg',
  },
  {
    text: "I was skeptical at first, but ThinkCheck's personalized learning paths helped me tackle my Algorithm Analysis course when I was falling behind. The visual explanations and instant feedback cleared up misconceptions I didn't realize I had.",
    name: 'Kavya Kanne',
    role: 'CS Student',
    image: '/kavya.jpg',
  },
  {
    text: 'Preparing for my CISSP certification was overwhelming until I found ThinkCheck. The practice scenarios mirror real exam questions so well that the actual test felt familiar. The analytics helped me identify and strengthen weak areas in cryptography and network security.',
    name: 'Nishanth',
    role: 'Cybersecurity Aspirant',
    image: '/nishanth.jpg',
  },
];

const modes = [
  {
    href: '/mcq',
    label: 'MCQ Mode',
    icon: BookOpen,
    button: 'from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700',
    iconColor: 'text-emerald-500',
    description:
      'Generate multiple-choice quizzes on any topic, choose difficulty and categories, get hints and explanations, then review a per-category breakdown.',
  },
  {
    href: '/written',
    label: 'Written Mode',
    icon: FileText,
    button: 'from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700',
    iconColor: 'text-purple-500',
    description:
      'Answer open-ended questions in your own words. AI grades each answer against a rubric and shows the key points you missed.',
  },
  {
    href: '/STS',
    label: 'Straight To Success',
    icon: Map,
    button: 'from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700',
    iconColor: 'text-blue-500',
    description:
      'Get a week-by-week learning roadmap for your level and timeframe, with concrete tasks and mini-projects. Download it as Word or text.',
  },
  {
    href: '/Notes',
    label: 'Notes',
    icon: NotebookPen,
    button: 'from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700',
    iconColor: 'text-sky-500',
    description:
      'Generate structured study notes in the style you prefer (concise, detailed or visual) and download them for revision.',
  },
];

const Home = () => {
  const router = useRouter();
  const featureSectionRef = useRef(null);
  const [scrolled, setScrolled] = useState(false);
  const [animateHeader, setAnimateHeader] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [testimonialIndex, setTestimonialIndex] = useState(0);

  const [showDemo, setShowDemo] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    const animationTimer = setTimeout(() => setAnimateHeader(true), 100);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(animationTimer);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTestimonialIndex((prev) => (prev + 1) % testimonials.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Close the demo with Escape.
  useEffect(() => {
    if (!showDemo) return;
    const onKey = (e) => e.key === 'Escape' && setShowDemo(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showDemo]);

  const demo = demoQuestions[currentQuestion];
  const answeredCorrectly = answerSubmitted && selectedAnswer === demo.correctAnswer;

  const handleNextQuestion = () => {
    setCurrentQuestion((prev) => (prev + 1) % demoQuestions.length);
    setSelectedAnswer(null);
    setAnswerSubmitted(false);
  };

  const muted = darkMode ? 'text-gray-400' : 'text-gray-600';

  return (
    <div
      className={`flex flex-col min-h-screen transition-colors duration-500 ${
        darkMode ? 'bg-gradient-to-b from-gray-900 to-black text-white' : 'bg-gradient-to-b from-blue-50 to-purple-50 text-gray-900'
      }`}
    >
      <Head>
        <title>ThinkCheck: AI-powered learning</title>
      </Head>

      {/* Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled
            ? `${darkMode ? 'bg-black/85' : 'bg-white/85'} backdrop-blur-lg shadow-lg shadow-blue-500/10`
            : 'bg-transparent'
        }`}
      >
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
            ThinkCheck
          </span>
          <button
            onClick={() => setDarkMode((prev) => !prev)}
            className={`p-2 rounded-full transition-all duration-300 transform hover:scale-110 ${
              darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'
            }`}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden py-24">
        <div className="absolute inset-0 z-0" aria-hidden="true">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-green-500 rounded-full mix-blend-multiply blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
          <div className="absolute bottom-1/3 right-1/3 w-64 h-64 bg-pink-500 rounded-full mix-blend-multiply blur-3xl opacity-10 animate-blob animation-delay-6000"></div>
        </div>

        <div className="container mx-auto px-6 z-10 mt-16">
          <div
            className={`flex flex-col items-center text-center transform transition-all duration-1000 ${
              animateHeader ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}
          >
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
                ThinkCheck
              </span>
            </h1>
            <p className={`text-xl md:text-2xl mb-10 max-w-3xl mx-auto font-light ${darkMode ? 'text-blue-100' : 'text-gray-700'}`}>
              Evaluate your expertise with precision, expand your understanding with
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500 font-medium"> AI-generated practice </span>
              tailored to your unique learning journey
            </p>

            <div className="flex flex-col md:flex-row flex-wrap gap-4 justify-center">
              {modes.map(({ href, label, icon: Icon, button }) => (
                <button
                  key={href}
                  onClick={() => router.push(href)}
                  className={`px-8 py-4 bg-gradient-to-r ${button} text-white rounded-xl flex items-center justify-center transition-all duration-300 transform hover:scale-105 hover:shadow-xl shadow-md`}
                >
                  <Icon className="w-5 h-5 mr-2" aria-hidden="true" />
                  <span className="text-lg font-medium">{label}</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowDemo(true)}
              className={`mt-6 inline-flex items-center text-sm font-medium underline-offset-4 hover:underline ${
                darkMode ? 'text-blue-300' : 'text-blue-700'
              }`}
            >
              Try a sample question first
              <ChevronRight className="ml-1 w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <button
          onClick={() => featureSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          className={`absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce ${muted}`}
          aria-label="Scroll to features"
        >
          <ChevronDown className="w-8 h-8" />
        </button>
      </section>

      {/* Features */}
      <section className="py-20 relative" ref={featureSectionRef}>
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
              Four Ways to Learn
            </h2>
            <p className={`text-lg max-w-2xl mx-auto ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Pick a topic, any topic. ThinkCheck uses generative AI to build practice material for it on the spot.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {modes.map(({ href, label, icon: Icon, iconColor, description }) => (
              <button
                key={href}
                onClick={() => router.push(href)}
                className={`${
                  darkMode ? 'bg-gradient-to-b from-gray-800 to-gray-900 border-gray-700' : 'bg-white border-gray-200'
                } text-left rounded-2xl p-8 shadow-xl border hover:border-blue-500 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl group`}
              >
                <div className="flex justify-center mb-4">
                  <div
                    className={`p-3 rounded-full ${
                      darkMode ? 'bg-gray-700 group-hover:bg-gray-600' : 'bg-blue-50 group-hover:bg-blue-100'
                    } transition-colors duration-300`}
                  >
                    <Icon className={`w-8 h-8 ${iconColor}`} aria-hidden="true" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-center">{label}</h3>
                <p className={`${muted} text-center`}>{description}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Demo modal */}
      {showDemo && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="demo-title"
          onClick={(e) => e.target === e.currentTarget && setShowDemo(false)}
        >
          <div className={`relative w-full max-w-lg p-8 ${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl`}>
            <button
              onClick={() => setShowDemo(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors duration-300"
              aria-label="Close demo"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="text-center mb-8">
              <h3 id="demo-title" className="text-2xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
                ThinkCheck Demo
              </h3>
              <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>A taste of MCQ mode with sample questions</p>
            </div>

            <div className="flex justify-between mb-3 text-sm text-blue-500 font-medium">
              <span>
                Question {currentQuestion + 1} of {demoQuestions.length}
              </span>
              <span>Technical Knowledge</span>
            </div>
            <div className={`p-6 rounded-xl mb-6 ${darkMode ? 'bg-gray-800' : 'bg-blue-50'}`}>
              <h4 className="text-lg font-medium mb-4">{demo.question}</h4>
              <div className="space-y-3">
                {demo.options.map((option, index) => {
                  const isCorrect = index === demo.correctAnswer;
                  const isSelected = index === selectedAnswer;
                  let style = darkMode ? 'bg-gray-700 hover:bg-gray-600 border-gray-600' : 'bg-gray-100 hover:bg-gray-200 border-gray-200';
                  if (answerSubmitted && isCorrect) style = 'bg-green-100 border-green-500 text-green-800';
                  else if (answerSubmitted && isSelected) style = 'bg-red-100 border-red-500 text-red-800';
                  else if (isSelected) style = 'bg-blue-100 border-blue-500 text-blue-800';

                  return (
                    <button
                      key={index}
                      onClick={() => !answerSubmitted && setSelectedAnswer(index)}
                      disabled={answerSubmitted}
                      className={`w-full text-left p-4 rounded-xl transition-all duration-300 border-2 ${style}`}
                    >
                      <span className="flex items-center">
                        <span
                          className={`w-6 h-6 rounded-full mr-3 flex items-center justify-center shrink-0 ${
                            answerSubmitted && isCorrect
                              ? 'bg-green-500'
                              : answerSubmitted && isSelected
                              ? 'bg-red-500'
                              : isSelected
                              ? 'bg-blue-500'
                              : darkMode
                              ? 'bg-gray-600'
                              : 'bg-gray-300'
                          }`}
                        >
                          {answerSubmitted && isCorrect && <Check className="w-4 h-4 text-white" />}
                          {answerSubmitted && isSelected && !isCorrect && <X className="w-4 h-4 text-white" />}
                        </span>
                        <span className="font-medium">{option}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {answerSubmitted && (
              <p
                className={`mb-6 p-4 rounded-xl text-sm ${
                  answeredCorrectly ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-900'
                }`}
                aria-live="polite"
              >
                <strong>{answeredCorrectly ? 'Correct! ' : 'Not quite. '}</strong>
                {demo.explanation}
              </p>
            )}

            <div className="flex justify-between gap-4">
              {!answerSubmitted ? (
                <button
                  onClick={() => setAnswerSubmitted(true)}
                  disabled={selectedAnswer === null}
                  className={`px-6 py-3 rounded-xl transition-all duration-300 ${
                    selectedAnswer !== null
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Submit Answer
                </button>
              ) : (
                <button
                  onClick={handleNextQuestion}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                >
                  Next Question
                </button>
              )}
              <button
                onClick={() => router.push('/mcq')}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-800 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 flex items-center"
              >
                Generate my own
                <ArrowRight className="ml-2 w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Testimonials */}
      <section className={`py-20 ${darkMode ? 'bg-gradient-to-r from-blue-900 to-purple-900' : 'bg-gradient-to-r from-blue-50 to-purple-50'}`}>
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-center mb-12">
              <div className="px-6 py-2 rounded-full bg-blue-500/10 text-blue-500 font-semibold">REVIEWS</div>
            </div>

            <div className="relative h-96 md:h-72">
              {testimonials.map((testimonial, index) => (
                <div
                  key={testimonial.name}
                  aria-hidden={testimonialIndex !== index}
                  className={`absolute top-0 left-0 w-full transition-all duration-1000 transform ${
                    testimonialIndex === index
                      ? 'opacity-100 translate-x-0'
                      : testimonialIndex > index
                      ? 'opacity-0 -translate-x-full'
                      : 'opacity-0 translate-x-full'
                  }`}
                >
                  <div className={`p-8 rounded-2xl mb-8 ${darkMode ? 'bg-gray-800/50' : 'bg-white'} shadow-xl`}>
                    <p className="text-lg md:text-2xl font-light mb-8 italic text-center">&ldquo;{testimonial.text}&rdquo;</p>
                    <div className="flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-blue-500 shadow-lg">
                        <img src={testimonial.image} alt={testimonial.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="ml-4 text-left">
                        <h4 className="font-bold">{testimonial.name}</h4>
                        <p className={`text-sm ${muted}`}>{testimonial.role}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center mt-4">
              {testimonials.map((t, index) => (
                <button
                  key={t.name}
                  onClick={() => setTestimonialIndex(index)}
                  className={`w-3 h-3 mx-1 rounded-full transition-all duration-300 ${
                    testimonialIndex === index ? 'bg-blue-500 scale-125' : darkMode ? 'bg-gray-600' : 'bg-gray-300'
                  }`}
                  aria-label={`View testimonial ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
              How ThinkCheck Works
            </h2>
            <p className={`text-lg max-w-2xl mx-auto ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Our platform is designed to make learning assessment seamless and effective
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: GraduationCap,
                color: darkMode ? 'bg-blue-900 text-blue-400' : 'bg-blue-100 text-blue-500',
                title: 'Choose a Topic',
                text: 'Type any subject (DBMS, React hooks, photosynthesis) and pick a difficulty and focus area.',
              },
              {
                icon: ClipboardList,
                color: darkMode ? 'bg-purple-900 text-purple-400' : 'bg-purple-100 text-purple-500',
                title: 'Practice',
                text: 'Answer AI-generated multiple-choice or written questions, or follow a generated roadmap.',
              },
              {
                icon: Target,
                color: darkMode ? 'bg-green-900 text-green-400' : 'bg-green-100 text-green-500',
                title: 'Get Feedback',
                text: 'See explanations, rubric-based scores, missed key points and a breakdown by category.',
              },
            ].map(({ icon: Icon, color, title, text }) => (
              <div key={title} className={`p-8 rounded-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-xl`}>
                <div className="flex justify-center mb-6">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${color}`}>
                    <Icon className="w-8 h-8" aria-hidden="true" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-4 text-center">{title}</h3>
                <p className={`${muted} text-center`}>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={`py-20 ${darkMode ? 'bg-gradient-to-r from-indigo-900 to-purple-900' : 'bg-gradient-to-r from-indigo-50 to-purple-50'}`}>
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
              Ready to Transform Your Learning Experience?
            </h2>
            <p className={`text-xl mb-10 ${darkMode ? 'text-blue-200' : 'text-gray-700'}`}>
              Pick a mode and start practising on any topic in seconds.
            </p>
            <button
              onClick={() => router.push('/mcq')}
              className="px-10 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl text-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center mx-auto"
            >
              <span>Start a Quiz</span>
              <ArrowRight className="ml-2 w-6 h-6" aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-12 ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="md:col-span-2">
              <span className="block mb-6 text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
                THINK CHECK
              </span>
              <p className={`mb-6 max-w-md ${muted}`}>
                Revolutionizing the way students test and consolidate their knowledge through AI-powered assessment tools.
              </p>
            </div>
            <div>
              <h4 className={`text-lg font-semibold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Features</h4>
              <ul className={`space-y-4 ${muted}`}>
                {modes.map(({ href, label }) => (
                  <li key={href}>
                    <button onClick={() => router.push(href)} className="hover:text-blue-500 transition-colors duration-300">
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className={`border-t ${darkMode ? 'border-gray-800' : 'border-gray-300'} mt-12 pt-8 flex flex-col md:flex-row justify-between items-center`}>
            <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
              © {new Date().getFullYear()} THINK CHECK. All rights reserved.
            </p>
            <a
              href="https://github.com/chpurnabhargav/thinkcheck"
              target="_blank"
              rel="noopener noreferrer"
              className={`mt-4 md:mt-0 text-sm hover:text-blue-500 transition-colors duration-300 ${
                darkMode ? 'text-gray-500' : 'text-gray-600'
              }`}
            >
              Source on GitHub
            </a>
          </div>
        </div>
      </footer>

      {/* Back to top */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 p-3 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 z-20 ${
          scrolled ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
        } ${darkMode ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-white hover:bg-gray-100 text-gray-800'}`}
        aria-label="Back to top"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      </button>
    </div>
  );
};

export default Home;
