import { useState, useEffect } from "react";
import axios from "axios";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import ReactMarkdown from "react-markdown";
import { vscDarkPlus, atomDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { coy } from 'react-syntax-highlighter/dist/cjs/styles/prism';
const MCQQuizGenerator = () => {
  // State management
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [userAnswers, setUserAnswers] = useState([]);
  const [quizHistory, setQuizHistory] = useState([]);
  const [timeSpent, setTimeSpent] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [categoryPerformance, setCategoryPerformance] = useState({});
  const [difficulty, setDifficulty] = useState("medium");
  const [showHint, setShowHint] = useState(false);
  const [bookmarks, setBookmarks] = useState([]);
  const [progressPercentage, setProgressPercentage] = useState(0);
  
  // Input states
  const [topic, setTopic] = useState("");
  const [numQuestions, setNumQuestions] = useState(5);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([
    "Fundamentals", "Definitions", "Practical Applications", "History", "Advanced Concepts"
  ]);

  // Timer effect
  useEffect(() => {
    let timer;
    if (questions.length > 0 && !showResults && startTime) {
      timer = setInterval(() => {
        setTimeSpent(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [questions, showResults, startTime]);

  // Calculate progress percentage
  useEffect(() => {
    if (questions.length > 0) {
      const progress = ((currentQuestion + (answerSubmitted ? 1 : 0)) / questions.length) * 100;
      setProgressPercentage(progress);
    }
  }, [currentQuestion, answerSubmitted, questions.length]);

  // Generate MCQs function
  const generateMCQs = async () => {
    if (!topic || !numQuestions) {
      setError("Please enter a topic and number of questions");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      const response = await axios.post("https://thinkcheck.onrender.com/generate-mcq", {
        topic,
        numQuestions: parseInt(numQuestions),
        difficulty,
        categories: selectedCategories.length > 0 ? selectedCategories : availableCategories
      });
      
      console.log("API Response:", response.data);
      
      // Check if we have questions in the response
      if (response.data.questions && response.data.questions.length > 0) {
        // Enhance questions with category metadata if not present
        const enhancedQuestions = response.data.questions.map((q, index) => ({
          ...q,
          category: q.category || availableCategories[index % availableCategories.length],
          difficulty: q.difficulty || difficulty,
          id: `q-${Date.now()}-${index}`
        }));
        
        setQuestions(enhancedQuestions);
        setCurrentQuestion(0);
        setSelectedAnswer(null);
        setAnswerSubmitted(false);
        setScore(0);
        setUserAnswers([]);
        setShowResults(false);
        setTimeSpent(0);
        setStartTime(Date.now());
        setShowHint(false);
        setLoading(false);
      } else {
        throw new Error("No questions returned from API");
      }
    } catch (error) {
      console.error("Error fetching MCQs:", error);
      setError("Failed to load questions. Please check the server logs.");
      console.error()
      setLoading(false);
    }
  };

  // Handle Answer Selection
  const handleAnswerSelect = (index) => {
    if (!answerSubmitted) {
      setSelectedAnswer(index);
    }
  };

  // Handle Answer Submission
  const handleSubmitAnswer = () => {
    if (selectedAnswer !== null) {
      setAnswerSubmitted(true);
      
      // Check if selected answer is correct
      const currentQ = questions[currentQuestion];
      const correctAnswerLetter = currentQ.correctAnswer;
      
      // Find the index of the correct answer in the choices array
      const correctOptionIndex = currentQ.choices.findIndex(choice =>
        choice.startsWith(correctAnswerLetter + ")")
      );
      
      const isCorrect = selectedAnswer === correctOptionIndex;
      
      if (isCorrect) {
        setScore(score + 1);
      }
      
      // Store user's answer
      setUserAnswers([...userAnswers, {
        questionIndex: currentQuestion,
        selectedAnswer,
        isCorrect,
        correctOptionIndex,
        timeSpent: Math.floor((Date.now() - startTime) / 1000) - timeSpent,
        category: currentQ.category,
        difficulty: currentQ.difficulty
      }]);
    }
  };

  // Handle Next Question
  const handleNextQuestion = () => {
    if (currentQuestion + 1 < questions.length) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setAnswerSubmitted(false);
      setShowHint(false);
    } else {
      finishQuiz();
    }
  };

  // Finish Quiz
  const finishQuiz = () => {
    // Calculate performance metrics
    const totalTime = Math.floor((Date.now() - startTime) / 1000);
    const categoryStats = {};
    
    userAnswers.forEach(answer => {
      const category = questions[answer.questionIndex].category;
      if (!categoryStats[category]) {
        categoryStats[category] = { correct: 0, total: 0 };
      }
      categoryStats[category].total += 1;
      if (answer.isCorrect) {
        categoryStats[category].correct += 1;
      }
    });
    
    setCategoryPerformance(categoryStats);
    
    // Save quiz history
    const quizResult = {
      id: Date.now(),
      topic,
      score,
      totalQuestions: questions.length,
      totalTime,
      difficulty,
      date: new Date().toISOString(),
      categoryStats
    };
    
    setQuizHistory([...quizHistory, quizResult]);
    localStorage.setItem("quizHistory", JSON.stringify([...quizHistory, quizResult]));
    
    setShowResults(true);
  };

  // Toggle bookmark
  const toggleBookmark = (questionIndex) => {
    const isBookmarked = bookmarks.includes(questions[questionIndex].id);
    
    if (isBookmarked) {
      setBookmarks(bookmarks.filter(id => id !== questions[questionIndex].id));
    } else {
      setBookmarks([...bookmarks, questions[questionIndex].id]);
    }
    
    localStorage.setItem("bookmarkedQuestions", JSON.stringify(
      isBookmarked 
        ? bookmarks.filter(id => id !== questions[questionIndex].id)
        : [...bookmarks, questions[questionIndex].id]
    ));
  };

  // Load bookmarks on component mount
  useEffect(() => {
    const savedBookmarks = localStorage.getItem("bookmarkedQuestions");
    if (savedBookmarks) {
      setBookmarks(JSON.parse(savedBookmarks));
    }
    
    const savedHistory = localStorage.getItem("quizHistory");
    if (savedHistory) {
      setQuizHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Generate category performance data for charts
  const getCategoryPerformanceData = () => {
    return Object.keys(categoryPerformance).map(category => ({
      name: category,
      correct: categoryPerformance[category].correct,
      total: categoryPerformance[category].total,
      percentage: Math.round((categoryPerformance[category].correct / categoryPerformance[category].total) * 100)
    }));
  };

// Find the existing FormattedQuestion component and replace it with this improved version
const FormattedQuestion = ({ questionText }) => {
  return (
    <div className="question-content">
      <ReactMarkdown
        components={{
          code({node, inline, className, children, ...props}) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <SyntaxHighlighter
                style={vscDarkPlus}  // Changed from vscDarkPlus to atomDark
                language={match[1]}
                PreTag="div"
                className="my-4 rounded-md overflow-auto"
                showLineNumbers={true}
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className="px-2 py-1 bg-gray-800 rounded text-white" {...props}>
                {children}
              </code>
            );
          }
        }}
      >
        {questionText}
      </ReactMarkdown>
    </div>
  );
};
  // Create pie chart data
  const getPieChartData = () => {
    return [
      { name: "Correct", value: score },
      { name: "Incorrect", value: questions.length - score }
    ];
  };

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Handle category selection
  const handleCategoryChange = (category) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(cat => cat !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  // Generate dynamic example questions based on user's topic
  const getExampleQuestions = () => {
    if (!topic) return [];
    
    const examples = [
      `What is the primary purpose of ${topic}?`,
      `Which of the following is NOT a characteristic of ${topic}?`,
      `In what year was ${topic} first introduced?`,
      `Who is considered the father/founder of ${topic}?`,
      `How does ${topic} compare to related concepts?`
    ];
    
    return examples;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
          Advanced MCQ Quiz Generator
        </h1>
        
        {/* Setup form */}
        {!loading && questions.length === 0 && !showResults && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-6 mb-6">
            <div className="mb-6">
              <label className="block font-medium mb-2 text-gray-300">Topic/Concept:</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                placeholder="e.g. DBMS, JavaScript, React Hooks"
              />
              
              {topic && (
                <div className="mt-3 bg-gray-700 p-3 rounded-lg">
                  <p className="text-sm text-blue-400 mb-2">Example questions for this topic:</p>
                  <ul className="text-sm text-gray-300 space-y-1">
                    {getExampleQuestions().slice(0, 3).map((q, i) => (
                      <li key={i} className="pl-2 border-l-2 border-blue-500">• {q}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            <div className="mb-6">
              <label className="block font-medium mb-2 text-gray-300">Number of Questions:</label>
              <input
                type="number"
                value={numQuestions}
                onChange={(e) => setNumQuestions(e.target.value)}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                min="1"
                max="20"
              />
              <div className="mt-2 flex justify-between">
                <button 
                  onClick={() => setNumQuestions(5)} 
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-md text-sm"
                >
                  5
                </button>
                <button 
                  onClick={() => setNumQuestions(10)} 
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-md text-sm"
                >
                  10
                </button>
                <button 
                  onClick={() => setNumQuestions(15)} 
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-md text-sm"
                >
                  15
                </button>
                <button 
                  onClick={() => setNumQuestions(20)} 
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-md text-sm"
                >
                  20
                </button>
              </div>
            </div>

            <div className="mb-6">
              <label className="block font-medium mb-2 text-gray-300">Difficulty Level:</label>
              <div className="flex space-x-4">
                {["easy", "medium", "hard"].map((level) => (
                  <button
                    key={level}
                    onClick={() => setDifficulty(level)}
                    className={`flex-1 py-2 rounded-lg capitalize ${
                      difficulty === level 
                        ? 'bg-blue-600 border border-blue-400' 
                        : 'bg-gray-700 border border-gray-600 hover:bg-gray-600'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block font-medium mb-2 text-gray-300">Categories:</label>
              <div className="grid grid-cols-2 gap-2">
                {availableCategories.map((category) => (
                  <div 
                    key={category}
                    onClick={() => handleCategoryChange(category)}
                    className={`p-2 rounded-lg cursor-pointer border ${
                      selectedCategories.includes(category)
                        ? 'bg-blue-600 border-blue-400'
                        : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                    }`}
                  >
                    {category}
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-400 mt-2">
                {selectedCategories.length === 0 
                  ? "All categories will be included" 
                  : `Selected ${selectedCategories.length} categories`}
              </p>
            </div>
            
            <button 
              onClick={generateMCQs}
              className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-lg font-medium shadow-lg transition duration-300 ease-in-out"
            >
              Generate Quiz
            </button>
            
            {error &&<p className="mt-4 text-red-400 text-center">{error}</p>
            }

            {quizHistory.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-700">
                <h3 className="text-xl font-bold text-gray-200 mb-4">Previous Quizzes</h3>
                <div className="space-y-3">
                  {quizHistory.slice(-3).reverse().map((quiz) => (
                    <div key={quiz.id} className="flex justify-between items-center bg-gray-700 p-3 rounded-lg">
                      <div>
                        <p className="font-medium text-blue-300">{quiz.topic}</p>
                        <p className="text-sm text-gray-400">
                          {new Date(quiz.date).toLocaleDateString()} • {quiz.difficulty} • 
                          {Math.round((quiz.score / quiz.totalQuestions) * 100)}%
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{quiz.score}/{quiz.totalQuestions}</p>
                        <p className="text-sm text-gray-400">
                          Time: {Math.floor(quiz.totalTime / 60)}:{(quiz.totalTime % 60).toString().padStart(2, '0')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-6 text-lg text-blue-400">Generating questions on {topic}...</p>
            <p className="text-gray-400 mt-2">Building {numQuestions} {difficulty} difficulty questions</p>
          </div>
        )}
        
        {/* Quiz questions */}
        {!loading && questions.length > 0 && !showResults && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-xl p-6">
            {/* Progress bar */}
            <div className="mb-6">
              <div className="h-2 w-full bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-400">
                <span>Question {currentQuestion + 1} of {questions.length}</span>
                <span>Time: {formatTime(timeSpent)}</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center mb-4">
              <span className="px-3 py-1 bg-blue-900 text-blue-200 rounded-full text-sm">
                {questions[currentQuestion].category}
              </span>
              <div className="flex items-center space-x-3">
                <span className="px-3 py-1 bg-purple-900 text-purple-200 rounded-full text-sm">
                  Score: {score}
                </span>
                <button
                  onClick={() => toggleBookmark(currentQuestion)}
                  className={`p-1 rounded-full ${
                    bookmarks.includes(questions[currentQuestion].id)
                      ? 'text-yellow-400 bg-yellow-900 bg-opacity-30'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  {bookmarks.includes(questions[currentQuestion].id)
                    ? '★' // Filled star
                    : '☆' // Empty star
                  }
                </button>
              </div>
            </div>

            <div className="flex items-center mb-1">
              <span className={`px-2 py-1 rounded text-xs ${
                questions[currentQuestion].difficulty === 'easy'
                  ? 'bg-green-900 text-green-200'
                  : questions[currentQuestion].difficulty === 'medium'
                    ? 'bg-yellow-900 text-yellow-200'
                    : 'bg-red-900 text-red-200'
              }`}>
                {questions[currentQuestion].difficulty}
              </span>
            </div>
            
            <h2 className="text-xl font-bold mb-6 text-gray-100">
  <FormattedQuestion questionText={questions[currentQuestion].question} />
</h2>
            
            <div className="space-y-4 mb-6">
              {questions[currentQuestion].choices.map((choice, index) => (
                <div 
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                    selectedAnswer === index && !answerSubmitted 
                      ? 'border-blue-500 bg-blue-900 bg-opacity-40' 
                      : 'border-gray-600 hover:border-gray-500 hover:bg-gray-700'
                  } ${
                    answerSubmitted && index === selectedAnswer
                      ? (userAnswers[currentQuestion]?.isCorrect
                        ? 'border-green-500 bg-green-900 bg-opacity-30' 
                        : 'border-red-500 bg-red-900 bg-opacity-30')
                      : ''
                  } ${
                    answerSubmitted && index === userAnswers[currentQuestion]?.correctOptionIndex 
                      ? 'border-green-500 bg-green-900 bg-opacity-20' 
                      : ''
                  }`}
                >
                  {choice}
                </div>
              ))}
            </div>
            
            {!answerSubmitted && (
              <div className="flex justify-between mb-4">
                <button
                  onClick={() => setShowHint(!showHint)}
                  className="text-blue-400 hover:text-blue-300 text-sm underline"
                >
                  {showHint ? "Hide Hint" : "Show Hint"}
                </button>
                <button
                  className="text-gray-400 hover:text-gray-300 text-sm"
                  onClick={() => {
                    if (confirm("Are you sure you want to skip this question?")) {
                      setUserAnswers([...userAnswers, {
                        questionIndex: currentQuestion,
                        selectedAnswer: null,
                        isCorrect: false,
                        correctOptionIndex: null,
                        timeSpent: Math.floor((Date.now() - startTime) / 1000) - timeSpent,
                        category: questions[currentQuestion].category,
                        difficulty: questions[currentQuestion].difficulty,
                        skipped: true
                      }]);
                      handleNextQuestion();
                    }
                  }}
                >
                  Skip Question
                </button>
              </div>
            )}
            
            {showHint && !answerSubmitted && (
              <div className="mb-4 p-3 bg-gray-700 rounded-lg border border-blue-500 text-sm">
                <p className="text-blue-300">Hint: {questions[currentQuestion].hint || `Think about the core principles of ${questions[currentQuestion].category} related to ${topic}.`}</p>
              </div>
            )}
            
            {answerSubmitted && (
              <div className="mb-6 p-4 rounded-lg bg-gray-700 border-l-4 border-blue-500">
                <p className="font-bold text-lg mb-2">
                  {userAnswers[currentQuestion]?.isCorrect
                    ? "✅ Correct!" 
                    : "❌ Incorrect!"
                  }
                </p>
                <p className="text-gray-300">
                  <span className="font-medium text-blue-400">Explanation:</span> {questions[currentQuestion].explanation || 
                    `The correct answer is option ${questions[currentQuestion].correctAnswer}. This option provides the most accurate representation of the concept.`}
                </p>
              </div>
            )}
            
            <div className="flex justify-end">
              {!answerSubmitted ? (
                <button 
                  onClick={handleSubmitAnswer} 
                  disabled={selectedAnswer === null}
                  className={`px-6 py-3 rounded-lg shadow-lg font-medium transition duration-300 ${
                    selectedAnswer === null 
                      ? 'bg-gray-600 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
                  }`}
                >
                  Submit Answer
                </button>
              ) : (
                <button 
                  onClick={handleNextQuestion}
                  className="px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg font-medium transition duration-300"
                >
                  {currentQuestion + 1 < questions.length ? "Next Question" : "View Results"}
                </button>
              )}
            </div>
          </div>
        )}
        
        {/* Results page */}
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
                <div className="text-sm text-red-400">Wrong</div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-900 to-purple-800 p-4 rounded-lg text-center shadow-lg">
                <div className="text-3xl font-bold text-purple-300">{Math.round((score / questions.length) * 100)}%</div>
                <div className="text-sm text-purple-400">Score</div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4 text-gray-200">Performance Analytics</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pie Chart */}
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h4 className="text-center text-blue-300 mb-2">Overall Results</h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={getPieChartData()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          <Cell fill="#4ade80" />
                          <Cell fill="#f87171" />
                        </Pie>
                        <Tooltip formatter={(value) => [`${value} questions`, ""]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                {/* Bar Chart for category performance */}
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h4 className="text-center text-blue-300 mb-2">Performance by Category</h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={getCategoryPerformanceData()}
                        margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                        <XAxis 
                          dataKey="name" 
                          angle={-45}
                          textAnchor="end"
                          height={70}
                          tick={{ fill: '#9ca3af', fontSize: 10 }}
                        />
                        <YAxis 
                          tick={{ fill: '#9ca3af' }} 
                          domain={[0, 100]}
                          tickFormatter={(value) => `${value}%`}
                        />
                        <Tooltip 
                          formatter={(value) => [`${value}%`, "Score"]}
                          contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151' }}
                        />
                        <Bar dataKey="percentage" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Time Stats */}
            <div className="mb-8 p-4 bg-gray-700 rounded-lg">
              <h3 className="text-lg font-bold mb-2 text-gray-200">Time Statistics</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-blue-300">{formatTime(timeSpent)}</p>
                  <p className="text-sm text-blue-400">Total Time</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-300">
                    {formatTime(Math.floor(timeSpent / questions.length))}
                  </p>
                  <p className="text-sm text-green-400">Avg per Question</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-300">
                    {userAnswers.length > 0 
                      ? formatTime(Math.max(...userAnswers.map(a => a.timeSpent))) 
                      : "0:00"}
                  </p>
                  <p className="text-sm text-purple-400">Longest Question</p>
                </div>
              </div>
            </div>
            
            <h3 className="text-xl font-bold mb-4 text-gray-200">Question Review</h3>
            
            <div className="space-y-6 mb-8">
              {questions.map((question, qIndex) => {
                const userAnswer = userAnswers.find(a => a.questionIndex === qIndex);
                const isCorrect = userAnswer?.isCorrect || false;
const wasSkipped = userAnswer?.skipped || false;

return (
  <div 
    key={qIndex}
    className={`p-4 rounded-lg border ${
      isCorrect 
        ? 'border-green-500 bg-green-900 bg-opacity-20' 
        : wasSkipped
          ? 'border-gray-600 bg-gray-700'
          : 'border-red-500 bg-red-900 bg-opacity-20'
    }`}
  >
    <div className="flex justify-between items-start mb-2">
    <span className="font-bold text-lg">{qIndex + 1}. {question.question}</span>
      <span className={`ml-2 ${
        isCorrect ? 'text-green-400' : wasSkipped ? 'text-gray-400' : 'text-red-400'
      }`}>
        {isCorrect ? '✓' : wasSkipped ? 'Skipped' : '✗'}
      </span>
    </div>
    
    <div className="space-y-2 mt-4">
      {question.choices.map((choice, cIndex) => (
        <div 
          key={cIndex}
          className={`p-2 border rounded ${
            userAnswer?.selectedAnswer === cIndex
              ? (isCorrect ? 'bg-green-900 bg-opacity-30 border-green-500' : 'bg-red-900 bg-opacity-30 border-red-500')
              : cIndex === userAnswer?.correctOptionIndex
                ? 'bg-green-900 bg-opacity-20 border-green-500'
                : 'border-gray-600'
          }`}
        >
          {choice}
        </div>
      ))}
    </div>
    
    <div className="mt-4 text-sm">
      <p className="text-blue-400 font-medium">Explanation:</p>
      <p className="text-gray-300">{question.explanation || 
        `The correct answer is option ${question.correctAnswer}.`}
      </p>
    </div>
    
    <div className="flex justify-between mt-4 text-xs text-gray-400">
      <span>Category: {question.category}</span>
      <span>Time spent: {formatTime(userAnswer?.timeSpent || 0)}</span>
    </div>
  </div>
);
})}
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setQuestions([]);
                  setCurrentQuestion(0);
                  setSelectedAnswer(null);
                  setAnswerSubmitted(false);
                  setScore(0);
                  setShowResults(false);
                }}
                className="flex-1 py-3 px-6 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition"
              >
                New Quiz
              </button>
              
              <button
                onClick={() => {
                  const sameQuiz = [...questions];
                  setQuestions([]);
                  setTimeout(() => {
                    setQuestions(sameQuiz);
                    setCurrentQuestion(0);
                    setSelectedAnswer(null);
                    setAnswerSubmitted(false);
                    setScore(0);
                    setUserAnswers([]);
                    setShowResults(false);
                    setTimeSpent(0);
                    setStartTime(Date.now());
                  }, 100);
                }}
                className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-lg font-medium shadow-lg transition"
              >
                Retry Quiz
              </button>
            </div>
          </div>
        )}
        
        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>MCQ Quiz Generator © {new Date().getFullYear()}</p>
          <p className="mt-1">Create personalized quizzes on any topic</p>
        </div>
      </div>
    </div>
  );
};

export default MCQQuizGenerator;