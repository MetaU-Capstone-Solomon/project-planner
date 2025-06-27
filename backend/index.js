const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 3001;

// Load environment variables from .env file
let GEMINI_API_KEY;
try {
  const envPath = path.resolve(__dirname, '.env');
  const envFileContent = fs.readFileSync(envPath, { encoding: 'utf8' });
  const envVars = envFileContent.split('\n').reduce((acc, line) => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      acc[key.trim()] = valueParts.join('=').trim();
    }
    return acc;
  }, {});
  GEMINI_API_KEY = envVars.GEMINI_API_KEY;
} catch (error) {
  console.warn('Could not read .env file. Using system environment variables.');
  GEMINI_API_KEY = process.env.GEMINI_API_KEY;
}

const server = http.createServer((req, res) => {
  // Set CORS headers for frontend communication
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle pre-flight CORS requests
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Process POST requests to /api/chat
  if (req.url === '/api/chat' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const { prompt } = JSON.parse(body);
        if (!prompt) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Prompt is required' }));
          return;
        }

        // Prepare data for Gemini API
        const postData = JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
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
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: `AI Service Error: ${parsedResponse.error.message}` }));
                return;
              }

              // Check for blocked responses
              if (!parsedResponse.candidates || parsedResponse.candidates.length === 0) {
                const blockReason = parsedResponse.promptFeedback?.blockReason || 'No content returned';
                console.error('Gemini Response Blocked:', blockReason);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: `AI response was blocked: ${blockReason}` }));
                return;
              }

              const text = parsedResponse.candidates[0].content.parts[0].text;
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ content: text }));

            } catch (e) {
              console.error('Error parsing Gemini response:', e);
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Failed to parse AI response' }));
            }
          });
        });

        geminiReq.on('error', (e) => {
          console.error('Error with Gemini request:', e);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to communicate with AI service' }));
        });

        geminiReq.write(postData);
        geminiReq.end();

      } catch (e) {
        console.error('Error processing request:', e);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON in request body' }));
      }
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));
  }
});

server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  if (!GEMINI_API_KEY) {
    console.warn('Warning: GEMINI_API_KEY not set. AI service will not work.');
  }
});
