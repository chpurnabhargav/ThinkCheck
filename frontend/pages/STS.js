import React, { useState, useEffect } from 'react';

function RoadmapGenerator() {
    const [roadmap, setRoadmap] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [topic, setTopic] = useState('');
    const [level, setLevel] = useState('Beginner');
    const [sections, setSections] = useState(7);
    const [showDownloadOptions, setShowDownloadOptions] = useState(false);
    const [viewMode, setViewMode] = useState('form'); // 'form' or 'roadmap'

    // Reset error when inputs change
    useEffect(() => {
        if (error) setError('');
    }, [topic, level, sections]);

    const fetchRoadmap = async () => {
        if (!topic.trim()) {
            setError("Please enter a topic");
            return;
        }
        
        setLoading(true);
        setError('');
        
        try {
            const response = await fetch('https://thinkcheck.onrender.com/generate-roadmap', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    topic,
                    timeframe: '3 months',
                    level,
                    sections,
                }),
            });
            
            if (!response.ok) {
                throw new Error(`Server responded with status: ${response.status}`);
            }
            
            const data = await response.json();
            if (!data.roadmap) {
                throw new Error('Received empty roadmap from server');
            }
            
            setRoadmap(data.roadmap);
            setShowDownloadOptions(true);
            setViewMode('roadmap'); // Switch to roadmap view after successful generation
        } catch (err) {
            console.error('Error generating roadmap:', err);
            setError(err.message || 'Failed to generate roadmap. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const goBackToForm = () => {
        setViewMode('form');
        // Optionally: window.scrollTo(0, 0); // Scroll back to top
    };

    // Function to download the roadmap as a text file
    const downloadRoadmapAsText = () => {
        if (!roadmap) return;
        
        const fileName = `${topic.replace(/\s+/g, '-').toLowerCase()}-${level.toLowerCase()}-roadmap.txt`;
        const blob = new Blob([roadmap], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Function to create a Word document-like HTML and download it
    const downloadRoadmapAsWord = () => {
        if (!roadmap) return;
        
        // Convert roadmap text to HTML with appropriate styling
        const parsedRoadmapData = parseRoadmap();
        let htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>${parsedRoadmapData?.title || `${topic} ${level} Roadmap`}</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
                    h1 { color: #2563eb; margin-bottom: 20px; }
                    h2 { color: #ca8a04; margin-top: 30px; margin-bottom: 15px; }
                    h3 { color: #16a34a; margin-top: 20px; }
                    .week { background-color: #f3f4f6; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
                    .mini-project { background-color: #e5e7eb; padding: 10px; margin-top: 15px; border-radius: 5px; }
                    .mini-project-title { color: #db2777; font-weight: bold; }
                </style>
            </head>
            <body>
        `;

        if (parsedRoadmapData) {
            // Add title and description
            htmlContent += `<h1>${parsedRoadmapData.title}</h1>`;
            htmlContent += `<p>${parsedRoadmapData.description}</p>`;
            
            // Add months, weeks, and tasks
            parsedRoadmapData.months.forEach(month => {
                htmlContent += `<h2>${month.title}</h2>`;
                
                month.weeks.forEach(week => {
                    htmlContent += `<div class="week">`;
                    htmlContent += `<h3>${week.title}</h3>`;
                    
                    htmlContent += `<ul>`;
                    week.tasks.forEach(task => {
                        htmlContent += `<li>${task}</li>`;
                    });
                    htmlContent += `</ul>`;
                    
                    if (week.project) {
                        htmlContent += `<div class="mini-project">`;
                        htmlContent += `<p class="mini-project-title">Mini-Project:</p>`;
                        htmlContent += `<p>${week.project}</p>`;
                        htmlContent += `</div>`;
                    }
                    
                    htmlContent += `</div>`;
                });
            });
        } else {
            // Just add the plain text with minimal formatting
            htmlContent += `<h1>${topic} ${level} Roadmap</h1>`;
            htmlContent += `<pre>${roadmap}</pre>`;
        }
        
        htmlContent += `</body></html>`;
        
        // Create and download the HTML file (will open in Word)
        const fileName = `${topic.replace(/\s+/g, '-').toLowerCase()}-${level.toLowerCase()}-roadmap.doc`;
        const blob = new Blob([htmlContent], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Parse the roadmap text to create a structured format
    const parseRoadmap = () => {
        if (!roadmap) return null;

        try {
            const lines = roadmap.split('\n');
            let currentMonth = null;
            let currentWeek = null;
            let structuredRoadmap = {
                title: '',
                description: '',
                months: []
            };

            for (const line of lines) {
                const trimmedLine = line.trim();
                
                // Parse title
                if (trimmedLine.startsWith('## ')) {
                    structuredRoadmap.title = trimmedLine.replace('## ', '');
                    continue;
                }
                
                // Parse description
                if (!structuredRoadmap.description && !trimmedLine.startsWith('*') && trimmedLine !== '') {
                    if (structuredRoadmap.description) {
                        structuredRoadmap.description += ' ' + trimmedLine;
                    } else {
                        structuredRoadmap.description = trimmedLine;
                    }
                    continue;
                }
                
                // Parse month
                if (trimmedLine.startsWith('**Month')) {
                    const monthTitle = trimmedLine.replace(/\*\*/g, '');
                    currentMonth = {
                        title: monthTitle,
                        weeks: []
                    };
                    structuredRoadmap.months.push(currentMonth);
                    continue;
                }
                
                // Parse week
                if (trimmedLine.startsWith('* **Week')) {
                    if (!currentMonth) continue;
                    
                    const weekInfo = trimmedLine.replace(/\* \*\*/g, '').replace(/\*\*/g, '');
                    currentWeek = {
                        title: weekInfo,
                        tasks: []
                    };
                    currentMonth.weeks.push(currentWeek);
                    continue;
                }
                
                // Parse task or project
                if (trimmedLine.startsWith('* ') && currentWeek) {
                    const task = trimmedLine.replace('* ', '');
                    if (task.includes('**Mini-Project:**')) {
                        currentWeek.project = task.replace(/\*\*Mini-Project:\*\*/g, '').trim();
                    } else {
                        currentWeek.tasks.push(task);
                    }
                }
            }
            
            return structuredRoadmap.months.length > 0 ? structuredRoadmap : null;
        } catch (error) {
            console.error("Error parsing roadmap:", error);
            return null;
        }
    };

    const parsedRoadmap = parseRoadmap();

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4 md:p-6">
            <div className="w-full max-w-4xl">
                <h1 className="text-3xl md:text-4xl font-bold mb-6 text-center">Learning Roadmap Generator</h1>
                
                {/* Input Form */}
                {viewMode === 'form' && (
                    <div className="bg-gray-800 rounded-lg p-4 md:p-6 mb-6">
                        <div className="flex flex-col space-y-4">
                            <div>
                                <label htmlFor="topic" className="block text-gray-300 mb-1">Topic</label>
                                <input
                                    id="topic"
                                    type="text"
                                    placeholder="e.g., React, Machine Learning, Python"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    className="bg-gray-700 text-white p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="level" className="block text-gray-300 mb-1">Expertise Level</label>
                                    <select
                                        id="level"
                                        value={level}
                                        onChange={(e) => setLevel(e.target.value)}
                                        className="bg-gray-700 text-white p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option>Beginner</option>
                                        <option>Intermediate</option>
                                        <option>Advanced</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label htmlFor="sections" className="block text-gray-300 mb-1">Number of Sections</label>
                                    <select
                                        id="sections"
                                        value={sections}
                                        onChange={(e) => setSections(parseInt(e.target.value))}
                                        className="bg-gray-700 text-white p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        {[...Array(10).keys()].map((i) => (
                                            <option key={i + 1} value={i + 1}>{i + 1} {i === 0 ? 'Section' : 'Sections'}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            
                            <button
                                onClick={fetchRoadmap}
                                disabled={loading}
                                className={`w-full p-3 rounded-md font-medium transition-colors ${
                                    loading 
                                    ? 'bg-blue-800 cursor-not-allowed' 
                                    : 'bg-blue-600 hover:bg-blue-700'
                                }`}
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center">
                                        <svg className="animate-spin h-5 w-5 mr-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Generating Roadmap...
                                    </div>
                                ) : 'Generate Roadmap'}
                            </button>
                        </div>
                        
                        {error && (
                            <div className="mt-4 bg-red-900/50 border border-red-500 text-red-200 p-3 rounded-md">
                                <p className="flex items-center">
                                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                                    </svg>
                                    {error}
                                </p>
                            </div>
                        )}
                    </div>
                )}
                
                {/* Roadmap Display */}
                {viewMode === 'roadmap' && parsedRoadmap && (
                    <div className="relative bg-gray-800 p-4 md:p-6 rounded-lg">
                        {/* Back Button */}
                        <button 
                            onClick={goBackToForm}
                            className="mb-4 bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-md flex items-center gap-2 text-sm"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                            </svg>
                            Back to Form
                        </button>
                        
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                            <h2 className="text-2xl md:text-3xl font-bold text-blue-400 mb-4 md:mb-0">{parsedRoadmap.title}</h2>
                            
                            {showDownloadOptions && (
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={downloadRoadmapAsText}
                                        className="bg-teal-600 hover:bg-teal-700 px-3 py-2 rounded-md flex items-center gap-2 text-sm"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                                        </svg>
                                        Download as Text
                                    </button>
                                    
                                    <button
                                        onClick={downloadRoadmapAsWord}
                                        className="bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded-md flex items-center gap-2 text-sm"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                        </svg>
                                        Download as Word
                                    </button>
                                </div>
                            )}
                        </div>
                        
                        <p className="text-gray-300 mb-8">{parsedRoadmap.description}</p>
                        
                        {parsedRoadmap.months.map((month, monthIndex) => (
                            <div key={monthIndex} className="mb-8">
                                <h3 className="text-xl md:text-2xl font-semibold text-yellow-300 mb-4">{month.title}</h3>
                                
                                {month.weeks.map((week, weekIndex) => (
                                    <div key={weekIndex} className="mb-6 bg-gray-700 p-4 rounded-md">
                                        <h4 className="text-lg md:text-xl font-medium text-green-300 mb-3">{week.title}</h4>
                                        
                                        <ul className="space-y-2 text-gray-200">
                                            {week.tasks.map((task, taskIndex) => (
                                                <li key={taskIndex} className="flex items-start">
                                                    <span className="inline-block mr-2 mt-1">•</span>
                                                    <span>{task}</span>
                                                </li>
                                            ))}
                                        </ul>
                                        
                                        {week.project && (
                                            <div className="mt-4 bg-gray-600 p-3 rounded-md">
                                                <p className="font-semibold text-pink-300">Mini-Project:</p>
                                                <p className="text-gray-200">{week.project}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ))}
                        
                        {/* Bottom Back Button for long roadmaps */}
                        <button 
                            onClick={goBackToForm}
                            className="mt-6 bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-md flex items-center gap-2 text-sm"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                            </svg>
                            Back to Form
                        </button>
                    </div>
                )}
                
                {/* Plain text roadmap view */}
                {viewMode === 'roadmap' && !parsedRoadmap && roadmap && (
                    <div className="bg-gray-800 p-4 rounded-md w-full">
                        {/* Back Button */}
                        <button 
                            onClick={goBackToForm}
                            className="mb-4 bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-md flex items-center gap-2 text-sm"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                            </svg>
                            Back to Form
                        </button>
                        
                        <div className="flex justify-end mb-4 gap-2">
                            <button
                                onClick={downloadRoadmapAsText}
                                className="bg-teal-600 hover:bg-teal-700 px-3 py-2 rounded-md flex items-center gap-2 text-sm"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                                </svg>
                                Download as Text
                            </button>
                            
                            <button
                                onClick={downloadRoadmapAsWord}
                                className="bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded-md flex items-center gap-2 text-sm"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                </svg>
                                Download as Word
                            </button>
                        </div>
                        <pre className="whitespace-pre-wrap text-gray-300 overflow-x-auto">{roadmap}</pre>
                        
                        {/* Bottom Back Button for long roadmaps */}
                        <button 
                            onClick={goBackToForm}
                            className="mt-6 bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-md flex items-center gap-2 text-sm"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                            </svg>
                            Back to Form
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default RoadmapGenerator;