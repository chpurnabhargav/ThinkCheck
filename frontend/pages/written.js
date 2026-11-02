import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { ArrowLeft, Send, AlertCircle, Info, Loader } from 'lucide-react';
import { useRouter } from 'next/router';
import { postJSON } from '../lib/api';

const MAX_QUESTIONS = 5; // must match the backend limit

const WrittenModePage = () => {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(true);
  // States for quiz setup form
  const [topic, setTopic] = useState('');
  const [numQuestions, setNumQuestions] = useState(3);
  const [difficulty, setDifficulty] = useState('medium');
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // States for quiz session
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [showSetup, setShowSetup] = useState(true);
  const [allSubmitted, setAllSubmitted] = useState(false);
  const [feedback, setFeedback] = useState([]);
  const [overallScore, setOverallScore] = useState(null);
  
  // Available categories and difficulty levels
  const availableCategories = [
    'Fundamentals', 'Definitions', 'Practical Applications', 
    'History', 'Advanced Concepts'
  ];
  
  const difficultyLevels = ['easy', 'medium', 'hard'];

  // Toggle theme function
  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  // Initialize answers array when questions are loaded
  useEffect(() => {
    if (questions.length > 0) {
      setAnswers(new Array(questions.length).fill(''));
    }
  }, [questions]);

  const handleAnswerChange = (index, value) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  const toggleCategory = (category) => {
    if (categories.includes(category)) {
      setCategories(categories.filter(c => c !== category));
    } else {
      setCategories([...categories, category]);
    }
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError("Please enter a topic");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await postJSON('/generate-written', {
        topic: topic.trim(),
        numQuestions,
        difficulty,
        categories: categories.length ? categories : availableCategories,
      });
      setQuestions(data.questions);
      setShowSetup(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const hasValidAnswers = () => {
    return answers.every(answer => answer.trim().length > 0);
  };

  const resetQuiz = () => {
    // Reset all states to initial values for a new quiz
    setQuestions([]);
    setAnswers([]);
    setFeedback([]);
    setOverallScore(null);
    setAllSubmitted(false);
    setShowSetup(true);
    setError(null);
  };
  
  // Helper function to calculate grade based on percentage
  const calculateGrade = (percentage) => {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };
  
  // Helper function to generate comment based on percentage
  const generateOverallComment = (percentage) => {
    if (percentage >= 90) return 'Excellent! You have a strong understanding of the material.';
    if (percentage >= 80) return 'Good job! You understand most of the concepts well.';
    if (percentage >= 70) return 'Decent work. You have a moderate understanding of the subject.';
    if (percentage >= 60) return 'You have a basic understanding, but need more practice.';
    return 'You need to review the material more thoroughly.';
  };
  
  const evaluateAnswers = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await postJSON('/evaluate-answers', {
        questions: questions.map((q) => q.question),
        answers,
        topic,
        difficulty,
      });
      setFeedback(data.feedback);
      setOverallScore(data.overallScore);
      setAllSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError('Evaluation failed: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      <Head>
        <title>Written Mode · ThinkCheck</title>
      </Head>
      {/* Header */}
      <header className={`py-4 px-6 flex justify-between items-center ${darkMode ? 'bg-black' : 'bg-white'} shadow`}>
        <div className="flex items-center">
          <button
            onClick={() => router.push('/')}
            className="mr-4 hover:text-blue-500"
            aria-label="Back to home"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500">
            ThinkCheck Written Mode
          </h1>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-full ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'}`}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto py-8 px-4">
        {showSetup ? (
          /* Quiz Setup Form */
          <div className={`p-6 rounded-lg shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className="text-2xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
              Written Quiz Generator
            </h2>
            
            {error && (
              <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded">
                <p className="flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  {error}
                </p>
              </div>
            )}
            
            <div className="space-y-6">
              <div>
                <label htmlFor="topic" className="block mb-2 font-medium">Topic/Concept:</label>
                <input
                  id="topic"
                  type="text"
                  maxLength={200}
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. DBMS, JavaScript, React Hooks"
                  className={`w-full p-3 rounded-md ${
                    darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'
                  }`}
                />
              </div>
              
              <div>
                <span className="block mb-2 font-medium">Number of Questions:</span>
                <div className="grid grid-cols-5 gap-3">
                  {Array.from({ length: MAX_QUESTIONS }, (_, i) => i + 1).map((num) => (
                    <button
                      key={num}
                      onClick={() => setNumQuestions(num)}
                      aria-pressed={numQuestions === num}
                      className={`py-2 rounded-md ${
                        numQuestions === num
                          ? 'bg-blue-600 text-white'
                          : darkMode
                          ? 'bg-gray-700 hover:bg-gray-600'
                          : 'bg-gray-200 hover:bg-gray-300'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <span className="block mb-2 font-medium">Difficulty Level:</span>
                <div className="grid grid-cols-3 gap-3">
                  {difficultyLevels.map((level) => (
                    <button
                      key={level}
                      onClick={() => setDifficulty(level)}
                      className={`py-3 rounded-md text-center capitalize ${
                        difficulty === level
                          ? level === 'easy'
                            ? 'bg-green-600 text-white'
                            : level === 'medium'
                            ? 'bg-blue-600 text-white'
                            : 'bg-red-600 text-white'
                          : darkMode
                          ? 'bg-gray-700 hover:bg-gray-600'
                          : 'bg-gray-200 hover:bg-gray-300'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <span className="block mb-2 font-medium">Categories:</span>
                <div className="grid grid-cols-2 gap-3">
                  {availableCategories.map((category) => (
                    <button
                      key={category}
                      onClick={() => toggleCategory(category)}
                      className={`p-3 rounded-md text-center ${
                        categories.includes(category)
                          ? 'bg-purple-600 text-white'
                          : darkMode
                          ? 'bg-gray-700 hover:bg-gray-600'
                          : 'bg-gray-200 hover:bg-gray-300'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
                <p className="text-sm mt-2 text-gray-400">
                  {categories.length === 0 ? 'All categories will be included' : `Selected ${categories.length} categories`}
                </p>
              </div>
              
              <button
                onClick={handleGenerate}
                disabled={isLoading || !topic.trim()}
                className={`w-full py-4 rounded-md text-white text-lg font-medium ${
                  isLoading || !topic.trim()
                    ? 'bg-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <Loader className="w-5 h-5 mr-2 animate-spin" />
                    Generating...
                  </span>
                ) : (
                  'Generate Quiz'
                )}
              </button>
            </div>
          </div>
        ) : (
          !allSubmitted ? (
            /* Questions with answer inputs */
            <div className="space-y-8">
              {error && (
                <div className="p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded mb-6">
                  <p className="flex items-center">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    {error}
                  </p>
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">
                  Topic: <span className="text-blue-500">{topic}</span>
                </h2>
                <span className="text-sm px-3 py-1 rounded-full bg-blue-100 text-blue-800">
                  {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                </span>
              </div>
             
              {questions.map((question, index) => (
                <div key={index} className={`p-6 rounded-lg shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold flex-grow">
                      Question {index + 1} of {questions.length}
                    </h3>
                    <span className={`px-3 py-1 text-xs rounded-full ${
                      darkMode ? 'bg-gray-700' : 'bg-gray-100'
                    }`}>
                      {question.category}
                    </span>
                  </div>
                 
                  <div className="mb-6">
                    <p className="whitespace-pre-line">{question.question}</p>
                  </div>
                 
                  <div>
                    <label className="block mb-2 font-medium">Your Answer:</label>
                    <textarea
                      value={answers[index] || ''}
                      onChange={(e) => handleAnswerChange(index, e.target.value)}
                      placeholder="Type your answer here..."
                      className={`w-full p-4 rounded-md ${
                        darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'
                      } min-h-[150px] resize-y`}
                    />
                   
                    {answers[index] && (
                      <div className="text-right mt-2 text-sm">
                        Word count: {answers[index].split(/\s+/).filter(Boolean).length}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Submit button section */}
              <div className="flex justify-end mt-8">
                <button
                  onClick={evaluateAnswers}
                  disabled={isLoading || !hasValidAnswers()}
                  className={`flex items-center px-6 py-3 rounded-md text-white font-medium ${
                    isLoading || !hasValidAnswers()
                      ? 'bg-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700'
                  }`}
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <Loader className="w-5 h-5 mr-2 animate-spin" />
                      Evaluating...
                    </span>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Submit Answers
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Results and Feedback */
            <div className="space-y-8">
              <div className={`p-6 rounded-lg shadow text-center ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <h2 className="text-lg font-medium opacity-80">Overall Score</h2>
                <div className="flex items-center justify-center gap-6 my-4">
                  <span className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
                    {overallScore}%
                  </span>
                  <span className={`text-4xl font-bold w-16 h-16 rounded-full flex items-center justify-center ${
                    overallScore >= 80 ? 'bg-green-100 text-green-800' : overallScore >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {calculateGrade(overallScore)}
                  </span>
                </div>
                <p className="mb-2">{generateOverallComment(overallScore)}</p>
                {feedback.some((f) => f.error) && (
                  <p className="text-sm text-amber-500">Some answers could not be graded and are excluded from the overall score.</p>
                )}
                <button
                  onClick={resetQuiz}
                  className="w-full py-3 mt-4 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                >
                  Create New Quiz
                </button>
              </div>
              
              <h3 className="text-xl font-bold">Detailed Feedback</h3>
              
              {questions.map((question, index) => (
                <div key={index} className={`p-6 rounded-lg shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold">
                      Question {index + 1}
                    </h3>
                    <span className={`px-4 py-1 rounded-full ${
                      typeof feedback?.[index]?.score !== 'number'
                        ? 'bg-gray-200 text-gray-700'
                        : feedback[index].score >= 80
                        ? 'bg-green-100 text-green-800'
                        : feedback[index].score >= 60
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {typeof feedback?.[index]?.score === 'number' ? `Score: ${feedback[index].score}%` : 'Not graded'}
                    </span>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Question:</h4>
                    <p className="whitespace-pre-line">{question.question}</p>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Your Answer:</h4>
                    <div className={`p-4 rounded-md ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <p className="whitespace-pre-line">{answers[index]}</p>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Feedback:</h4>
                    <p>{feedback && feedback[index] && feedback[index].comments ? 
                      feedback[index].comments : 
                      "No feedback available."}
                    </p>
                  </div>
                  
                  {feedback?.[index]?.keyPoints?.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-medium mb-2">What a full-marks answer covers:</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        {feedback[index].keyPoints.map((point, i) => (
                          <li key={i}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div>
                    <h4 className="font-medium mb-2">Suggestions for Improvement:</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {feedback && feedback[index] && feedback[index].suggestions && 
                      feedback[index].suggestions.length > 0 ? 
                        feedback[index].suggestions.map((suggestion, i) => (
                          <li key={i}>{suggestion}</li>
                        )) : 
                        <li>No suggestions available.</li>
                      }
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </main>

      {/* Footer */}
      <footer className={`py-4 px-6 text-center ${darkMode ? 'bg-black text-gray-400' : 'bg-white text-gray-600'} mt-8`}>
        <div className="flex justify-center items-center space-x-2">
          <Info className="w-4 h-4" />
          <p className="text-sm">Questions and grades are generated by AI and may occasionally be inaccurate.</p>
        </div>
      </footer>
    </div>
  );
};

export default WrittenModePage;