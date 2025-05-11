require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 5000;

// Set request timeout and size limits
app.use(express.json({ limit: '1mb' }));
app.use(cors());

// Create axios instance with timeout
const api = axios.create({
  timeout: 30000 // 30 second timeout for all requests
});

// GROK API Configuration
// Since we only have the API key, we'll use a default URL that can be updated later
const GROK_API_URL = process.env.GROK_API_URL || 'https://api.grok.com/v1'; // You'll need to update this
const GROK_API_KEY = process.env.GROK_API_KEY;

app.get('/', (req, res) => {
  res.send('Welcome to the MCQ Generator API. Use the /generate-mcq, /generate-written, /evaluate-answers, or /generate-roadmap endpoints to interact with the service.');
});

// Helper function to make requests to the Grok API
async function callGrokAPI(prompt, options = {}) {
  if (!GROK_API_KEY) {
    throw new Error("Missing GROK_API_KEY in environment variables");
  }

  const defaultOptions = {
    temperature: 0.2,
    maxTokens: 2048
  };

  const requestOptions = { ...defaultOptions, ...options };

  try {
    console.log(`Calling Grok API with prompt: ${prompt.substring(0, 50)}...`);
    
    // This is a flexible implementation that can be adjusted based on Grok's actual API
    const response = await api.post(
      `${GROK_API_URL}/chat/completions`, // Common endpoint pattern for chat models
      {
        // Most common fields for AI chat APIs - adjust based on Grok's documentation
        messages: [
          { role: "system", content: "You are a helpful educational content generator." },
          { role: "user", content: prompt }
        ],
        model: process.env.GROK_MODEL || "grok-1", // Update with correct model name
        temperature: requestOptions.temperature,
        max_tokens: requestOptions.maxTokens
      },
      {
        headers: {
          "Authorization": `Bearer ${GROK_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    // Log response structure to help debugging
    console.log("API response structure:", JSON.stringify(Object.keys(response.data), null, 2));
    
    // Try multiple common response formats used by AI APIs
    let responseText;
    
    // Format 1: OpenAI-like format
    if (response.data.choices && response.data.choices[0]) {
      responseText = response.data.choices[0].message?.content || 
                    response.data.choices[0].text || 
                    "";
    } 
    // Format 2: Direct content format
    else if (response.data.content) {
      responseText = response.data.content;
    }
    // Format 3: Simple text format
    else if (response.data.text) {
      responseText = response.data.text;
    }
    // Fallback: try to get any text
    else {
      console.warn("Unexpected API response format:", response.data);
      // Attempt to extract text from any available field
      responseText = response.data.output || 
                     response.data.result || 
                     response.data.generated_text ||
                     JSON.stringify(response.data);
    }
    
    return responseText;
  } catch (error) {
    console.error("Error calling Grok API:", error.message);
    if (error.response) {
      console.error("Error details:", error.response.data);
    }
    throw error;
  }
}

// Helper function to format the prompt from student responses
function formatPromptFromResponses(responses) {
  // Limit the number of responses to avoid excessively large prompts
  const limitedResponses = responses.slice(0, 20);
  
  const interestsStr = limitedResponses.map((r, i) => `Question ${i+1}: ${r.question}\nAnswer: ${r.answer}`).join('\n\n');
  
  return `
Based on the following student responses, suggest appropriate educational paths after high school, including but not limited to B.Tech programs. Consider various domains and career paths that match their interests and aptitudes.

${interestsStr}

Please provide:
1. Top 3 recommended educational paths with justification
2. Specific courses or majors within each path
3. Potential career outcomes for each path
4. Alternative options beyond traditional degree programs (if appropriate)
5. Skills the student should develop regardless of their chosen path
`;
}

// Helper function to process and structure the suggestions
function processSuggestions(responseText) {
  try {
    if (!responseText) {
      throw new Error("Empty response from Grok API");
    }
    
    // For now, return the raw response - in production you might parse it into a more structured format
    return {
      rawSuggestions: responseText,
      // You could add more structured fields here by parsing the response
    };
  } catch (error) {
    console.error("Error processing suggestions:", error);
    return { error: "Failed to process suggestions" };
  }
}

app.post('/generate-mcq', async (req, res) => {
  const { topic, numQuestions } = req.body;
  
  if (!topic || !numQuestions) {
    return res.status(400).json({ error: "Missing topic or numQuestions" });
  }
  
  // Limit number of questions to prevent large requests
  const limitedQuestions = Math.min(parseInt(numQuestions) || 5, 10);
  
  try {
    const prompt = `Generate ${limitedQuestions} multiple-choice questions on the topic: ${topic}.

For questions involving code:
1. Include relevant code snippets where applicable
2. Format all code snippets using proper markdown code blocks with language specification
3. Example format: \`\`\`javascript\\nconsole.log("Hello");\\n\`\`\`
4. Do not add extra quotes around the code block markers

Each question should:
- Have 4 answer choices labeled a), b), c), and d)
- Indicate the correct answer as "Correct Answer: x)"
- Include a brief explanation of why the correct answer is right
- Be separated by a blank line

Example format:
1. What does the following code output?

\`\`\`javascript
console.log(2 + "2");
\`\`\`

a) 4
b) 22
c) "22"
d) Error

Correct Answer: b)

Explanation: In JavaScript, when you add a number and a string, the number is converted to a string and then concatenation occurs.`;

    const mcqText = await callGrokAPI(prompt, {
      temperature: 0.2,
      maxTokens: 2048
    });
    
    if (!mcqText) {
      console.error("MCQ text is empty or undefined!");
      return res.status(500).json({ error: "Empty MCQ response from Grok API" });
    }
    
    // Convert formatted text into structured JSON
    const mcqArray = parseMcqText(mcqText);
    
    res.json({ questions: mcqArray });
  } catch (error) {
    console.error("Error fetching MCQs:", error.message);
    res.status(error.response?.status || 500).json({ error: "Failed to generate MCQs", details: error.message });
  }
});

function parseMcqText(mcqText) {
  if (!mcqText) {
    console.error("Empty MCQ text received.");
    return [];
  }

  try {
    const questions = [];
    
    // Simplified parsing strategy - split by question numbers
    const questionBlocks = mcqText.split(/(?:^|\n)(?:\d+\.|Question\s+\d+:)/i)
      .filter(block => block.trim().length > 0);

    for (let block of questionBlocks) {
      try {
        // Basic extraction of question parts
        const lines = block.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        
        if (lines.length < 5) continue;

        // Get the question text (everything before first option)
        let questionText = "";
        let choiceIndex = lines.findIndex(line => /^[a-d]\)/.test(line));
        
        if (choiceIndex === -1) continue;
        
        questionText = lines.slice(0, choiceIndex).join('\n');
        
        // Extract choices
        const choices = [];
        for (let i = choiceIndex; i < lines.length; i++) {
          if (/^[a-d]\)/.test(lines[i])) {
            choices.push(lines[i]);
          }
          if (choices.length === 4) break;
        }
        
        // Find correct answer
        const correctAnswerLine = lines.find(line => /Correct Answer:\s*[a-d]\)/i.test(line));
        const correctAnswer = correctAnswerLine ? 
          correctAnswerLine.match(/Correct Answer:\s*([a-d])\)/i)?.[1] : null;
          
        const explanationIndex = lines.findIndex(line => /explanation|reason/i.test(line));
        const explanation = explanationIndex > -1 ? 
          lines.slice(explanationIndex).join(' ') : "";
        
        if (questionText && choices.length === 4 && correctAnswer) {
          questions.push({
            question: questionText.trim(),
            choices: choices,
            correctAnswer: correctAnswer,
            explanation: explanation.trim(),
            difficulty: "medium"
          });
        }
      } catch (blockError) {
        console.warn("Error parsing question block:", blockError.message);
        // Continue with next block instead of failing entire function
        continue;
      }
    }
    
    return questions;
  } catch (error) {
    console.error("Error in parseMcqText:", error.message);
    return [];
  }
}

app.post('/generate-written', async (req, res) => {
  const { topic, numQuestions, difficulty, categories } = req.body;
  
  if (!topic || !numQuestions) {
    return res.status(400).json({ error: "Missing topic or numQuestions" });
  }
  
  // Limit number of questions to prevent large requests
  const limitedQuestions = Math.min(parseInt(numQuestions) || 3, 5);
  
  try {
    const prompt = `Generate ${limitedQuestions} open-ended written questions on the topic: ${topic}.
                
Topic details: ${topic}
Difficulty level: ${difficulty || 'medium'}
Question categories: ${categories || 'Fundamentals'}

For each question:
1. Create a thoughtful, open-ended question that requires explanation and analysis
2. Focus on the specified categories: ${categories || 'Fundamentals'}
3. Make the questions appropriate for ${difficulty || 'medium'} difficulty level
4. Include any necessary context needed to answer the question
5. Each question should be numbered and separated by a blank line
6. Don't include code snippets even if requested.

Example format:
1. Explain the concept of closure in JavaScript and provide an example of how it can be used to create private variables. How does this pattern help with encapsulation in application development?

2. Compare and contrast REST and GraphQL APIs. What are the advantages and disadvantages of each approach, and in what scenarios would you choose one over the other?`;

    const questionsText = await callGrokAPI(prompt, {
      temperature: 0.2,
      maxTokens: 1024
    });
    
    if (!questionsText) {
      console.error("Questions text is empty or undefined!");
      return res.status(500).json({ error: "Empty response from Grok API" });
    }
    
    // Convert formatted text into structured JSON
    const questionsArray = parseWrittenQuestions(questionsText, categories || 'Fundamentals', difficulty || 'medium');
    
    res.json({ questions: questionsArray });
  } catch (error) {
    console.error("Error fetching written questions:", error.message);
    res.status(error.response?.status || 500).json({ error: "Failed to generate questions", details: error.message });
  }
});

function parseWrittenQuestions(questionsText, categoriesStr, difficulty) {
  try {
    if (!questionsText) {
      console.error("Empty questions text received.");
      return [];
    }
    
    const questions = [];
    const categories = categoriesStr ? categoriesStr.split(',').map(cat => cat.trim()) : ["Fundamentals"];
        
    // Split by question number pattern
    const questionBlocks = questionsText.split(/(?:^|\n)(?:\d+\.|\d+\))/)
      .filter(block => block.trim().length > 0);
    
    for (let i = 0; i < questionBlocks.length; i++) {
      const block = questionBlocks[i].trim();
      if (!block) continue;
      
      // Assign a category - rotate through available categories or use default
      const categoryIndex = i % categories.length;
      const category = categories[categoryIndex] || "Fundamentals";
      
      questions.push({
        question: block,
        category: category,
        difficulty: difficulty || "medium"
      });
    }
        
    return questions;
  } catch (error) {
    console.error("Error parsing written questions:", error.message);
    return [];
  }
}

app.post("/evaluate-answers", async (req, res) => {
  const { questions, answers, topic, difficulty } = req.body;
  
  // Input validation
  if (!questions || !answers || questions.length !== answers.length) {
    return res.status(400).json({ error: "Invalid request data" });
  }

  // Limit the number of evaluations
  const maxEvaluations = 5;
  const evaluationCount = Math.min(questions.length, maxEvaluations);
  
  try {
    // Use Promise.all with timeout instead of map for parallel processing with timeout
    const evaluationPromises = [];
    
    for (let i = 0; i < evaluationCount; i++) {
      const question = questions[i];
      const answer = answers[i].trim();
      
      if (!answer) {
        evaluationPromises.push(Promise.resolve({ 
          score: 0, 
          comments: "No answer provided.", 
          suggestions: ["Please provide an answer."] 
        }));
        continue;
      }
      
      // Create a promise with timeout for each evaluation
      const evalPromise = Promise.race([
        evaluateAnswer(question, answer, topic, difficulty),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Evaluation timed out')), 15000)
        )
      ]).catch(error => {
        console.error(`Evaluation ${i + 1} error:`, error.message);
        return {
          score: 50,
          comments: "Evaluation timed out. Your answer has been recorded.",
          suggestions: ["The system was unable to complete the evaluation in time."]
        };
      });
      
      evaluationPromises.push(evalPromise);
    }
    
    const feedbackArray = await Promise.all(evaluationPromises);
    
    // Calculate overall score
    const validScores = feedbackArray.filter(item => typeof item.score === 'number' && !isNaN(item.score));
    const totalScore = validScores.reduce((sum, item) => sum + item.score, 0);
    const overallPercentage = validScores.length ? Math.round(totalScore / validScores.length) : 50;
    
    const responseData = {
      feedback: feedbackArray,
      overallScore: overallPercentage,
      metrics: {
        questionsEvaluated: validScores.length,
        highestScore: Math.max(...validScores.map(item => item.score), 0),
        lowestScore: Math.min(...validScores.map(item => item.score), 100),
        evaluationTimestamp: new Date().toISOString()
      }
    };
    
    res.json(responseData);
  } catch (error) {
    console.error("Evaluation failed:", error.message);
    res.status(500).json({ 
      error: "Internal server error during evaluation process.",
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

async function evaluateAnswer(question, answer, topic, difficulty) {
  try {
    // Simplified prompt with clear instructions
    const promptText = `Evaluate this ${topic || "subject"} answer (${difficulty || "medium"} level).
Question: "${question}"
Answer: "${answer}"

Return only JSON: {"score": [0-100], "comments": "feedback", "suggestions": ["suggestion1", "suggestion2"]}`;

    const responseText = await callGrokAPI(promptText, {
      temperature: 0.1,
      maxTokens: 512
    });
    
    if (!responseText) {
      throw new Error("Empty response from API");
    }
    
    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No valid JSON found in response");
    }
    
    const parsedResponse = JSON.parse(jsonMatch[0]);
    
    // Validate and sanitize
    return {
      score: Math.min(100, Math.max(0, Math.round(parsedResponse.score || 50))),
      comments: parsedResponse.comments || "No specific feedback available.",
      suggestions: Array.isArray(parsedResponse.suggestions) ? 
        parsedResponse.suggestions.slice(0, 3) : 
        ["Review your answer for completeness.", "Check that you've addressed all parts of the question."]
    };
  } catch (error) {
    console.error("Error evaluating answer:", error.message);
    return {
      score: 50,
      comments: "Error during evaluation. Your answer has been recorded.",
      suggestions: ["Please check back later for a complete evaluation."]
    };
  }
}

app.post('/generate-roadmap', async (req, res) => {
  const { topic, timeframe, level } = req.body;

  if (!topic || !timeframe) {
    return res.status(400).json({ 
      success: false,
      message: "Both 'topic' and 'timeframe' are required" 
    });
  }

  try {
    const prompt = `Generate a learning roadmap for the topic: ${topic} with a timeframe of ${timeframe} ${level ? `for ${level} level learners` : ''}.`;

    const roadmapText = await callGrokAPI(prompt, {
      temperature: 0.2,
      maxTokens: 2048
    });
    
    if (!roadmapText) {
      return res.status(500).json({ 
        success: false,
        message: "Failed to retrieve roadmap from the API" 
      });
    }

    res.json({ 
      success: true,
      topic,
      timeframe,
      level: level || "general",
      roadmap: roadmapText
    });
  } catch (error) {
    console.error("Error fetching roadmap:", error.message);
    res.status(error.response?.status || 500).json({ 
      success: false,
      message: "Error occurred while generating the roadmap",
      error: error.message
    });
  }
});

app.post('/notes', async (req, res) => {
  const { subject, level, format } = req.body;
  
  if (!subject) {
    return res.status(400).json({ error: "Missing subject parameter" });
  }
  
  try {
    const prompt = `Generate concise study notes on: ${subject}.
                
Subject: ${subject}
Level: ${level || 'intermediate'}
Format: ${format || 'structured'}

Create notes that:
1. Provide a clear introduction
2. Cover key concepts 
3. Include important definitions and examples
4. Organize with appropriate headings
5. Keep content concise and focused
6. Include a brief summary`;

    const notesText = await callGrokAPI(prompt, {
      temperature: 0.2,
      maxTokens: 4096
    });
    
    if (!notesText) {
      console.error("Notes text is empty or undefined!");
      return res.status(500).json({ error: "Empty response from Grok API" });
    }
    
    // Parse the notes to provide a structured response
    const notes = parseNotes(notesText, subject, level || 'intermediate');
    
    res.json({ 
      success: true,
      subject,
      level: level || 'intermediate',
      format: format || 'structured',
      notes 
    });
  } catch (error) {
    console.error("Error generating notes:", error.message);
    res.status(error.response?.status || 500).json({ 
      success: false,
      error: "Failed to generate notes",
      message: error.message
    });
  }
});

function parseNotes(notesText, subject, level) {
  try {
    // Extract sections using regex patterns
    const sections = [];
    
    // Split by headers (# or ## format)
    const headerRegex = /(?:^|\n)(?:#{1,3})\s+(.+?)(?:\n|$)/g;
    
    let match;
    let headerPositions = [];
    
    // Find all headers and their positions
    while ((match = headerRegex.exec(notesText)) !== null) {
      headerPositions.push({
        title: match[1].trim(),
        startIndex: match.index,
        endIndex: match.index + match[0].length
      });
    }
    
    // Process each section
    for (let i = 0; i < headerPositions.length; i++) {
      const currentHeader = headerPositions[i];
      const nextHeader = headerPositions[i + 1];
      
      // Extract section content
      const sectionContent = nextHeader 
        ? notesText.substring(currentHeader.endIndex, nextHeader.startIndex).trim()
        : notesText.substring(currentHeader.endIndex).trim();
      
      sections.push({
        title: currentHeader.title,
        content: sectionContent
      });
    }
    
    // If no sections were found, return the entire text as one section
    if (sections.length === 0) {
      sections.push({
        title: subject,
        content: notesText
      });
    }
    
    return {
      title: subject,
      level: level,
      sections: sections.slice(0, 10), // Limit number of sections returned
      fullText: notesText
    };
  } catch (error) {
    console.error("Error parsing notes:", error.message);
    return {
      title: subject,
      level: level,
      sections: [{ title: "Notes", content: notesText }],
      fullText: notesText
    };
  }
}

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global error handler caught:", err.message);
  res.status(500).json({ 
    error: "Internal server error", 
    message: err.message 
  });
});

// Add request timeout middleware
app.use((req, res, next) => {
  // Set a 60-second timeout for all requests
  req.setTimeout(60000, () => {
    res.status(408).json({ error: "Request timeout" });
  });
  next();
});

// Add a route for testing the Grok API connection
app.get('/test-grok', async (req, res) => {
  try {
    if (!GROK_API_KEY) {
      return res.status(500).json({ error: "Missing GROK_API_KEY in environment variables" });
    }
    
    const testResult = await callGrokAPI("Hello! Please respond with a short greeting.", {
      temperature: 0.7,
      maxTokens: 50
    });
    
    res.json({
      success: true,
      message: "Grok API connection test successful",
      response: testResult
    });
  } catch (error) {
    console.error("Grok API test failed:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to connect to Grok API",
      error: error.message,
      details: error.response?.data
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Use /test-grok endpoint to test your Grok API connection`);
});