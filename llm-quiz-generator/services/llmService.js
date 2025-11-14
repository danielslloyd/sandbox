const axios = require('axios');
const { buildPrompt } = require('./prompts');

/**
 * Main function to generate quiz content from any LLM provider
 */
async function generateQuizContent(topic, model, provider, numDistractors) {
    const prompt = buildPrompt(topic, numDistractors);

    switch (provider) {
        case 'openai':
            return await generateFromOpenAI(model, prompt);
        case 'anthropic':
            return await generateFromAnthropic(model, prompt);
        case 'google':
            return await generateFromGoogle(model, prompt);
        default:
            throw new Error(`Unsupported provider: ${provider}`);
    }
}

/**
 * OpenAI API integration
 */
async function generateFromOpenAI(model, prompt) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error('OpenAI API key not configured');
    }

    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful assistant that generates educational quiz content. Always respond with valid JSON.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 1000
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const content = response.data.choices[0].message.content;
        return parseResponse(content);
    } catch (error) {
        throw new Error(`OpenAI API error: ${error.response?.data?.error?.message || error.message}`);
    }
}

/**
 * Anthropic (Claude) API integration
 */
async function generateFromAnthropic(model, prompt) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        throw new Error('Anthropic API key not configured');
    }

    try {
        const response = await axios.post(
            'https://api.anthropic.com/v1/messages',
            {
                model: model,
                max_tokens: 1024,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7
            },
            {
                headers: {
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01',
                    'Content-Type': 'application/json'
                }
            }
        );

        const content = response.data.content[0].text;
        return parseResponse(content);
    } catch (error) {
        throw new Error(`Anthropic API error: ${error.response?.data?.error?.message || error.message}`);
    }
}

/**
 * Google (Gemini) API integration
 */
async function generateFromGoogle(model, prompt) {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        throw new Error('Google API key not configured');
    }

    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
                contents: [
                    {
                        parts: [
                            {
                                text: prompt
                            }
                        ]
                    }
                ],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1000
                }
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        const content = response.data.candidates[0].content.parts[0].text;
        return parseResponse(content);
    } catch (error) {
        throw new Error(`Google API error: ${error.response?.data?.error?.message || error.message}`);
    }
}

/**
 * Parse LLM response and extract correct answer and distractors
 */
function parseResponse(content) {
    try {
        // Try to extract JSON from markdown code blocks if present
        let jsonStr = content;
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
            jsonStr = jsonMatch[1];
        }

        // Parse the JSON
        const parsed = JSON.parse(jsonStr);

        // Validate structure
        if (!parsed.correctAnswer || !Array.isArray(parsed.distractors)) {
            throw new Error('Invalid response structure');
        }

        return {
            correctAnswer: parsed.correctAnswer.trim(),
            distractors: parsed.distractors.map(d => d.trim())
        };
    } catch (error) {
        // Fallback: try to extract information from unstructured text
        console.warn('Failed to parse JSON response, attempting fallback extraction:', error.message);

        const lines = content.split('\n').filter(line => line.trim());
        const correctAnswer = lines.find(line =>
            line.toLowerCase().includes('correct') || line.toLowerCase().includes('answer')
        );
        const distractors = lines.filter(line =>
            (line.match(/^\d+\./) || line.match(/^-/)) && !line.toLowerCase().includes('correct')
        ).map(line => line.replace(/^\d+\.\s*/, '').replace(/^-\s*/, '').trim());

        if (correctAnswer && distractors.length > 0) {
            return {
                correctAnswer: correctAnswer.replace(/^(correct answer:?|answer:?)\s*/i, '').trim(),
                distractors: distractors
            };
        }

        throw new Error('Could not parse response from LLM');
    }
}

module.exports = {
    generateQuizContent
};
