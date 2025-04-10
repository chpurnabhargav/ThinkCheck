import React from 'react';
import { useRouter } from 'next/router';
import { ArrowRight, ChevronRight, BookOpen, FileText } from 'lucide-react';

const NavigationButtons = () => {
  const router = useRouter();
  const [showDemo, setShowDemo] = React.useState(false);
  const [isLoggedIn, setIsLoggedIn] = React.useState(false); // Replace Clerk authentication state
  
  return (
    <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 justify-center">
      {!isLoggedIn ? (
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <button 
            onClick={() => setIsLoggedIn(true)} // Simple login state toggle
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg flex items-center justify-center transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            <span className="text-lg font-medium">Login to Start</span>
            <ArrowRight className="ml-2 w-5 h-5" />
          </button>
          <button
            onClick={() => setShowDemo(true)}
            className="px-8 py-4 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 rounded-lg flex items-center justify-center transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            <span className="text-lg font-medium">Try Demo</span>
            <ChevronRight className="ml-2 w-5 h-5" />
          </button>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <button 
            onClick={() => router.push('/mcq')}
            className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg flex items-center justify-center transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            <BookOpen className="w-5 h-5 mr-2" />
            <span className="text-lg font-medium">MCQ Mode</span>
          </button>
          <button 
            onClick={() => router.push('/written')}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg flex items-center justify-center transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            <FileText className="w-5 h-5 mr-2" />
            <span className="text-lg font-medium">Written Mode</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default NavigationButtons;