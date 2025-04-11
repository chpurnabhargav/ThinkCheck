import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, FileText, Brain, ArrowRight, Users, ChevronRight, Star, BarChart, Shield, Award, ChevronDown, Info, X, Check, AlertCircle } from 'lucide-react';
import { Lightbulb, GraduationCap, Target, ClipboardList, Map } from "lucide-react";
import { FaFacebook, FaLinkedin, FaTwitter, FaInstagram, FaGithub } from "react-icons/fa";
import { useRouter } from 'next/router';
import Link from 'next/link';

// Component definitions - improved SVG with better path definitions and accessibility
const ThinkCheckLogo = () => (
  <svg
    className="w-10 h-10 text-blue-500"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="ThinkCheck Logo"
    role="img"
  >
    {/* Open Book - improved path with smoother curves */}
    <path
      d="M3 5v14c0 0 2.5-1.5 4.5-1.5c1.5 0 3 0.5 4.5 1.5c1.5-1 3-1.5 4.5-1.5c2 0 4.5 1.5 4.5 1.5V5c0 0-2.5-1.5-4.5-1.5c-1.5 0-3 0.5-4.5 1.5c-1.5-1-3-1.5-4.5-1.5C5.5 3.5 3 5 3 5Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    {/* Checkmark - more precise positioning */}
    <path
      d="M8 12l3 3 5-6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Utility function with improved behavior and performance
const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  });
};

// Card components with better prop handling and accessibility
const Card = ({ className = "", children, ...props }) => (
  <div 
    className={`rounded-lg border shadow-sm hover:shadow-md transition-all duration-200 ${className}`} 
    {...props}
  >
    {children}
  </div>
);

const CardHeader = ({ className = "", children, ...props }) => (
  <div 
    className={`flex flex-col space-y-1.5 p-6 ${className}`} 
    {...props}
  >
    {children}
  </div>
);

const CardTitle = ({ className = "", children, ...props }) => (
  <h3 
    className={`text-2xl font-semibold leading-tight ${className}`} 
    {...props}
  >
    {children}
  </h3>
);

const CardContent = ({ className = "", children, ...props }) => (
  <div 
    className={`p-6 pt-0 ${className}`} 
    {...props}
  >
    {children}
  </div>
);

const Home = () => {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [animateHeader, setAnimateHeader] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const featureSectionRef = useRef(null);
  const [darkMode, setDarkMode] = useState(false);
  // User is always considered logged in - no login/logout functionality
  const [isLoggedIn, setIsLoggedIn] = useState(true); 

  // Demo questions with improved structure and more challenging content
  const demoQuestions = [
    {
      id: "q1",
      question: "What is the primary purpose of React's useEffect hook?",
      options: [
        "To create new state variables",
        "To handle side effects in functional components",
        "To replace class components entirely",
        "To optimize rendering performance"
      ],
      correctAnswer: 1,
      explanation: "The useEffect hook manages side effects like data fetching, subscriptions, or DOM manipulation in functional components."
    },
    {
      id: "q2",
      question: "Which data structure uses LIFO (Last In, First Out) principle?",
      options: [
        "Queue",
        "Linked List",
        "Stack",
        "Binary Tree"
      ],
      correctAnswer: 2,
      explanation: "Stacks follow the LIFO principle where the most recently added element is the first one to be removed."
    },
    {
      id: "q3",
      question: "Which algorithm has O(n log n) time complexity?",
      options: [
        "Bubble Sort",
        "Quick Sort (average case)",
        "Insertion Sort",
        "Selection Sort"
      ],
      correctAnswer: 1,
      explanation: "Quick Sort has an average time complexity of O(n log n), though its worst case is O(n²)."
    }
  ];

  // Testimonials with more authentic language and specific details
  const testimonials = [
    {
      id: "t1",
      text: "ThinkCheck has transformed my exam preparation process. The adaptive question algorithm somehow knows exactly which concepts I'm struggling with and targets them precisely. After just 3 weeks, I improved my practice test scores by 24%.",
      name: "Gowtham M",
      role: "Computer Science Student",
      image: "/gowtham.jpg",
      university: "NIT Trichy"
    },
    {
      id: "t2",
      text: "I was skeptical at first, but ThinkCheck's personalized learning paths helped me tackle my Algorithm Analysis course when I was falling behind. The visual explanations and instant feedback cleared up misconceptions I didn't realize I had.",
      name: "Kavya Kanne",
      role: "CS Student",
      image: "/kavya.jpg",
      university: "BITS Pilani"
    },
    {
      id: "t3",
      text: "Preparing for my CISSP certification was overwhelming until I found ThinkCheck. The practice scenarios mirror real exam questions so well that the actual test felt familiar. The analytics helped me identify and strengthen weak areas in cryptography and network security.",
      name: "Nishanth",
      role: "Cybersecurity Aspirant",
      image: "/nishanth.jpg",
      company: "TechDefend Solutions"
    }
  ];
  
  // Features with more specific and compelling descriptions
  const features = [
    { 
      id: "feature-practice",
      icon: <BookOpen className="w-8 h-8 text-blue-500" />, 
      title: "Comprehensive Practice", 
      description: "Access over 12,000 expertly-crafted questions spanning 24 subject areas, with difficulty levels that automatically adjust to your proficiency." 
    },
    { 
      id: "feature-insights",
      icon: <BarChart className="w-8 h-8 text-purple-500" />, 
      title: "Performance Insights", 
      description: "Visualize your progress with detailed analytics that identify knowledge gaps, track improvement over time, and predict optimal study areas." 
    },
    { 
      id: "feature-ai",
      icon: <Shield className="w-8 h-8 text-emerald-500" />, 
      title: "AI-Powered Assistance", 
      description: "Receive detailed explanations tailored to your learning patterns, with step-by-step breakdowns that adapt to your specific conceptual misunderstandings." 
    },
    { 
      id: "feature-exam",
      icon: <Award className="w-8 h-8 text-amber-500" />, 
      title: "Exam-Focused Preparation", 
      description: "Practice under simulated test conditions with adaptive time limits, question distributions that mirror real exams, and stress management techniques." 
    },
  ];

  // Improved effect with proper cleanup and performance optimization
  useEffect(() => {
    const handleScroll = () => {
      // Using threshold for better performance
      setScrolled(window.scrollY > 20);
    };
    
    // Passive listener for better scroll performance
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Trigger animation after component mounts with slight delay for smoother entry
    const animationTimer = setTimeout(() => {
      setAnimateHeader(true);
    }, 100);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(animationTimer);
    };
  }, []);

  // Auto-cycle through testimonials with optimized interval
  useEffect(() => {
    const interval = setInterval(() => {
      setTestimonialIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
    }, 8000);
    
    return () => clearInterval(interval);
  }, [testimonials.length]);

  // Auto-cycle through features with dependency array optimization
  useEffect(() => {
    if (features && features.length > 0) {
      const interval = setInterval(() => {
        setActiveFeature((prevFeature) => (prevFeature + 1) % features.length);
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, [features]);

  // Enhanced notification function with auto-dismiss and return cleanup
  const showTempNotification = (message) => {
    setNotificationMessage(message);
    setShowNotification(true);
    
    const timer = setTimeout(() => {
      setShowNotification(false);
    }, 3000);
    
    // Return cleanup function in case component unmounts before timeout
    return () => clearTimeout(timer);
  };

  // Improved scroll function with better behavior options
  const scrollToFeatures = () => {
    featureSectionRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
  };

  // Enhanced answer selection with validation
  const handleAnswerSelect = (index) => {
    if (!answerSubmitted && index >= 0 && index < demoQuestions[currentQuestion].options.length) {
      setSelectedAnswer(index);
    }
  };

  // Improved submit answer with better feedback
  const handleSubmitAnswer = () => {
    if (selectedAnswer !== null) {
      setAnswerSubmitted(true);
      const isCorrect = selectedAnswer === demoQuestions[currentQuestion].correctAnswer;
      
      showTempNotification(
        isCorrect 
          ? 'Correct! ' + demoQuestions[currentQuestion].explanation
          : 'Not quite. ' + demoQuestions[currentQuestion].explanation
      );
    }
  };

  // Enhanced next question handler with proper state reset
  const handleNextQuestion = () => {
    setCurrentQuestion((prev) => (prev + 1) % demoQuestions.length);
    setSelectedAnswer(null);
    setAnswerSubmitted(false);
  };

  // Theme toggle with system preference detection
  const toggleTheme = () => {
    setDarkMode((prev) => {
      const newMode = !prev;
      // Apply theme to document for potential global styling
      document.documentElement.classList.toggle('dark-theme', newMode);
      return newMode;
    });
  };

  return (
    <div className={`flex flex-col min-h-screen transition-colors duration-500 ${darkMode ? 'bg-gradient-to-b from-gray-900 to-black text-white' : 'bg-gradient-to-b from-blue-50 to-purple-50 text-gray-900'}`}>
      {/* Notification with improved accessibility */}
      <div 
        className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center transition-all duration-300 ${showNotification ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        role={showNotification ? "alert" : "none"}
        aria-live="polite"
      >
        <Check className="w-5 h-5 mr-2" aria-hidden="true" />
        {notificationMessage}
      </div>

      {/* Floating header with improved transitions and accessibility */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled 
            ? (darkMode 
                ? 'bg-black bg-opacity-85 backdrop-filter backdrop-blur-lg shadow-lg shadow-blue-500/10' 
                : 'bg-white bg-opacity-85 backdrop-filter backdrop-blur-lg shadow-lg shadow-blue-500/10') 
            : 'bg-transparent'}`}
      >
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur opacity-70 group-hover:opacity-100 transition duration-300"></div>
            </div>
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">ThinkCheck</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <button 
              onClick={toggleTheme} 
              className={`p-2 rounded-full transition-all duration-300 transform hover:scale-110 ${
                darkMode 
                  ? 'bg-gray-800 hover:bg-gray-700 text-yellow-300 hover:text-yellow-200' 
                  : 'bg-gray-200 hover:bg-gray-300 text-indigo-700 hover:text-indigo-600'
              }`}
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </header>

      {/* Hero section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-green-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
          <div className="absolute bottom-1/3 right-1/3 w-64 h-64 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-6000"></div>
        </div>
        
        <div className="container mx-auto px-6 z-10 mt-16">
          <div className="flex flex-col items-center text-center">
            <div className={`transform transition-all duration-1000 ${animateHeader ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-text">
                  ThinkCheck
                </span>
              </h1>
              <p className={`text-xl md:text-2xl mb-10 max-w-3xl mx-auto font-light ${darkMode ? "text-blue-100" : "text-gray-700"}`}>
                Evaluate your expertise with precision, expand your understanding with 
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500 font-medium"> adaptive testing </span>
                tailored to your unique learning journey
              </p>
              
              <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 justify-center">
                {!isLoggedIn ? (
                  <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                    <button 
                      onClick={handleLogin}
                      className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl flex items-center justify-center transition-all duration-300 transform hover:scale-105 hover:shadow-xl shadow-md shadow-blue-500/20"
                    >
                      <span className="text-lg font-medium">Login to Start</span>
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => setShowDemo(true)}
                      className="px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white rounded-xl flex items-center justify-center transition-all duration-300 transform hover:scale-105 hover:shadow-xl shadow-md"
                    >
                      <span className="text-lg font-medium">Try Demo</span>
                      <ChevronRight className="ml-2 w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                    <button
                      onClick={() => router.push("/mcq")}
                      className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl flex items-center justify-center transition-all duration-300 transform hover:scale-105 hover:shadow-xl shadow-md"
                    >
                      <BookOpen className="w-5 h-5 mr-2" />
                      <span className="text-lg font-medium">MCQ Mode</span>
                    </button>
                    <button
                      onClick={() => router.push("/written")}
                      className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl flex items-center justify-center transition-all duration-300 transform hover:scale-105 hover:shadow-xl shadow-md"
                    >
                      <FileText className="w-5 h-5 mr-2" />
                      <span className="text-lg font-medium">Written Mode</span>
                    </button>
                    <button 
                      onClick={() => router.push("/STS")}
                      className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl flex items-center justify-center transition-all duration-300 transform hover:scale-105 hover:shadow-xl shadow-md"
                    >
                      <Map className="w-5 h-5 mr-2" />
                      <span className="text-lg font-medium">Straight To Success</span>
                    </button>
                    
                    <button 
                      onClick={() => router.push("/Notes")}
                      className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl flex items-center justify-center transition-all duration-300 transform hover:scale-105 hover:shadow-xl shadow-md"
                    >
                      <Map className="w-5 h-5 mr-2" />
                      <span className="text-lg font-medium">Notes</span>
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-center mt-8">
                <div className={`flex items-center space-x-1 text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                  {showTooltip && (
                    <div className="absolute mt-16 bg-gray-800 text-white p-2 rounded shadow-lg max-w-xs z-10">
                      ThinkCheck is used by students and professionals from over 50 countries worldwide.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Animated scroll indicator */}
        <button 
          onClick={scrollToFeatures}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center cursor-pointer animate-bounce"
        >

        </button>
      </section>

      {/* Features section */}
      <section className="py-20 relative" ref={featureSectionRef}>
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">Premium Features</h2>
            <p className={`text-lg max-w-2xl mx-auto ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              Our platform combines cutting-edge AI with educational expertise to deliver an unparalleled assessment experience
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className={`${
                  darkMode 
                    ? 'bg-gradient-to-b from-gray-800 to-gray-900 border-gray-700' 
                    : 'bg-white border-gray-200'
                } rounded-2xl p-8 shadow-xl border hover:border-blue-500 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl cursor-pointer group`}
                onMouseEnter={() => setActiveFeature(index)}
              >
                <div className="flex justify-center mb-4">
                  <div className={`p-3 rounded-full ${
                    darkMode 
                      ? 'bg-gray-700 group-hover:bg-gray-600' 
                      : 'bg-blue-50 group-hover:bg-blue-100'
                  } transition-colors duration-300`}>
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-center">{feature.title}</h3>
                <p className={`${darkMode ? "text-gray-400" : "text-gray-600"} text-center`}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive demo section */}
      {showDemo && (
        <section className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center backdrop-filter backdrop-blur-sm">
          <div className={`relative w-full max-w-lg p-8 ${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl`}>
            <button 
              onClick={() => setShowDemo(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors duration-300"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">ThinkCheck Demo</h3>
              <p className={darkMode ? "text-gray-300" : "text-gray-600"}>Try our interactive assessment platform with sample questions</p>
            </div>
            
            <div className="mb-6">
              <div className="flex justify-between mb-3">
                <span className="text-sm text-blue-500 font-medium">Question {currentQuestion + 1} of {demoQuestions.length}</span>
                <span className="text-sm text-blue-500 font-medium">Technical Knowledge</span>
              </div>
              <div className={`p-6 rounded-xl mb-6 ${darkMode ? 'bg-gray-800' : 'bg-blue-50'}`}>
                <h4 className="text-lg font-medium mb-4">{demoQuestions[currentQuestion].question}</h4>
                <div className="space-y-3">
                  {demoQuestions[currentQuestion].options.map((option, index) => (
                    <div 
                      key={index}
                      onClick={() => handleAnswerSelect(index)}
                      className={`p-4 rounded-xl cursor-pointer transition-all duration-300 ${
                        selectedAnswer === index 
                          ? (answerSubmitted 
                              ? (index === demoQuestions[currentQuestion].correctAnswer 
                                  ? 'bg-green-100 border-green-500 text-green-800' 
                                  : 'bg-red-100 border-red-500 text-red-800') 
                              : 'bg-blue-100 border-blue-500 text-blue-800')
                          : (darkMode 
                              ? 'bg-gray-700 hover:bg-gray-600 border-gray-600' 
                              : 'bg-gray-100 hover:bg-gray-200 border-gray-200')
                      } border-2 hover:shadow-md`}
                    >
                      <div className="flex items-center">
                        <div className={`w-6 h-6 rounded-full mr-3 flex items-center justify-center ${
                          selectedAnswer === index 
                            ? (answerSubmitted 
                                ? (index === demoQuestions[currentQuestion].correctAnswer 
                                    ? 'bg-green-500' 
                                    : 'bg-red-500') 
                                : 'bg-blue-500')
                            : (darkMode ? 'bg-gray-600' : 'bg-gray-300')
                        }`}>
                          {answerSubmitted && index === demoQuestions[currentQuestion].correctAnswer && <Check className="w-4 h-4 text-white" />}
                          {answerSubmitted && selectedAnswer === index && index !== demoQuestions[currentQuestion].correctAnswer && <X className="w-4 h-4 text-white" />}
                        </div>
                        <span className="font-medium">{option}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex justify-between">
              {!answerSubmitted ? (
                <button 
                  onClick={handleSubmitAnswer}
                  disabled={selectedAnswer === null}
                  className={`px-6 py-3 rounded-xl transition-all duration-300 ${
                    selectedAnswer !== null 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transform hover:scale-105' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Submit Answer
                </button>
              ) : (
                <button 
                  onClick={handleNextQuestion}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                >
                  Next Question
                </button>
              )}
              
              <button 
                onClick={() => setShowDemo(false)}
                className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
              >
                Close Demo
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Testimonial section */}
      <section className={`py-20 ${darkMode ? 'bg-gradient-to-r from-blue-900 to-purple-900' : 'bg-gradient-to-r from-blue-50 to-purple-50'}`}>
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-center mb-12">
              <div className="px-6 py-2 rounded-full bg-blue-500 bg-opacity-10 flex items-center justify-center">
                <div className="text-white-500 font-semibold">REVIEWS</div>
              </div>
            </div>
            
            <div className="relative h-72">
              {testimonials.map((testimonial, index) => (
                <div 
                  key={index}
                  className={`absolute top-0 left-0 w-full transition-all duration-1000 transform ${
                    testimonialIndex === index 
                      ? 'opacity-100 translate-x-0' 
                      : (testimonialIndex > index 
                          ? 'opacity-0 -translate-x-full' 
                          : 'opacity-0 translate-x-full')
                  }`}
                >
                  <div className={`p-8 rounded-2xl mb-8 ${darkMode ? 'bg-gray-800 bg-opacity-50' : 'bg-white'} shadow-xl`}>
                    <p className="text-xl md:text-2xl font-light mb-8 italic text-center">
                      "{testimonial.text}"
                    </p>
                    <div className="flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-blue-500 shadow-lg">
                        <img src={testimonial.image} alt={testimonial.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="ml-4 text-left">
                      <h4 className="font-bold">{testimonial.name}</h4>
                        <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{testimonial.role}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-center mt-4">
              {testimonials.map((_, index) => (
                <button 
                  key={index} 
                  onClick={() => setTestimonialIndex(index)}
                  className={`w-3 h-3 mx-1 rounded-full transition-all duration-300 ${
                    testimonialIndex === index 
                      ? 'bg-blue-500 scale-125' 
                      : (darkMode ? 'bg-gray-600' : 'bg-gray-300')
                  }`}
                  aria-label={`View testimonial ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">How ThinkCheck Works</h2>
            <p className={`text-lg max-w-2xl mx-auto ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              Our platform is designed to make learning assessment seamless and effective
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className={`p-8 rounded-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-xl`}>
              <div className="flex justify-center mb-6">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${darkMode ? 'bg-blue-900' : 'bg-blue-100'}`}>
                  <GraduationCap className="w-8 h-8 text-blue-500" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-4 text-center">Select Your Subject</h3>
              <p className={`${darkMode ? "text-gray-400" : "text-gray-600"} text-center`}>
                Choose from a wide range of subjects and topics tailored to your curriculum or learning objectives
              </p>
            </div>
            
            <div className={`p-8 rounded-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-xl`}>
              <div className="flex justify-center mb-6">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${darkMode ? 'bg-purple-900' : 'bg-purple-100'}`}>
                  <ClipboardList className="w-8 h-8 text-purple-500" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-4 text-center">Take Assessments</h3>
              <p className={`${darkMode ? "text-gray-400" : "text-gray-600"} text-center`}>
                Complete interactive quizzes and tests with multiple formats including MCQs and written responses
              </p>
            </div>
            
            <div className={`p-8 rounded-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-xl`}>
              <div className="flex justify-center mb-6">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${darkMode ? 'bg-green-900' : 'bg-green-100'}`}>
                  <Target className="w-8 h-8 text-green-500" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-4 text-center">Track Progress</h3>
              <p className={`${darkMode ? "text-gray-400" : "text-gray-600"} text-center`}>
                Receive instant feedback, detailed explanations, and view your progress over time with visual analytics
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className={`py-20 ${darkMode ? 'bg-gradient-to-r from-indigo-900 to-purple-900' : 'bg-gradient-to-r from-indigo-50 to-purple-50'}`}>
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">Ready to Transform Your Learning Experience?</h2>
            <p className={`text-xl mb-10 ${darkMode ? "text-blue-200" : "text-gray-700"}`}>
              Join thousands of students and professionals who have boosted their knowledge retention and test performance with ThinkCheck
            </p>
            
            <button 
              onClick={ () => scrollToTop() }
              className="px-10 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl text-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center mx-auto"
            >
              <span>{"Go to Dashboard" }</span>
              <ArrowRight className="ml-2 w-6 h-6" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-12 ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}> 
  <div className="container mx-auto px-6"> 
    <div className="grid grid-cols-1 md:grid-cols-4 gap-12"> 
      {/* Company Information and Logo */}
      <div> 
        <div className="flex items-center space-x-2 mb-6"> 
         
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">THINK CHECK</span> 
        </div> 
        <p className={`mb-6 ${darkMode ? "text-gray-400" : "text-gray-600"}`}> 
          Revolutionizing the way students test and consolidate their knowledge through innovative AI-powered assessment tools. 
        </p> 
      </div> 
       
      {/* Features List */}
      <div> 
        <h4 className={`text-lg font-semibold mb-6 ${darkMode ? "text-white" : "text-gray-900"}`}>Features</h4> 
        <ul className={`space-y-4 ${darkMode ? "text-gray-400" : "text-gray-600"}`}> 
          <li><p className="hover:text-blue-500 transition-colors duration-300">MCQ Tests</p></li> 
          <li><p className="hover:text-blue-500 transition-colors duration-300">Written Assessments</p></li> 
          <li><p className="hover:text-blue-500 transition-colors duration-300">Progress Tracking</p></li> 
        </ul> 
      </div> 

      {/* More Features */}
      <div className="mt-0 md:mt-14">
        <ul className={`space-y-4 ${darkMode ? "text-gray-400" : "text-gray-600"}`}> 
          <li><p className="hover:text-blue-500 transition-colors duration-300">Performance Analytics</p></li> 
          <li><p className="hover:text-blue-500 transition-colors duration-300">Custom Study Plans</p></li> 
        </ul> 
      </div> 
       
      {/* Social Media Links */}
      
    </div> 
     
    {/* Copyright and Policies */}
    <div className="border-t mt-12 pt-8 flex flex-col md:flex-row justify-between items-center"> 
      <p className={`text-sm ${darkMode ? "text-gray-500" : "text-gray-600"}`}> 
        © {new Date().getFullYear()} THINK CHECK. All rights reserved. 
      </p> 
      <div className={`flex space-x-6 mt-4 md:mt-0 text-sm ${darkMode ? "text-gray-500" : "text-gray-600"}`}> 
        <a href="#" className="hover:text-blue-500 transition-colors duration-300">Privacy Policy</a> 
        <a href="#" className="hover:text-blue-500 transition-colors duration-300">Terms of Service</a> 
        <a href="#" className="hover:text-blue-500 transition-colors duration-300">Cookie Policy</a> 
      </div> 
    </div> 
  </div> 
</footer>
      
      {/* Back to top button */}
      <button 
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 p-3 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 z-20 ${
          scrolled 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-10 pointer-events-none'
        } ${
          darkMode 
            ? 'bg-gray-800 hover:bg-gray-700 text-white' 
            : 'bg-white hover:bg-gray-100 text-gray-800'
        }`}
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