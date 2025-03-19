require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());

app.post('/generate-mcq', async (req, res) => {
    const { topic, numQuestions } = req.body;
    
    if (!topic || !numQuestions) {
        return res.status(400).json({ error: "Missing topic or numQuestions" });
    }
    
    if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "Missing GEMINI_API_KEY in environment variables" });
    }
    
    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent`,
            {
                contents: [
                    {
                        parts: [
                            {
                                text: `Generate ${numQuestions} multiple-choice questions on the topic: ${topic}.

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

Explanation: In JavaScript, when you add a number and a string, the number is converted to a string and then concatenation occurs.`
                            }
                        ]
                    }
                ]
            },
            {
                params: { key: process.env.GEMINI_API_KEY },
                headers: { "Content-Type": "application/json" }
            }
        );
        
        // Extract text from response
        const mcqText = response.data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        
        if (!mcqText) {
            console.error("MCQ text is empty or undefined!");
            return res.status(500).json({ error: "Empty MCQ response from Gemini API" });
        }
        
        // Convert formatted text into structured JSON
        const mcqArray = parseMcqText(mcqText);
        
        res.json({ questions: mcqArray });
    } catch (error) {
        console.error("Error fetching MCQs:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to generate MCQs" });
    }
});

function parseMcqText(mcqText) {
    if (!mcqText) {
        console.error("Empty MCQ text received.");
        return [];
    }

    const questions = [];
    
    // Split by question number pattern, handling different formats
    const questionRegex = /(?:^|\n)(?:\d+\.|Question\s+\d+:)/i;
    const questionBlocks = mcqText.split(questionRegex).filter(block => block.trim().length > 0);

    for (let block of questionBlocks) {
        try {
            // Extract code snippets properly
            const codeSnippets = [];
            const codeRegex = /```(?:(\w+)\n)?([\s\S]*?)```/g;
            let codeMatch;
            let cleanedBlock = block;
            
            while ((codeMatch = codeRegex.exec(block)) !== null) {
                const language = codeMatch[1] || ""; // Language specifier if available
                const code = codeMatch[2].trim();    // The actual code
                codeSnippets.push({
                    language,
                    code
                });
                
                // Replace with a unique placeholder that includes the index
                cleanedBlock = cleanedBlock.replace(codeMatch[0], `[CODE_PLACEHOLDER_${codeSnippets.length - 1}]`);
            }
            
            // Process the block without code snippets to avoid parsing issues
            const lines = cleanedBlock.split('\n').map(line => line.trim()).filter(line => line.length > 0);
            
            if (lines.length < 5) {
                console.warn("Not enough lines for a complete question:", lines);
                continue;
            }

            // Extract question text (which may contain placeholders)   
            const questionLines = [];
            let lineIndex = 0;
            
            // Read question text until we hit the first option
            while (lineIndex < lines.length && !lines[lineIndex].match(/^[a-d]\)/)) {
                questionLines.push(lines[lineIndex]);
                lineIndex++;
            }
            
            let questionText = questionLines.join('\n');
            
            // Extract answer choices
            const choices = [];
            while (lineIndex < lines.length && choices.length < 4) {
                const line = lines[lineIndex];
                if (line.match(/^[a-d]\)/)) {
                    choices.push(line);
                }
                lineIndex++;
            }
            
            if (choices.length !== 4) {
                console.warn("Did not find exactly 4 options:", choices);
                continue;
            }

            // Find correct answer
            let correctAnswer = null;
            for (let line of lines) {
                const match = line.match(/Correct Answer:\s*([a-d])\)/i);
                if (match) {
                    correctAnswer = match[1];
                    break;
                }
            }

            // Extract explanation if available
            let explanation = "";
            const explanationIndex = lines.findIndex(line =>
                line.toLowerCase().includes("explanation") || 
                line.toLowerCase().includes("reason") ||
                line.toLowerCase().includes("because")
            );
            
            if (explanationIndex > -1) {
                explanation = lines.slice(explanationIndex).join(' ');
            }

            // Replace code placeholders in the question text
            for (let i = 0; i < codeSnippets.length; i++) {
                const placeholder = `[CODE_PLACEHOLDER_${i}]`;
                const snippet = codeSnippets[i];
                const formattedCode = snippet.language ? 
                    `\n\n\`\`\`${snippet.language}\n${snippet.code}\n\`\`\`\n` : 
                    `\n\n\`\`\`\n${snippet.code}\n\`\`\`\n`;
                
                questionText = questionText.replace(placeholder, formattedCode);
            }

            if (correctAnswer) {
                questions.push({
                    question: questionText.trim(),
                    codeSnippets: codeSnippets,
                    choices: choices,
                    correctAnswer: correctAnswer,
                    explanation: explanation.trim(),
                    category: "Fundamentals",
                    difficulty: "medium" // You can modify this based on criteria or let the LLM estimate
                });
            } else {
                console.warn("No correct answer found for:", questionText);
            }
        } catch (error) {
            console.error("Error parsing question block:", error);
        }
    }
    
    return questions;
}

app.post('/generate-written', async (req, res) => {
    const { topic, numQuestions, difficulty, categories } = req.body;
    
    if (!topic || !numQuestions) {
        return res.status(400).json({ error: "Missing topic or numQuestions" });
    }
    
    if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "Missing GEMINI_API_KEY in environment variables" });
    }
    
    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent`,
            {
                contents: [
                    {
                        parts: [
                            {
                                text: `Generate ${numQuestions} open-ended written questions on the topic: ${topic}.
                                
Topic details: ${topic}
Difficulty level: ${difficulty || 'medium'}
Question categories: ${categories || 'Fundamentals'}

For each question:
1. Create a thoughtful, open-ended question that requires explanation and analysis
2. Focus on the specified categories: ${categories || 'Fundamentals'}
3. Make the questions appropriate for ${difficulty || 'medium'} difficulty level
4. Include any necessary code snippets, formulas, or context needed to answer the question
5. For code questions, format code using proper markdown code blocks with language specification
6. Each question should be numbered and separated by a blank line
7.Dont Give any Code Snippts even if requested.

Example format:
1. Explain the concept of closure in JavaScript and provide an example of how it can be used to create private variables. How does this pattern help with encapsulation in application development?

2. Compare and contrast REST and GraphQL APIs. What are the advantages and disadvantages of each approach, and in what scenarios would you choose one over the other?`
                            }
                        ]
                    }
                ]
            },
            {
                params: { key: process.env.GEMINI_API_KEY },
                headers: { "Content-Type": "application/json" }
            }
        );
        
        // Extract text from response
        const questionsText = response.data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        
        if (!questionsText) {
            console.error("Questions text is empty or undefined!");
            return res.status(500).json({ error: "Empty response from Gemini API" });
        }
        
        // Convert formatted text into structured JSON
        const questionsArray = parseWrittenQuestions(questionsText, categories || 'Fundamentals', difficulty || 'medium');
        
        res.json({ questions: questionsArray });
    } catch (error) {
        console.error("Error fetching written questions:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to generate questions" });
    }
});

function parseWrittenQuestions(questionsText, categoriesStr, difficulty) {
    if (!questionsText) {
        console.error("Empty questions text received.");
        return [];
    }
    
    const questions = [];
    const categories = categoriesStr ? categoriesStr.split(',') : ["Fundamentals"];
        
    // Split by question number pattern
    const questionRegex = /(?:^|\n)(?:\d+\.|\d+\))/;
    const questionBlocks = questionsText.split(questionRegex).filter(block => block.trim().length > 0);
    
    for (let i = 0; i < questionBlocks.length; i++) {
        try {
            const block = questionBlocks[i].trim();
            if (!block) continue;
                        
            // Extract code snippets properly
            const codeSnippets = [];
            const codeRegex = /```(?:(\w+)\n)?([\s\S]*?)```/g;
            let codeMatch;
            let questionText = block;
                        
            while ((codeMatch = codeRegex.exec(block)) !== null) {
                const language = codeMatch[1] || ""; // Language specifier if available
                const code = codeMatch[2].trim();    // The actual code
                codeSnippets.push({
                    language,
                    code
                });
            }
                        
            // Assign a category - rotate through available categories or use default
            const categoryIndex = i % categories.length;
            const category = categories[categoryIndex] || "Fundamentals";
            
            // Remove code blocks from question text
            questionText = questionText.replace(/```(?:\w+\n)?[\s\S]*?```/g, '').trim();
            
            // Push the question object to the questions array
            questions.push({
                question: questionText,
                codeSnippets: codeSnippets,
                category: category,
                difficulty: difficulty || "medium"
            });
        } catch (error) {
            console.error("Error parsing question block:", error);
        }
    }
        
    return questions;
}
// Add this new endpoint to your server.js file

app.post("/evaluate-answers", async (req, res) => {
    const { questions, answers, topic, difficulty } = req.body;
    
    // Input validation
    if (!questions || !answers || questions.length !== answers.length) {
        return res.status(400).json({ error: "Invalid request data" });
    }
    
    if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "Missing GEMINI_API_KEY in environment variables" });
    }
    
    try {
        const evaluationPromises = questions.map(async (question, index) => {
            const answer = answers[index].trim();
            
            if (!answer) {
                return { 
                    score: 0, 
                    comments: "No answer provided.", 
                    suggestions: ["Please provide an answer."] 
                };
            }
            
            try {
                // Improved prompt with clear instructions for consistent JSON output
                const promptText = `You are an expert evaluator for ${topic} questions. 
Your task is to evaluate a student answer to a ${difficulty} difficulty question.

QUESTION: ${question}
STUDENT ANSWER: ${answer}

Evaluate the answer thoroughly on accuracy, completeness, and clarity.
If The Answer is Correct or atleast related to question give Good Score else give Bad Score.

RESPOND STRICTLY IN THE FOLLOWING JSON FORMAT WITHOUT ANY ADDITIONAL TEXT:
{
  "score": [0-100 integer],
  "comments": "Detailed feedback on the answer's strengths and weaknesses",
  "suggestions": ["specific suggestion 1", "specific suggestion 2", "specific suggestion 3"]
}`;

                const response = await axios.post(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent`,
                    {
                        contents: [
                            {
                                parts: [
                                    {
                                        text: promptText
                                    }
                                ]
                            }
                        ],
                        // Adding generation parameters for more controlled output
                        generationConfig: {
                            temperature: 0.2,
                            topP: 0.95,
                            maxOutputTokens: 1024
                        }
                    },
                    {
                        params: { key: process.env.GEMINI_API_KEY },
                        headers: { "Content-Type": "application/json" }
                    }
                );
                
                const responseText = response?.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
                
                // Log the raw response for debugging
                console.log(`Evaluation for question ${index + 1}:`, responseText);
                
                if (!responseText) {
                    throw new Error("Empty response from Gemini API");
                }
                
                // Improved JSON parsing with sanitization
                try {
                    // Remove any potential text before or after the JSON
                    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                    
                    if (!jsonMatch) {
                        throw new Error("No valid JSON found in response");
                    }
                    
                    const jsonString = jsonMatch[0];
                    const parsedResponse = JSON.parse(jsonString);
                    
                    // Validate the required fields
                    if (typeof parsedResponse.score !== 'number' || 
                        typeof parsedResponse.comments !== 'string' || 
                        !Array.isArray(parsedResponse.suggestions)) {
                        throw new Error("Invalid format in parsed JSON");
                    }
                    
                    // Ensure score is within valid range
                    parsedResponse.score = Math.min(100, Math.max(0, Math.round(parsedResponse.score)));
                    
                    return parsedResponse;
                } catch (parseError) {
                    console.error("Error parsing JSON:", parseError, "Response:", responseText);
                    
                    // Create a better fallback response
                    return {
                        score: 50,
                        comments: "Unable to properly evaluate the answer due to processing issues.",
                        suggestions: [
                            "Try rephrasing your answer for clarity.",
                            "Ensure you've addressed all parts of the question.",
                            "Consider resubmitting your answer."
                        ]
                    };
                }
            } catch (apiError) {
                console.error("API error for question", index + 1, ":", apiError.message);
                
                // Implement retry logic for API errors
                try {
                    // Wait a moment before retrying
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    // Use a simpler prompt for retry
                    const retryResponse = await axios.post(
                        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent`,
                        {
                            contents: [
                                {
                                    parts: [
                                        {
                                            text: `Evaluate this ${topic} answer (${difficulty} level). Question: "${question}" Answer: "${answer}" Return only JSON: {"score": [0-100], "comments": "feedback", "suggestions": ["suggestion1", "suggestion2"]}`
                                        }
                                    ]
                                }
                            ],
                            generationConfig: {
                                temperature: 0.1,
                                maxOutputTokens: 512
                            }
                        },
                        {
                            params: { key: process.env.GEMINI_API_KEY },
                            headers: { "Content-Type": "application/json" }
                        }
                    );
                    
                    const retryText = retryResponse?.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
                    
                    if (retryText && retryText.includes("{") && retryText.includes("}")) {
                        const jsonMatch = retryText.match(/\{[\s\S]*\}/);
                        if (jsonMatch) {
                            return JSON.parse(jsonMatch[0]);
                        }
                    }
                    
                    throw new Error("Retry failed");
                } catch (retryError) {
                    console.error("Retry also failed:", retryError.message);
                    return {
                        score: 50,
                        comments: "Our evaluation system is currently experiencing difficulties. Your answer has been recorded.",
                        suggestions: ["Please check back later for a complete evaluation."]
                    };
                }
            }
        });
        
        const feedbackArray = await Promise.all(evaluationPromises);
        
        // Calculate overall score more accurately
        const validScores = feedbackArray.filter(item => typeof item.score === 'number' && !isNaN(item.score));
        const totalScore = validScores.reduce((sum, item) => sum + item.score, 0);
        const overallPercentage = validScores.length ? Math.round(totalScore / validScores.length) : 50;
        
        // Add additional metrics
        const responseData = {
            feedback: feedbackArray,
            overallScore: overallPercentage,
            metrics: {
                questionsEvaluated: validScores.length,
                highestScore: Math.max(...validScores.map(item => item.score)),
                lowestScore: Math.min(...validScores.map(item => item.score)),
                evaluationTimestamp: new Date().toISOString()
            }
        };
        
        res.json(responseData);
    } catch (error) {
        console.error("Evaluation failed:", error);
        res.status(500).json({ 
            error: "Internal server error during evaluation process.",
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});
/**
 * Roadmap Generator API Endpoint
 * Uses Google's Gemini API to generate structured roadmaps
 */
app.post('/generate-roadmap', async (req, res) => {
    const { topic, timeframe, level } = req.body;

    if (!topic || !timeframe) {
        return res.status(400).json({ 
            success: false,
            message: "Both 'topic' and 'timeframe' are required" 
        });
    }

    try {
        // Make a request to the Gemini API
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent`,
            {
                contents: [
                    {
                        parts: [
                            {
                                text: `Generate a learning roadmap for the topic: ${topic} with a timeframe of ${timeframe} ${level ? `for ${level} level learners` : ''}.`
                            }
                        ]
                    }
                ]
            },
            {
                params: { key: process.env.GEMINI_API_KEY },
                headers: { "Content-Type": "application/json" }
            }
        );

        const roadmapText = response.data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        
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
        res.status(500).json({ 
            success: false,
            message: "Error occurred while generating the roadmap",
            error: error.message
        });
    }
});

// Start the server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
