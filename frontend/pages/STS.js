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
                    sections,  // Now sending the sections parameter
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

    // Parse the roadmap text to create a structured format
    const parseRoadmap = () => {
        if (!roadmap) return null;

        const lines = roadmap.split('\n');
        let title = '';
        let description = '';
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
                    <h2 className="text-3xl font-bold text-blue-400 mb-4">{parsedRoadmap.title}</h2>
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
                        <pre className="whitespace-pre-wrap text-gray-300">{roadmap}</pre>
                    </div>
                )
            )}
        </div>
    );
}

export default RoadmapGenerator;    