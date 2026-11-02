import React, { useState, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Markdown from '../components/Markdown';
import { postJSON } from '../lib/api';

const escapeHtml = (text = '') =>
  String(text).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

const NotesGenerator = () => {
  const [subject, setSubject] = useState('');
  const [level, setLevel] = useState('intermediate');
  const [format, setFormat] = useState('structured');
  const [loading, setLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notes, setNotes] = useState(null);
  const notesRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!subject.trim()) {
      setError('Please enter a subject');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await postJSON('/notes', { subject: subject.trim(), level, format });
      setNotes(data.notes);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Word opens HTML saved with a .doc extension, so reuse the HTML that is
  // already rendered on screen instead of converting the Markdown again.
  const downloadAsWord = () => {
    if (!notes || !notesRef.current) return;
    setDownloadLoading(true);

    try {
      const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(notes.title)}</title>
  <style>
    body { font-family: Calibri, Arial, sans-serif; line-height: 1.5; margin: 2cm; }
    h1 { font-size: 18pt; color: #2F5496; }
    h2, h3 { color: #2F5496; margin-top: 18pt; }
    p, li { font-size: 11pt; }
    table { border-collapse: collapse; }
    th, td { border: 1px solid #999; padding: 4pt 8pt; }
    .meta { color: #666; font-style: italic; margin-bottom: 24pt; }
    pre, code { font-family: Consolas, monospace; }
  </style>
</head>
<body>
  <h1>${escapeHtml(notes.title)}</h1>
  <div class="meta">Level: ${escapeHtml(notes.level)} | Format: ${escapeHtml(format)}</div>
  ${notesRef.current.innerHTML}
</body>
</html>`;

      const url = URL.createObjectURL(new Blob([htmlContent], { type: 'application/msword' }));
      const link = document.createElement('a');
      link.download = `${subject.trim().replace(/\s+/g, '-').toLowerCase()}-notes.doc`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        URL.revokeObjectURL(url);
        document.body.removeChild(link);
      }, 100);
    } catch (err) {
      setError('Failed to download Word document. Please try again.');
    } finally {
      setDownloadLoading(false);
    }
  };

  const renderNoteSection = (section, index) => (
    <div key={index} className="mb-8 p-5 bg-white rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b border-gray-200 pb-2">{section.title}</h2>
      <Markdown className="text-gray-700">{section.content}</Markdown>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <Head>
        <title>Study Notes · ThinkCheck</title>
      </Head>
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="no-print inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-4">
            ← Home
          </Link>
          <h1 className="no-print text-4xl font-bold mb-8 text-center text-gray-800">Study Notes Generator</h1>

          {!notes && (
          <form onSubmit={handleSubmit} className="no-print mb-8 bg-white p-6 rounded-lg shadow-md">
            <div className="mb-5">
              <label htmlFor="subject" className="block text-sm font-medium mb-2 text-gray-700">
                Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="subject"
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-black"
                placeholder="Enter subject (e.g., Database Management Systems, Machine Learning)"
                maxLength={200}
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
                  <option value="visual">Visual (tables &amp; diagrams)</option>
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
          )}
          
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
              
              <div className="border-b border-gray-200 mb-6"></div>
              
              <div className="space-y-6" ref={notesRef}>
                {notes.sections.map((section, index) => (
                  renderNoteSection(section, index)
                ))}
              </div>
              
              <div className="no-print mt-8 flex flex-wrap gap-3 justify-between">
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