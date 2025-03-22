import React, { useState } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

// Updated solution for direct Word document download
const NotesGenerator = () => {
  const [subject, setSubject] = useState('');
  const [level, setLevel] = useState('intermediate');
  const [format, setFormat] = useState('structured');
  const [loading, setLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notes, setNotes] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!subject.trim()) {
      setError('Please enter a subject');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('https://thinkcheck.onrender.com/notes', {
        subject,
        level,
        format
      });
      
      setNotes(response.data.notes);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate notes. Please try again.');
      console.error('Error generating notes:', err);
    } finally {
      setLoading(false);
    }
  };

  // Function to convert markdown to HTML
  const markdownToHtml = (markdown) => {
    let html = markdown
      // Convert headers
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      // Convert code blocks
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      // Convert inline code
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // Convert bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Convert italic
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Convert lists
      .replace(/^\s*[-*+]\s+(.*$)/gm, '<li>$1</li>')
      // Convert paragraphs
      .replace(/^(?!<[hl]|<li)(.*$)/gm, '<p>$1</p>')
      // Fix list structure
      .replace(/<li>.*(?:\n<li>.*)+/g, match => `<ul>${match}</ul>`);
      
    return html;
  };

  // Function to download notes as Word document using Mammoth converter
  const downloadAsWord = async () => {
    if (!notes) return;
    
    setDownloadLoading(true);
    
    try {
      // Create HTML content
      let htmlContent = `<!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${notes.title}</title>
        <style>
          body { font-family: Calibri, Arial, sans-serif; line-height: 1.5; margin: 2cm; }
          h1 { font-size: 18pt; color: #2F5496; }
          h2 { font-size: 16pt; color: #2F5496; margin-top: 24pt; }
          h3 { font-size: 14pt; color: #1F3864; }
          p { font-size: 11pt; }
          .meta { color: #666; font-style: italic; margin-bottom: 24pt; }
          pre { background: #f5f5f5; padding: 8pt; font-family: Consolas, monospace; }
          code { background: #f5f5f5; padding: 2pt; font-family: Consolas, monospace; }
        </style>
      </head>
      <body>
        <h1>${notes.title}</h1>
        <div class="meta">Level: ${notes.level} | Format: ${format}</div>`;
      
      // Add each section
      notes.sections.forEach(section => {
        htmlContent += `
          <h2>${section.title}</h2>
          ${markdownToHtml(section.content)}
        `;
      });
      
      htmlContent += `</body></html>`;
      
      // Create Word document using the HTML content
      const blob = new Blob([htmlContent], { type: 'text/html' });
      
      // Create a data URI for the Blob
      const url = URL.createObjectURL(blob);
      
      // Create the download link
      const link = document.createElement('a');
      
      // Set the filename with .doc extension (which Word can open)
      link.download = `${subject.replace(/\s+/g, '-').toLowerCase()}-notes.doc`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        URL.revokeObjectURL(url);
        document.body.removeChild(link);
      }, 100);
    } catch (err) {
      setError('Failed to download Word document. Please try again.');
      console.error('Error downloading Word document:', err);
    } finally {
      setDownloadLoading(false);
    }
  };

  // Simplified rendering for code blocks without external dependencies
  const renderNoteSection = (section, index) => {
    return (
      <div key={index} className="mb-8 p-5 bg-white rounded-lg shadow-sm">
        <h3 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">{section.title}</h3>
        <div className="prose max-w-none text-gray-700">
          <ReactMarkdown
            components={{
              code: ({ node, inline, className, children, ...props }) => {
                const match = /language-(\w+)/.exec(className || '');
                return !inline ? (
                  <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
                    <code className={match ? `language-${match[1]}` : ''} {...props}>
                      {children}
                    </code>
                  </pre>
                ) : (
                  <code className="bg-gray-100 px-1 py-0.5 rounded text-sm" {...props}>
                    {children}
                  </code>
                );
              }
            }}
          >
            {section.content}
          </ReactMarkdown>
        </div>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center text-gray-800">Study Notes Generator</h1>
          
          <form onSubmit={handleSubmit} className="mb-8 bg-white p-6 rounded-lg shadow-md">
            <div className="mb-5">
              <label htmlFor="subject" className="block text-sm font-medium mb-2 text-gray-700">
                Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="subject"
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-black"
                placeholder="Enter subject (e.g., Database Management Systems, Machine Learning)"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
              <p className="mt-1 text-xs text-gray-500">Be specific for better results</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="level" className="block text-sm font-medium mb-2 text-gray-700">
                  Complexity Level
                </label>
                <select
                  id="level"
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-black"
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="format" className="block text-sm font-medium mb-2 text-gray-700">
                  Format Style
                </label>
                <select
                  id="format"
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-black"
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                >
                  <option value="structured">Structured</option>
                  <option value="detailed">Detailed with Examples</option>
                  <option value="concise">Concise Bullet Points</option>
                  <option value="visual">Visual with Diagrams</option>
                </select>
              </div>
            </div>
            
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition duration-300 flex items-center justify-center font-medium"
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating Notes...
                </>
              ) : 'Generate Notes'}
            </button>
          </form>
          
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded" role="alert">
              <p className="font-medium">Error</p>
              <p>{error}</p>
            </div>
          )}
          
          {notes && (
            <div className="bg-white p-6 rounded-lg shadow-md mb-10">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-gray-800">{notes.title}</h2>
                <div className="flex gap-2">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    {notes.level}
                  </span>
                  <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                    {format}
                  </span>
                </div>
              </div>
              
              <div className="border-b mb-6"></div>
              
              <div className="space-y-6">
                {notes.sections.map((section, index) => (
                  renderNoteSection(section, index)
                ))}
              </div>
              
              <div className="mt-8 flex flex-wrap gap-3 justify-between">
                <button
                  onClick={() => setNotes(null)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded inline-flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Form
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={() => window.print()}
                    className="bg-gray-800 hover:bg-gray-900 text-white font-medium py-2 px-4 rounded inline-flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Print Notes
                  </button>
                  <button
                    onClick={downloadAsWord}
                    disabled={downloadLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded inline-flex items-center"
                  >
                    {downloadLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Downloading...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download as Word
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotesGenerator;