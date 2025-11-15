/**
 * Prompt engineering for quiz content generation
 *
 * This module contains carefully crafted prompts to get the best results
 * from various LLM providers for educational quiz content generation.
 */

/**
 * Build the main prompt for quiz generation
 */
function buildPrompt(topic, numDistractors) {
    return `You are an expert educator creating quiz content for history education.

Topic: "${topic}"

Your task is to generate:
1. A correct, factual answer about this historical person or event
2. ${numDistractors} plausible but incorrect "distractor" answers for a multiple-choice quiz

REQUIREMENTS FOR THE CORRECT ANSWER:
- Write a concise paragraph (2-4 sentences) that captures the essential facts
- Focus on the most historically significant aspects
- Be accurate and verifiable
- Use clear, accessible language suitable for high school or college students
- If it's a person: include their key accomplishments, time period, and historical significance
- If it's an event: include when it occurred, key participants, causes, and consequences

REQUIREMENTS FOR DISTRACTORS (wrong answers):
- Each distractor must be plausible and could sound correct to someone with partial knowledge
- Base distractors on common misconceptions or confusion with similar historical figures/events
- Maintain similar length and detail level as the correct answer
- DO NOT make them obviously wrong or silly
- Mix different types of errors:
  * Confuse with a different but related person/event
  * Use facts from the wrong time period
  * Attribute achievements to the wrong person
  * Mix correct details with one crucial wrong fact
- Each distractor should be distinct and test different aspects of knowledge

OUTPUT FORMAT:
Respond ONLY with valid JSON in this exact format (no additional text):

{
  "correctAnswer": "Your factual paragraph here",
  "distractors": [
    "First plausible wrong answer",
    "Second plausible wrong answer",
    "Third plausible wrong answer"
  ]
}

Remember: The goal is to create an educational quiz that tests genuine understanding, not just trivia recall. Make distractors challenging but fair.`;
}

/**
 * Alternative prompt templates for different subjects (extensible)
 */
const promptTemplates = {
    history: buildPrompt,

    // Future expansion: other subjects
    science: (topic, numDistractors) => {
        return `You are creating quiz content for science education.

Topic: "${topic}"

Generate a correct scientific explanation and ${numDistractors} plausible but incorrect alternatives.
Focus on conceptual understanding, not just memorization.

[Similar structure to history prompt...]`;
    },

    literature: (topic, numDistractors) => {
        return `You are creating quiz content for literature education.

Topic: "${topic}"

Generate an accurate analysis and ${numDistractors} plausible but incorrect interpretations.
Focus on themes, context, and literary significance.

[Similar structure to history prompt...]`;
    }
};

/**
 * Prompt optimization tips and best practices
 */
const promptingBestPractices = {
    tips: [
        'Be specific about desired output format (JSON in this case)',
        'Provide clear criteria for both correct and incorrect answers',
        'Use examples when possible to guide the model',
        'Set the context with role-playing (e.g., "You are an expert educator")',
        'Specify the target audience level',
        'Request structured, parseable output',
        'Include quality criteria (plausibility, distinctness, etc.)'
    ],

    commonPitfalls: [
        'Too vague instructions leading to inconsistent output',
        'Not specifying output format clearly',
        'Forgetting to request educational value',
        'Not guiding the difficulty level of distractors',
        'Allowing trivial or obvious wrong answers'
    ],

    providerSpecific: {
        openai: {
            notes: 'GPT models are good at following structured prompts. Use system message for role-setting.',
            tips: ['Use temperature 0.7-0.9 for creative distractors', 'GPT-4 better at nuanced historical accuracy']
        },
        anthropic: {
            notes: 'Claude excels at nuanced, educational content. Strong at avoiding obvious errors.',
            tips: ['Claude follows JSON formatting instructions well', 'Good at maintaining consistency']
        },
        google: {
            notes: 'Gemini is strong at factual accuracy and can access recent information.',
            tips: ['Explicit format instructions are important', 'Good at creative plausible alternatives']
        }
    }
};

/**
 * Validation prompt for checking generated content quality
 */
function buildValidationPrompt(topic, correctAnswer, distractors) {
    return `Review this quiz content for educational quality:

Topic: "${topic}"

Correct Answer: "${correctAnswer}"

Wrong Answers:
${distractors.map((d, i) => `${i + 1}. ${d}`).join('\n')}

Evaluate:
1. Is the correct answer factually accurate and complete?
2. Are the distractors plausible but definitively wrong?
3. Do the distractors test different aspects of knowledge?
4. Is this quiz content educationally valuable?

Respond with a quality score (1-10) and brief feedback.`;
}

module.exports = {
    buildPrompt,
    promptTemplates,
    promptingBestPractices,
    buildValidationPrompt
};
