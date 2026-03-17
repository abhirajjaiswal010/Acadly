/**
 * AI Service - OpenAI GPT Integration
 * 
 * Handles:
 * - AI Smart Notes generation from transcript
 * - AI Q&A (chat with lecture)
 * - Translation support
 */
const OpenAI = require('openai');

let openai = null;

function getOpenAI() {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

/**
 * Generate structured AI notes from a full transcript.
 * @param {string} transcript - The full lecture transcript
 * @param {string} classTitle - The title of the class
 * @returns {object} { summary, bulletPoints, keyConcepts, examHighlights, structuredNotes }
 */
async function generateSmartNotes(transcript, classTitle = 'Lecture') {
  if (!transcript || transcript.trim().length < 50) {
    return {
      summary: 'Transcript too short to generate meaningful notes.',
      bulletPoints: [],
      keyConcepts: [],
      examHighlights: [],
      structuredNotes: '',
    };
  }

  const client = getOpenAI();

  // Truncate transcript if too long (GPT context limit)
  const maxChars = 12000;
  const truncatedTranscript = transcript.length > maxChars 
    ? transcript.substring(0, maxChars) + '\n\n[... transcript truncated for processing ...]'
    : transcript;

  const prompt = `You are an expert academic note-taker. Analyze the following lecture transcript from "${classTitle}" and generate comprehensive study notes.

TRANSCRIPT:
---
${truncatedTranscript}
---

Generate the following in valid JSON format (no markdown, no code fences, just raw JSON):
{
  "summary": "A 2-3 paragraph summary of the entire lecture covering all major topics discussed",
  "bulletPoints": ["Key point 1", "Key point 2", ...],
  "keyConcepts": ["Concept 1: brief explanation", "Concept 2: brief explanation", ...],
  "examHighlights": ["Important fact/formula/date that might appear in exams", ...],
  "structuredNotes": "Full structured notes in markdown format with headers, sub-sections, and detailed explanations"
}

Make the notes detailed, accurate, and student-friendly. Include at least 5 bullet points and 3 key concepts if possible.`;

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful academic assistant that generates structured study notes from lecture transcripts. Always respond with valid JSON.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 3000,
    });

    const content = response.choices[0]?.message?.content;
    
    try {
      // Try to parse the JSON response
      const notes = JSON.parse(content);
      return {
        summary: notes.summary || '',
        bulletPoints: notes.bulletPoints || [],
        keyConcepts: notes.keyConcepts || [],
        examHighlights: notes.examHighlights || [],
        structuredNotes: notes.structuredNotes || '',
      };
    } catch (parseErr) {
      console.error('[AI] Failed to parse notes JSON:', parseErr.message);
      // Fallback: use the raw text as structured notes
      return {
        summary: content,
        bulletPoints: [],
        keyConcepts: [],
        examHighlights: [],
        structuredNotes: content,
      };
    }
  } catch (err) {
    console.error('[AI] Error generating notes:', err.message);
    throw new Error('Failed to generate AI notes: ' + err.message);
  }
}

/**
 * Answer a question using transcript as context.
 * @param {string} transcript - The lecture transcript
 * @param {string} question - User's question
 * @param {array} history - Previous Q&A history [{ question, answer }]
 * @returns {string} The AI answer
 */
async function askAI(transcript, question, history = []) {
  if (!transcript || !question) {
    throw new Error('Transcript and question are required');
  }

  const client = getOpenAI();

  const maxChars = 10000;
  const truncatedTranscript = transcript.length > maxChars
    ? transcript.substring(0, maxChars) + '\n[... truncated ...]'
    : transcript;

  const messages = [
    {
      role: 'system',
      content: `You are a helpful teaching assistant. Answer the student's question based ONLY on the lecture transcript provided below. If the answer is not found in the transcript, say so clearly but try to provide relevant context from what was discussed.

LECTURE TRANSCRIPT:
---
${truncatedTranscript}
---

Be concise, accurate, and student-friendly. Use examples from the lecture when possible.`,
    },
  ];

  // Add conversation history
  for (const qa of history.slice(-5)) {
    messages.push({ role: 'user', content: qa.question });
    messages.push({ role: 'assistant', content: qa.answer });
  }

  messages.push({ role: 'user', content: question });

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
      temperature: 0.4,
      max_tokens: 1000,
    });

    return response.choices[0]?.message?.content || 'Sorry, I could not generate an answer.';
  } catch (err) {
    console.error('[AI] Error in Q&A:', err.message);
    throw new Error('Failed to get AI answer: ' + err.message);
  }
}

/**
 * Translate text using OpenAI.
 * @param {string} text - Text to translate
 * @param {string} targetLang - Target language name (e.g., 'Hindi', 'Spanish')
 * @returns {string} Translated text
 */
async function translateText(text, targetLang) {
  if (!text || !targetLang) {
    throw new Error('Text and target language are required');
  }

  const client = getOpenAI();

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are a professional translator. Translate the following text to ${targetLang}. Only output the translation, nothing else.`,
        },
        { role: 'user', content: text },
      ],
      temperature: 0.2,
      max_tokens: 2000,
    });

    return response.choices[0]?.message?.content || text;
  } catch (err) {
    console.error('[AI] Translation error:', err.message);
    throw new Error('Translation failed: ' + err.message);
  }
}

module.exports = {
  generateSmartNotes,
  askAI,
  translateText,
};
