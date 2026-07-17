import { Response, NextFunction } from 'express';
import { AuthRequest } from '../interfaces/auth';
import { sendSuccess, sendError } from '../utils/response';
import { aiService } from '../services/ai.service';
import { settingRepository } from '../repositories/setting.repository';
import { logger } from '../utils/logger';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

export class AnalysisController {
  async analyzeCode(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { action, code, language, mode, testFramework } = req.body;

      if (!action || !code) {
        return sendError(res, 'BAD_REQUEST', 'Action and code content are required', 400);
      }

      // Get user settings for model selection
      let settings = await settingRepository.findByUserId(req.user!.id);
      if (!settings) {
        settings = {
          id: '',
          userId: req.user!.id,
          aiProvider: 'openai',
          aiModel: 'gpt-4o',
          temperature: 0.5,
          maxTokens: 3000,
          isStreaming: true,
          isNotificationsEnabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }

      // Design specific system instructions for each action
      let actionInstruction = '';

      switch (action) {
        case 'explain':
          actionInstruction = `Provide a detailed line-by-line explanation of the code, detailing function purposes, parameters, complexity (Big O), and logical flow. Tailor the tone and detail level to a user who is at the: ${mode || 'intermediate'} level.`;
          break;
        case 'debug':
          actionInstruction = `Analyze the code for syntax issues, logic errors, runtime bugs, and security risks. Provide a list of identified bugs along with corrected code.`;
          break;
        case 'optimize':
          actionInstruction = `Examine the code and propose optimizations for performance (faster algorithms, better time complexity) and resource efficiency (memory usage), following standard code styling rules. Provide optimized code along with comparison explanations.`;
          break;
        case 'review':
          actionInstruction = `Perform a code review following industry standards. Check code structure, readability, naming conventions, architecture principles, and maintainability. Rate the code quality.`;
          break;
        case 'tests':
          actionInstruction = `Generate robust unit tests for the provided code. Use the framework: ${testFramework || 'Vitest/Jest'} for the programming language: ${language || 'TypeScript'}. Cover edge cases, success paths, and failure models.`;
          break;
        case 'doc':
          actionInstruction = `Generate standard documentation for the code: API specs, function block descriptions, class variables docstrings, and a concise README markdown file.`;
          break;
        default:
          return sendError(res, 'BAD_REQUEST', `Unsupported action: ${action}`, 400);
      }

      const systemPrompt = `You are a Senior Software Engineer and AI Assistant.
${actionInstruction}
Respond in clear, professional developer language. Formulate your response in Markdown. Wrap code blocks in standard triple backticks with the correct programming language tag.`;

      const userPrompt = `Language: ${language || 'Unspecified'}
Code:
\`\`\`${language || ''}
${code}
\`\`\``;

      if (settings.isStreaming) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();

        try {
          await aiService.streamChat(
            settings.aiProvider,
            settings.aiModel,
            [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            settings.temperature,
            settings.maxTokens,
            (chunk: string) => {
              res.write(`data: ${JSON.stringify({ token: chunk })}\n\n`);
            }
          );
          res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
          res.end();
        } catch (streamErr: any) {
          logger.error(`Error during code action streaming: ${streamErr.message}`);
          res.write(`data: ${JSON.stringify({ error: streamErr.message || 'Stream broke' })}\n\n`);
          res.end();
        }
      } else {
        const result = await aiService.chat(
          settings.aiProvider,
          settings.aiModel,
          [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          settings.temperature,
          settings.maxTokens
        );

        return sendSuccess(res, { result });
      }
    } catch (error) {
      return next(error);
    }
  }

  async runCode(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { code, language } = req.body;

      if (!code) {
        return sendError(res, 'BAD_REQUEST', 'Code is required', 400);
      }

      const langMap: { [key: string]: { ext: string; cmd: (file: string, bin: string) => string } } = {
        javascript: { ext: '.js', cmd: (f) => `node "${f}"` },
        js: { ext: '.js', cmd: (f) => `node "${f}"` },
        typescript: { ext: '.ts', cmd: (f) => `npx ts-node "${f}"` },
        ts: { ext: '.ts', cmd: (f) => `npx ts-node "${f}"` },
        python: { ext: '.py', cmd: (f) => `python3 "${f}"` },
        py: { ext: '.py', cmd: (f) => `python3 "${f}"` },
        go: { ext: '.go', cmd: (f) => `go run "${f}"` },
        bash: { ext: '.sh', cmd: (f) => `bash "${f}"` },
        sh: { ext: '.sh', cmd: (f) => `bash "${f}"` },
        c: { ext: '.c', cmd: (f, b) => `gcc "${f}" -o "${b}" && "${b}"` },
        cpp: { ext: '.cpp', cmd: (f, b) => `g++ "${f}" -o "${b}" && "${b}"` },
      };

      const langKey = (language || 'javascript').toLowerCase();
      const config = langMap[langKey];

      if (!config) {
        return sendError(
          res,
          'BAD_REQUEST',
          `Language '${language}' is not supported for execution. Supported: Javascript, TypeScript, Python, Go, C, C++, Bash.`,
          400
        );
      }

      const tempDir = path.join(__dirname, '../../temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const runId = `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const tempFile = path.join(tempDir, `${runId}${config.ext}`);
      const tempBin = path.join(tempDir, `${runId}.bin`);

      // Write code to temp file
      fs.writeFileSync(tempFile, code, 'utf8');

      const cmd = config.cmd(tempFile, tempBin);

      exec(cmd, { timeout: 5000, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
        // Clean up temp files
        try {
          if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
          if (fs.existsSync(tempBin)) fs.unlinkSync(tempBin);
        } catch (cleanupErr) {
          logger.warn(`Failed to clean up run files: ${cleanupErr}`);
        }

        if (error) {
          const isTimeout = error.killed || (error as any).signal === 'SIGTERM';
          return sendSuccess(res, {
            stdout,
            stderr: isTimeout ? 'Error: Execution timed out (5s limit).' : stderr || error.message,
            exitCode: error.code || 1,
          });
        }

        return sendSuccess(res, {
          stdout,
          stderr,
          exitCode: 0,
        });
      });
    } catch (error) {
      return next(error);
    }
  }
}

export const analysisController = new AnalysisController();
