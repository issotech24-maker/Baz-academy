import axios from 'axios';

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
        { role: 'system', content: 'You are a helpful language learning assistant. Always return JSON.' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
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

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { original, language = 'German' } = req.body ?? {};
    const prompt = `Complete the details for the following ${language} word/phrase: "${original}". Provide its Arabic translation, an example sentence in ${language}, and the translation of that example sentence. If it's a noun, ensure the original includes the article (der/die/das). Return ONLY a JSON object with the following keys: original, translation, example, exampleTranslation.`;
    const result = await callDeepSeek(prompt);
    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(result);
  } catch (error: any) {
    console.error('DeepSeek API Error (Complete):', error.response?.data || error.message);
    res.status(error.response?.status || error.statusCode || 500).json({
      error: error.response?.data?.error?.message || error.message || 'Failed to complete content from DeepSeek',
    });
  }
}
