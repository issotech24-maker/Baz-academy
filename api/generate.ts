import axios from 'axios';

type ContentType = 'word' | 'verb' | 'phrase';

type GeneratedContent = {
  original: string;
  translation: string;
  example: string;
  exampleTranslation: string;
};

async function callDeepSeek(prompt: string) {
  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    const error = new Error('DeepSeek API Key is missing');
    (error as any).statusCode = 500;
    throw error;
  }

  const response = await axios.post(
    'https://api.deepseek.com/chat/completions',
    {
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful language-learning assistant for Arabic speakers. Be varied, accurate, and always return strict JSON only.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 1.3,
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    },
  );

  return response.data.choices[0].message.content;
}

function cleanJsonPayload(raw: string): string {
  return raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '').trim();
}

function isValidForType(type: ContentType, content: GeneratedContent): boolean {
  const original = content.original.trim();
  const wordCount = original.split(/\s+/).filter(Boolean).length;

  if (!original || !content.translation?.trim() || !content.example?.trim() || !content.exampleTranslation?.trim()) {
    return false;
  }

  if (type === 'phrase') {
    return wordCount >= 2;
  }

  if (type === 'verb') {
    return wordCount <= 2;
  }

  return wordCount <= 3;
}

function buildPrompt(type: ContentType, language: string, recentOriginals: string[]): string {
  const formatRules =
    type === 'phrase'
      ? 'Return a real German phrase or short sentence fragment with 2 to 6 words. Never return a single word.'
      : type === 'verb'
        ? 'Return a German verb in infinitive form. Do not return nouns or full phrases.'
        : 'Return exactly one useful German vocabulary item. If it is a noun, include the article (der/die/das). Do not return a phrase or full sentence.';

  const exclusionText =
    recentOriginals.length > 0
      ? `Do not repeat any of these recent results: ${recentOriginals.join(', ')}.`
      : 'Avoid repeating the same beginner examples.';

  return [
    `Generate one random useful ${type} in ${language} for an Arabic-speaking learner.`,
    formatRules,
    exclusionText,
    'Pick a fresh everyday topic each time, such as home, work, travel, food, study, feelings, health, shopping, or transport.',
    'Also provide: Arabic translation, one natural example sentence in German, and the Arabic translation of that example sentence.',
    'Return ONLY a JSON object with these exact keys: original, translation, example, exampleTranslation.',
  ].join(' ');
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { type = 'word', language = 'German', recentOriginals = [] } = req.body ?? {};
    const normalizedType: ContentType = ['word', 'verb', 'phrase'].includes(type) ? type : 'word';
    const recent = Array.isArray(recentOriginals)
      ? recentOriginals.filter((item) => typeof item === 'string').map((item) => item.trim()).filter(Boolean).slice(0, 12)
      : [];

    let parsed: GeneratedContent | null = null;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const result = await callDeepSeek(buildPrompt(normalizedType, language, recent));
      parsed = JSON.parse(cleanJsonPayload(result)) as GeneratedContent;

      if (isValidForType(normalizedType, parsed) && !recent.includes(parsed.original.trim())) {
        break;
      }
    }

    if (!parsed || !isValidForType(normalizedType, parsed)) {
      throw new Error('Model returned content in the wrong format. Please try again.');
    }

    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(JSON.stringify(parsed));
  } catch (error: any) {
    console.error('DeepSeek API Error:', error.response?.data || error.message);
    res.status(error.response?.status || error.statusCode || 500).json({
      error: error.response?.data?.error?.message || error.message || 'Failed to generate content from DeepSeek',
    });
  }
}
