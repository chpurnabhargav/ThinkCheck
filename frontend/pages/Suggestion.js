import React, { useState, useEffect } from 'react';

const DEFAULT_QUESTIONS = [
  "What subjects do you enjoy most in school?",
  "What are your hobbies or activities outside of school?",
  "Describe a project or assignment you really enjoyed working on.",
  "What careers or jobs seem interesting to you?",
  "What skills do you think you're particularly good at?",
  "What kind of work environment do you see yourself thriving in?",
  "Do you prefer working with people, data, things, or ideas?",
  "What are your long-term goals or ambitions?",
  "What challenges or problems would you like to solve in your career?",
  "Are there any family expectations or traditions regarding education?"
];

// Sample offline suggestions when API is unavailable
const SAMPLE_SUGGESTIONS = `# Educational Path Suggestions

Based on your responses, here are some educational paths that might suit your interests and strengths:

## 1. Computer Science / Information Technology
**Justification:** This aligns with your interest in problem-solving and technology.

**Specific Courses/Majors:**
- B.Tech in Computer Science
- B.Sc in Information Technology
- Software Engineering

**Potential Career Outcomes:**
- Software Developer
- Data Analyst
- UX/UI Designer
- IT Consultant

## 2. Business Administration
**Justification:** Matches your interest in working with people and organization.

**Specific Courses/Majors:**
- BBA with specialization in Marketing
- Business Management
- Entrepreneurship Studies

**Potential Career Outcomes:**
- Marketing Manager
- Business Analyst
- Entrepreneur
- Project Manager

## 3. Creative Arts & Design
**Justification:** Complements your creative interests and problem-solving abilities.

**Specific Courses/Majors:**
- Digital Media Design
- Communication Design
- Interactive Media

**Potential Career Outcomes:**
- Graphic Designer
- Content Creator
- Art Director
- User Experience Designer

## Alternative Options
- Professional Certification Programs
- Vocational Training
- Online Learning Platforms (Coursera, edX)
- Apprenticeships in relevant fields

## Essential Skills to Develop
- Critical thinking and problem-solving
- Communication and presentation
- Digital literacy
- Time management
- Collaboration and teamwork`;

const EducationalSuggestionForm = () => {
  const [questions] = useState(DEFAULT_QUESTIONS);
  const [responses, setResponses] = useState(Array(questions.length).fill(""));
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiKeyStatus, setApiKeyStatus] = useState(null);

  // Check API key status on component mount
  useEffect(() => {
    const checkApiKey = () => {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
        setApiKeyStatus('missing');
      } else {
        setApiKeyStatus('present');
      }
    };
    
    checkApiKey();
  }, []);

  const handleResponseChange = (index, value) => {
    const newResponses = [...responses];
    newResponses[index] = value;
    setResponses(newResponses);
  };

  const handleSubmit = async () => {
    // Validate that at least enough responses are provided
    const filledResponses = responses.filter(r => r.trim().length > 0);
    if (filledResponses.length < 5) {
      setError("Please answer at least 5 questions before requesting suggestions.");
      return;
    }

    setLoading(true);
    setError(null);
    
    // If API key is missing, use sample suggestions
    if (apiKeyStatus === 'missing') {
      setTimeout(() => {
        setSuggestions({ rawSuggestions: SAMPLE_SUGGESTIONS });
        setLoading(false);
      }, 1500); // Simulate API delay
      return;
    }
    
    try {
      // Format the data to send to Gemini
      const prompt = `Based on the following student responses, suggest appropriate educational paths after high school, including but not limited to B.Tech programs. Consider various domains and career paths that match their interests and aptitudes.\n\n${
        questions.map((question, index) => 
          `Question ${index+1}: ${question}\nAnswer: ${responses[index] || "No answer provided"}`
        ).join('\n\n')
      }\n\nPlease provide:\n1. Top 3 recommended educational paths with justification\n2. Specific courses or majors within each path\n3. Potential career outcomes for each path\n4. Alternative options beyond traditional degree programs (if appropriate)\n5. Skills the student should develop regardless of their chosen path`;
      
      // Call Gemini API directly from frontend
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_GEMINI_API_KEY}`
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt }
              ]
            }
          ]
        })
      });
      
      if (!response.ok) {
        // Handle HTTP errors
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
          throw new Error(errorData.error?.message || `API error (${response.status})`);
        } catch (parseError) {
          throw new Error(`API error (${response.status}): Unable to parse error response`);
        }
      }
      
      const data = await response.json();
      const suggestionText = data.candidates?.[0]?.content?.parts?.[0]?.text || "No suggestions available.";
      setSuggestions({ rawSuggestions: suggestionText });
      
    } catch (err) {
      // Handle authentication errors specifically
      if (err.message.includes("authentication credentials") || err.message.includes("401")) {
        setError("API authentication failed. Using sample suggestions instead.");
        setSuggestions({ rawSuggestions: SAMPLE_SUGGESTIONS });
      } else {
        setError(`Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResponses(Array(questions.length).fill(""));
    setSuggestions(null);
    setError(null);
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="bg-indigo-50 rounded-lg shadow-md overflow-hidden">
        <div className="p-6 bg-indigo-600 border-b">
          <h2 className="text-2xl font-bold text-white">Educational Path Finder</h2>
          <p className="text-indigo-100 mt-1">
            Answer these questions to get personalized educational and career path suggestions
          </p>
          {apiKeyStatus === 'missing' && (
            <div className="mt-2 px-3 py-1 bg-indigo-500 text-white text-sm rounded-md inline-block">
              Demo Mode: Using sample suggestions
            </div>
          )}
        </div>
        
        {!suggestions ? (
          <div className="p-6">
            {questions.map((question, index) => (
              <div key={index} className="mb-6">
                <h3 className="font-medium mb-2 text-indigo-800">{index + 1}. {question}</h3>
                <textarea 
                  className="w-full p-3 border border-indigo-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"
                  placeholder="Your answer..."
                  value={responses[index]}
                  onChange={(e) => handleResponseChange(index, e.target.value)}
                  rows={3}
                />
              </div>
            ))}
            {error && (
              <div className="bg-red-50 p-4 rounded-md text-red-700 mb-4">
                <span className="font-medium">Error:</span> {error}
              </div>
            )}
          </div>
        ) : (
          <div className="p-6">
            <div className="bg-green-50 p-4 rounded-md text-green-700 mb-6">
              <span className="font-medium">Success!</span> Your educational path suggestions are ready!
            </div>
            
            <div className="prose max-w-none text-gray-800">
              {suggestions.rawSuggestions.split('\n').map((line, i) => {
                if (line.startsWith('# ')) {
                  return <h1 key={i} className="text-2xl font-bold mt-4 mb-2 text-indigo-800">{line.substring(2)}</h1>;
                } else if (line.startsWith('## ')) {
                  return <h2 key={i} className="text-xl font-bold mt-4 mb-2 text-indigo-700">{line.substring(3)}</h2>;
                } else if (line.startsWith('**')) {
                  return <p key={i} className="font-bold my-2 text-indigo-600">{line}</p>;
                } else if (line.startsWith('- ')) {
                  return <li key={i} className="ml-6 text-gray-800">{line.substring(2)}</li>;
                } else if (line.trim() === '') {
                  return <br key={i} />;
                } else {
                  return <p key={i} className="my-2 text-gray-800">{line}</p>;
                }
              })}
            </div>
          </div>
        )}
        
        <div className="p-6 bg-indigo-100 border-t flex justify-between">
          <button 
            className="px-4 py-2 bg-white text-indigo-700 border border-indigo-300 rounded-md hover:bg-indigo-50"
            onClick={handleReset}
          >
            Reset
          </button>
          
          {!suggestions ? (
            <button 
              className={`px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              onClick={handleSubmit} 
              disabled={loading}
            >
              {loading ? "Generating Suggestions..." : "Get Suggestions"}
            </button>
          ) : (
            <button 
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              onClick={handleReset}
            >
              Start Over
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EducationalSuggestionForm;