import { GoogleGenAI } from '@google/genai';
import axios from 'axios';
import { logger } from '../utils/logger';

function humanizeAIError(raw: string): string {
  try {
    const outer = JSON.parse(raw);
    const innerStr = outer?.error?.message ?? raw;
    try {
      const inner = JSON.parse(innerStr);
      const msg: string = inner?.error?.message ?? innerStr;
      if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota')) {
        return 'API quota exceeded. Please generate a new Gemini API key at https://aistudio.google.com/apikey and update GEMINI_API_KEY in backend/.env';
      }
      if (msg.includes('UNAUTHENTICATED') || msg.includes('invalid authentication') || msg.includes('API_KEY_INVALID')) {
        return 'Invalid or expired API key. Please generate a new key at https://aistudio.google.com/apikey and update GEMINI_API_KEY in backend/.env';
      }
      return msg.split('\n')[0];
    } catch {
      return innerStr.split('\n')[0];
    }
  } catch {
    if (raw.includes('quota') || raw.includes('RESOURCE_EXHAUSTED')) {
      return 'API quota exceeded. Please generate a new Gemini API key at https://aistudio.google.com/apikey';
    }
    if (raw.includes('UNAUTHENTICATED') || raw.includes('invalid authentication')) {
      return 'Invalid or expired API key. Please update GEMINI_API_KEY in backend/.env';
    }
    if (raw === 'AggregateError' || raw.includes('ECONNREFUSED') || raw.includes('connect ECONNREFUSED')) {
      return 'Could not connect to the AI provider. If using Ollama, make sure it is installed and running. If using Gemini, check your API key.';
    }
    return raw.split('\n')[0];
  }
}

export class AIService {
  private getOpenAICompatibleClient(provider: string) {
    const key = this.getApiKey(provider);
    if (!key) {
      throw new Error(`API key for provider ${provider} is not configured.`);
    }
    if (provider === 'groq') {
      const { default: OpenAI } = require('openai');
      return new OpenAI({ apiKey: key, baseURL: 'https://api.groq.com/openai/v1' });
    } else if (provider === 'openrouter') {
      const { default: OpenAI } = require('openai');
      return new OpenAI({
        apiKey: key,
        baseURL: 'https://openrouter.ai/api/v1',
        defaultHeaders: {
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'CodeCoach AI',
        },
      });
    }
    throw new Error(`Unsupported provider: ${provider}`);
  }

  private getApiKey(provider: string): string | undefined {
    switch (provider) {
      case 'gemini':
        return process.env.GEMINI_API_KEY;
      case 'groq':
        return process.env.GROQ_API_KEY;
      case 'openrouter':
        return process.env.OPENROUTER_API_KEY;
      default:
        return undefined;
    }
  }

  async chat(
    provider: string,
    model: string,
    messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
    temperature: number = 0.7,
    maxTokens: number = 2048
  ): Promise<string> {
    try {
      if (provider === 'groq' || provider === 'openrouter') {
        const client = this.getOpenAICompatibleClient(provider);
        const response = await client.chat.completions.create({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
        });
        return response.choices[0]?.message?.content || '';
      }

      if (provider === 'gemini') {
        const key = this.getApiKey('gemini');
        if (!key) throw new Error('Gemini API key is not configured.');

        const genai = new GoogleGenAI({ apiKey: key });
        const systemMessage = messages.find((m) => m.role === 'system')?.content;

        const contents = messages
          .filter((m) => m.role !== 'system')
          .map((m) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
          }));

        try {
          const response = await genai.models.generateContent({
            model,
            contents,
            config: {
              temperature,
              maxOutputTokens: maxTokens,
              systemInstruction: systemMessage,
            },
          });

          return response.text || '';
        } catch (geminiErr: any) {
          throw new Error(humanizeAIError(geminiErr.message));
        }
      }

      if (provider === 'ollama') {
        const ollamaUrl = process.env.OLLAMA_API_URL || 'http://localhost:11434';
        const response = await axios.post(`${ollamaUrl}/api/chat`, {
          model,
          messages,
          options: {
            temperature,
            num_predict: maxTokens,
          },
          stream: false,
        });
        return response.data?.message?.content || '';
      }

      throw new Error(`Unsupported provider: ${provider}`);
    } catch (error: any) {
      logger.error(`AI Completion error for provider ${provider}: ${error.message || error}`);
      throw new Error(`AI model error: ${error.message || error}`);
    }
  }

  async streamChat(
    provider: string,
    model: string,
    messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
    temperature: number = 0.7,
    maxTokens: number = 2048,
    onChunk: (text: string) => void
  ): Promise<void> {
    try {
      if (provider === 'groq' || provider === 'openrouter') {
        const client = this.getOpenAICompatibleClient(provider);
        const stream = await client.chat.completions.create({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
          stream: true,
        });
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) onChunk(content);
        }
        return;
      }

      if (provider === 'gemini') {
        const key = this.getApiKey('gemini');
        if (!key) throw new Error('Gemini API key is not configured.');

        const genai = new GoogleGenAI({ apiKey: key });
        const systemMessage = messages.find((m) => m.role === 'system')?.content;

        const contents = messages
          .filter((m) => m.role !== 'system')
          .map((m) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
          }));

        try {
          const stream = await genai.models.generateContentStream({
            model,
            contents,
            config: {
              temperature,
              maxOutputTokens: maxTokens,
              systemInstruction: systemMessage,
            },
          });

          for await (const chunk of stream) {
            const text = chunk.text;
            if (text) {
              onChunk(text);
            }
          }
        } catch (geminiErr: any) {
          throw new Error(humanizeAIError(geminiErr.message));
        }
        return;
      }

      if (provider === 'ollama') {
        const ollamaUrl = process.env.OLLAMA_API_URL || 'http://localhost:11434';
        let response;
        try {
          response = await axios.post(
            `${ollamaUrl}/api/chat`,
            {
              model,
              messages,
              options: {
                temperature,
                num_predict: maxTokens,
              },
              stream: true,
            },
            { responseType: 'stream' }
          );
        } catch (ollamaErr: any) {
          throw new Error('Ollama is not running. Please install and start Ollama at https://ollama.com, then run: ollama pull llama3');
        }

        return new Promise<void>((resolve, reject) => {
          response.data.on('data', (chunk: Buffer) => {
            const lines = chunk.toString().split('\n').filter(Boolean);
            for (const line of lines) {
              try {
                const parsed = JSON.parse(line);
                if (parsed.message?.content) {
                  onChunk(parsed.message.content);
                }
              } catch (e) {
                // Ignore parsing errors for partial lines
              }
            }
          });

          response.data.on('end', () => resolve());
          response.data.on('error', (err: any) => reject(new Error('Ollama is not running. Please install and start Ollama at https://ollama.com')));
        });
      }

      throw new Error(`Unsupported streaming provider: ${provider}`);
    } catch (error: any) {
      logger.error(`AI Streaming error for provider ${provider}: ${error.message || error}`);
      throw new Error(`AI model streaming error: ${error.message || error}`);
    }
  }
}

export const aiService = new AIService();
