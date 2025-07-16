const express = require('express');
const https = require('https');
const multer = require('multer');
require('dotenv').config();
const FileProcessingService = require('./services/fileProcessingService');
const RoadmapPrioritizationService = require('./services/prioritizationService');
const TextSummarizer = require('./utils/textSummarizer');

// Environment variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const port = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024; // 5MB default

if (!GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY environment variable is required');
  process.exit(1);
}

const app = express();
const fileProcessingService = new FileProcessingService();
const prioritizationService = new RoadmapPrioritizationService();
const textSummarizer = new TextSummarizer();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS middleware
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', FRONTEND_URL);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

// Multer configuration for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.'));
    }
  },
});

// File upload endpoint
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const result = await fileProcessingService.processFile(req.file);
    res.json(result);
  } catch (error) {
    console.error('File processing error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Prepare data for Gemini API
    const postData = JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const geminiReq = https.request(options, (geminiRes) => {
      let geminiBody = '';
      geminiRes.on('data', (chunk) => {
        geminiBody += chunk;
      });
      geminiRes.on('end', () => {
        try {
          const parsedResponse = JSON.parse(geminiBody);

          // Check for API errors
          if (parsedResponse.error) {
            console.error('Gemini API Error:', parsedResponse.error.message);
            return res
              .status(500)
              .json({ error: `AI Service Error: ${parsedResponse.error.message}` });
          }

          // Check for blocked responses
          if (!parsedResponse.candidates || parsedResponse.candidates.length === 0) {
            const blockReason = parsedResponse.promptFeedback?.blockReason || 'No content returned';
            console.error('Gemini Response Blocked:', blockReason);
            return res.status(500).json({ error: `AI response was blocked: ${blockReason}` });
          }

          const text = parsedResponse.candidates[0].content.parts[0].text;
          res.json({ content: text });
        } catch (e) {
          console.error('Error parsing Gemini response:', e);
          res.status(500).json({ error: 'Failed to parse AI response' });
        }
      });
    });

    geminiReq.on('error', (e) => {
      console.error('Error with Gemini request:', e);
      res.status(500).json({ error: 'Failed to communicate with AI service' });
    });

    geminiReq.write(postData);
    geminiReq.end();
  } catch (e) {
    console.error('Error processing request:', e);
    res.status(400).json({ error: 'Invalid JSON in request body' });
  }
});

// Summarization endpoint
app.post('/api/summarize', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const summarizedText = textSummarizer.summarize(text);

    res.json({
      success: true,
      originalText: text,
      summarizedText,
      isSummarized: text.length > summarizedText.length,
    });
  } catch (error) {
    console.error('Summarization error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Prioritization endpoint
app.post('/api/prioritize', async (req, res) => {
  try {
    const { roadmap, userConstraints } = req.body;

    if (!roadmap || !userConstraints) {
      return res.status(400).json({ error: 'Roadmap and user constraints are required' });
    }

    const optimizedRoadmap = await prioritizationService.prioritizeRoadmap(
      roadmap,
      userConstraints
    );

    res.json({
      success: true,
      optimizedRoadmap,
      message: 'Roadmap optimized successfully',
    });
  } catch (error) {
    console.error('Prioritization error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
