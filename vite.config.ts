import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import {defineConfig, loadEnv} from 'vite';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(), 
      tailwindcss(),
      {
        name: 'deepseek-api-proxy',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url === '/api/health') {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ 
                status: "ok", 
                deepseek: !!env.DEEPSEEK_API_KEY,
                }));
              return;
            }
            if (req.url === '/api/generate' && req.method === 'POST') {
              let body = '';
              req.on('data', chunk => { body += chunk; });
              req.on('end', async () => {
                try {
                  const { type, language } = JSON.parse(body);
                  const DEEPSEEK_API_KEY = env.DEEPSEEK_API_KEY;
                  if (!DEEPSEEK_API_KEY) {
                    res.statusCode = 500;
                    res.end(JSON.stringify({ error: "DeepSeek API Key is missing" }));
                    return;
                  }
                  const prompt = `Generate a random useful ${type} in ${language} with its Arabic translation, an example sentence in ${language}, and the translation of that example sentence. If it's a noun, include the article (der/die/das). Return ONLY a JSON object with the following keys: original, translation, example, exampleTranslation.`;
                  const response = await axios.post("https://api.deepseek.com/chat/completions", {
                    model: "deepseek-chat",
                    messages: [
                      { role: "system", content: "You are a helpful language learning assistant. Always return JSON." },
                      { role: "user", content: prompt }
                    ],
                    response_format: { type: 'json_object' }
                  }, {
                    headers: {
                      "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
                      "Content-Type": "application/json"
                    },
                    timeout: 30000
                  });
                  res.setHeader('Content-Type', 'application/json');
                  res.end(response.data.choices[0].message.content);
                } catch (error: any) {
                  console.error("DeepSeek API Error:", error.response?.data || error.message);
                  res.statusCode = error.response?.status || 500;
                  const errorMessage = error.response?.data?.error?.message || error.message || "Failed to generate content from DeepSeek";
                  res.end(JSON.stringify({ error: errorMessage }));
                }
              });
            } else if (req.url === '/api/complete' && req.method === 'POST') {
              let body = '';
              req.on('data', chunk => { body += chunk; });
              req.on('end', async () => {
                try {
                  const { original, language } = JSON.parse(body);
                  const DEEPSEEK_API_KEY = env.DEEPSEEK_API_KEY;
                  if (!DEEPSEEK_API_KEY) {
                    res.statusCode = 500;
                    res.end(JSON.stringify({ error: "DeepSeek API Key is missing" }));
                    return;
                  }
                  const prompt = `Complete the details for the following ${language} word/phrase: "${original}". Provide its Arabic translation, an example sentence in ${language}, and the translation of that example sentence. If it's a noun, ensure the original includes the article (der/die/das). Return ONLY a JSON object with the following keys: original, translation, example, exampleTranslation.`;
                  const response = await axios.post("https://api.deepseek.com/chat/completions", {
                    model: "deepseek-chat",
                    messages: [
                      { role: "system", content: "You are a helpful language learning assistant. Always return JSON." },
                      { role: "user", content: prompt }
                    ],
                    response_format: { type: 'json_object' }
                  }, {
                    headers: {
                      "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
                      "Content-Type": "application/json"
                    },
                    timeout: 30000
                  });
                  res.setHeader('Content-Type', 'application/json');
                  res.end(response.data.choices[0].message.content);
                } catch (error: any) {
                  console.error("DeepSeek API Error (Complete):", error.response?.data || error.message);
                  res.statusCode = error.response?.status || 500;
                  const errorMessage = error.response?.data?.error?.message || error.message || "Failed to complete content from DeepSeek";
                  res.end(JSON.stringify({ error: errorMessage }));
                }
              });
            } else {
              next();
            }
          });
        }
      }
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});

