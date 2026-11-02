import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { postJSON } from '../lib/api';

const TIMEFRAMES = ['2 weeks', '1 month', '2 months', '3 months', '6 months'];

const escapeHtml = (text = '') =>
    String(text).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

function downloadFile(content, fileName, type) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function roadmapToText(roadmap) {
    const lines = [roadmap.title, '', roadmap.description, ''];
    roadmap.phases.forEach((phase) => {
        lines.push(phase.title.toUpperCase(), '');
        phase.weeks.forEach((week) => {
            lines.push(week.title);
            week.tasks.forEach((task) => lines.push(`  - ${task}`));
            if (week.project) lines.push(`  Mini-project: ${week.project}`);
            lines.push('');
        });
    });
    return lines.join('\n');
}

function roadmapToWordHtml(roadmap) {
    const body = roadmap.phases
        .map(
            (phase) => `<h2>${escapeHtml(phase.title)}</h2>` +
                phase.weeks
                    .map(
                        (week) => `<div class="week"><h3>${escapeHtml(week.title)}</h3><ul>` +
                            week.tasks.map((task) => `<li>${escapeHtml(task)}</li>`).join('') +
                            '</ul>' +
                            (week.project
                                ? `<div class="mini-project"><p class="mini-project-title">Mini-Project:</p><p>${escapeHtml(week.project)}</p></div>`
                                : '') +
                            '</div>'
                    )
                    .join('')
        )
        .join('');

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${escapeHtml(roadmap.title)}</title>
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
    <h1>${escapeHtml(roadmap.title)}</h1>
    <p>${escapeHtml(roadmap.description)}</p>
    ${body}
</body>
</html>`;
}

function RoadmapGenerator() {
    const [roadmap, setRoadmap] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [topic, setTopic] = useState('');
    const [level, setLevel] = useState('Beginner');
    const [timeframe, setTimeframe] = useState('3 months');
    const [viewMode, setViewMode] = useState('form'); // 'form' or 'roadmap'

    // Reset error when inputs change
    useEffect(() => {
        setError('');
    }, [topic, level, timeframe]);

    const fetchRoadmap = async () => {
        if (!topic.trim()) {
            setError('Please enter a topic');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const data = await postJSON('/generate-roadmap', { topic: topic.trim(), timeframe, level });
            setRoadmap(data.roadmap);
            setViewMode('roadmap');
            window.scrollTo({ top: 0 });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const goBackToForm = () => setViewMode('form');

    const baseFileName = `${topic.trim().replace(/\s+/g, '-').toLowerCase()}-${level.toLowerCase()}-roadmap`;
    const downloadRoadmapAsText = () => roadmap && downloadFile(roadmapToText(roadmap), `${baseFileName}.txt`, 'text/plain');
    // An HTML document saved with a .doc extension opens directly in Word.
    const downloadRoadmapAsWord = () => roadmap && downloadFile(roadmapToWordHtml(roadmap), `${baseFileName}.doc`, 'application/msword');

    const backIcon = (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
        </svg>
    );

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4 md:p-6">
            <Head>
                <title>Learning Roadmap · ThinkCheck</title>
            </Head>
            <div className="w-full max-w-4xl">
                <Link href="/" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white mb-4">
                    {backIcon} Home
                </Link>
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
                                    maxLength={200}
                                    onChange={(e) => setTopic(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && !loading && fetchRoadmap()}
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
                                    <label htmlFor="timeframe" className="block text-gray-300 mb-1">Timeframe</label>
                                    <select
                                        id="timeframe"
                                        value={timeframe}
                                        onChange={(e) => setTimeframe(e.target.value)}
                                        className="bg-gray-700 text-white p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        {TIMEFRAMES.map((t) => (
                                            <option key={t} value={t}>{t}</option>
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
                {viewMode === 'roadmap' && roadmap && (
                    <div className="relative bg-gray-800 p-4 md:p-6 rounded-lg">
                        <button
                            onClick={goBackToForm}
                            className="mb-4 bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-md flex items-center gap-2 text-sm"
                        >
                            {backIcon}
                            Back to Form
                        </button>

                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                            <h2 className="text-2xl md:text-3xl font-bold text-blue-400">{roadmap.title}</h2>

                            <div className="flex flex-wrap gap-2 shrink-0">
                                <button
                                    onClick={downloadRoadmapAsText}
                                    className="bg-teal-600 hover:bg-teal-700 px-3 py-2 rounded-md flex items-center gap-2 text-sm"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                                    </svg>
                                    Download as Text
                                </button>
                                <button
                                    onClick={downloadRoadmapAsWord}
                                    className="bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded-md flex items-center gap-2 text-sm"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                    </svg>
                                    Download as Word
                                </button>
                            </div>
                        </div>

                        <p className="text-gray-300 mb-2">{roadmap.description}</p>
                        <p className="text-sm text-gray-400 mb-8">{level} · {timeframe}</p>

                        {roadmap.phases.map((phase, phaseIndex) => (
                            <div key={phaseIndex} className="mb-8">
                                <h3 className="text-xl md:text-2xl font-semibold text-yellow-300 mb-4">{phase.title}</h3>

                                {phase.weeks.map((week, weekIndex) => (
                                    <div key={weekIndex} className="mb-6 bg-gray-700 p-4 rounded-md">
                                        <h4 className="text-lg md:text-xl font-medium text-green-300 mb-3">{week.title}</h4>

                                        <ul className="space-y-2 text-gray-200">
                                            {week.tasks.map((task, taskIndex) => (
                                                <li key={taskIndex} className="flex items-start">
                                                    <span className="inline-block mr-2 mt-1" aria-hidden="true">•</span>
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

                        <button
                            onClick={goBackToForm}
                            className="mt-6 bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-md flex items-center gap-2 text-sm"
                        >
                            {backIcon}
                            Back to Form
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default RoadmapGenerator;