import React, { useState } from 'react';

function RoadmapGenerator() {
    const [roadmap, setRoadmap] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [topic, setTopic] = useState('');
    const [level, setLevel] = useState('Beginner');
    const [sections, setSections] = useState(7);

    const fetchRoadmap = async () => {
        setLoading(true);
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
                throw new Error(`Error: ${response.statusText}`);
            }
            const data = await response.json();
            setRoadmap(data.roadmap);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
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
                    body { font-family: Arial, sans-serif; line-height: 1.6; }
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
        
        return structuredRoadmap;
    };

    const parsedRoadmap = parseRoadmap();

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6">
            <h1 className="text-4xl font-bold mb-6">Learning Roadmap Generator</h1>
            <div className="flex gap-2 mb-4">
                <input
                    type="text"
                    placeholder="Enter a topic (e.g., React, Machine Learning)"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="bg-gray-800 text-white p-2 rounded-md w-80 focus:outline-none"
                />
                <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="bg-gray-800 text-white p-2 rounded-md"
                >
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                </select>
                <select
                    value={sections}
                    onChange={(e) => setSections(parseInt(e.target.value))}
                    className="bg-gray-800 text-white p-2 rounded-md"
                >
                    {[...Array(10).keys()].map((i) => (
                        <option key={i + 1} value={i + 1}>{i + 1} Sections</option>
                    ))}
                </select>
                <button
                    onClick={fetchRoadmap}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 p-2 rounded-md"
                >
                    {loading ? 'Loading...' : 'Generate Roadmap'}
                </button>
            </div>
            {error && <p className="text-red-500">{error}</p>}
            
            {parsedRoadmap ? (
                <div className="bg-gray-800 p-6 rounded-lg mt-4 w-full max-w-4xl">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-3xl font-bold text-blue-400">{parsedRoadmap.title}</h2>
                        <div className="flex gap-2">
                            
                            <button
                                onClick={downloadRoadmapAsWord}
                                className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-md flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                </svg>
                                Download as Word
                            </button>
                        </div>
                    </div>
                    <p className="text-gray-300 mb-6">{parsedRoadmap.description}</p>
                    
                    {parsedRoadmap.months.map((month, monthIndex) => (
                        <div key={monthIndex} className="mb-8">
                            <h3 className="text-2xl font-semibold text-yellow-300 mb-4">{month.title}</h3>
                            
                            {month.weeks.map((week, weekIndex) => (
                                <div key={weekIndex} className="mb-6 bg-gray-700 p-4 rounded-md">
                                    <h4 className="text-xl font-medium text-green-300 mb-3">{week.title}</h4>
                                    
                                    <ul className="list-disc list-inside space-y-2 text-gray-200">
                                        {week.tasks.map((task, taskIndex) => (
                                            <li key={taskIndex} className="ml-4">{task}</li>
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
                </div>
            ) : (
                roadmap && (
                    <div className="bg-gray-800 p-4 rounded-md mt-4 w-full max-w-4xl">
                        <div className="flex justify-end mb-2 gap-2">
                            
                            <button
                                onClick={downloadRoadmapAsWord}
                                className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-md flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                </svg>
                                Download as Word
                            </button>
                        </div>
                        <pre className="whitespace-pre-wrap text-gray-300">{roadmap}</pre>
                    </div>
                )
            )}
        </div>
    );
}

export default RoadmapGenerator;