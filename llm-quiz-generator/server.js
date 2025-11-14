require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { generateQuizContent } = require('./services/llmService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Main generation endpoint
app.post('/api/generate', async (req, res) => {
    try {
        const { topic, models, numDistractors = 3 } = req.body;

        // Validation
        if (!topic || typeof topic !== 'string') {
            return res.status(400).json({ error: 'Topic is required and must be a string' });
        }

        if (!models || !Array.isArray(models) || models.length === 0) {
            return res.status(400).json({ error: 'At least one model must be selected' });
        }

        if (numDistractors < 2 || numDistractors > 10) {
            return res.status(400).json({ error: 'Number of distractors must be between 2 and 10' });
        }

        console.log(`Generating quiz content for topic: "${topic}" with ${models.length} model(s)`);

        // Generate content from all selected models in parallel
        const results = await Promise.all(
            models.map(async ({ model, provider }) => {
                const startTime = Date.now();
                try {
                    const content = await generateQuizContent(topic, model, provider, numDistractors);
                    const generationTime = Date.now() - startTime;

                    return {
                        model,
                        provider,
                        correctAnswer: content.correctAnswer,
                        distractors: content.distractors,
                        generationTime
                    };
                } catch (error) {
                    console.error(`Error generating content for ${model}:`, error.message);
                    return {
                        model,
                        provider,
                        error: error.message,
                        generationTime: Date.now() - startTime
                    };
                }
            })
        );

        res.json({
            topic,
            results,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Generation error:', error);
        res.status(500).json({
            error: 'Failed to generate quiz content',
            details: error.message
        });
    }
});

// API key status endpoint
app.get('/api/keys-status', (req, res) => {
    res.json({
        openai: !!process.env.OPENAI_API_KEY,
        anthropic: !!process.env.ANTHROPIC_API_KEY,
        google: !!process.env.GOOGLE_API_KEY
    });
});

// Serve index.html for root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 LLM Quiz Generator Server Running`);
    console.log(`📍 Server: http://localhost:${PORT}`);
    console.log(`🔧 API: http://localhost:${PORT}/api`);
    console.log(`\n🔑 API Keys Status:`);
    console.log(`   OpenAI: ${process.env.OPENAI_API_KEY ? '✓' : '✗'}`);
    console.log(`   Anthropic: ${process.env.ANTHROPIC_API_KEY ? '✓' : '✗'}`);
    console.log(`   Google: ${process.env.GOOGLE_API_KEY ? '✓' : '✗'}`);
    console.log(`\n💡 Tip: Add your API keys to .env file\n`);
});

module.exports = app;
