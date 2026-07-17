import { fileRepository } from '../repositories/file.repository';
import { aiService } from './ai.service';
import { logger } from '../utils/logger';

export class AnalyzerService {
  async analyzeProject(projectId: string, provider: string = 'openai', model: string = 'gpt-4o'): Promise<{
    scoreCodeQuality: number;
    scoreSecurity: number;
    reportArchitecture: any;
    reportSecurity: any;
    reportPerformance: any;
    reportDependencies: any;
    suggestions: any;
  }> {
    try {
      const files = await fileRepository.findAllByProjectId(projectId);

      if (files.length === 0) {
        return {
          scoreCodeQuality: 100,
          scoreSecurity: 100,
          reportArchitecture: { folders: [], description: 'Empty project' },
          reportSecurity: { issues: [] },
          reportPerformance: { issues: [] },
          reportDependencies: { packages: [] },
          suggestions: ['Add files to start analyzing your project.'],
        };
      }

      // Prepare metadata for AI
      const fileSummaries = files.map((f) => ({
        path: f.path,
        size: f.size,
        mimeType: f.mimeType,
      }));

      // Find package.json or config files
      const configFiles = files.filter(
        (f) =>
          f.name === 'package.json' ||
          f.name === 'requirements.txt' ||
          f.name === 'Cargo.toml' ||
          f.name === 'go.mod' ||
          f.name === 'pom.xml'
      );

      const configContents = configFiles
        .map((f) => `File: ${f.path}\nContent:\n${f.content.slice(0, 3000)}`)
        .join('\n\n');

      // Sample code snippets for quality/security check (up to 3 main files)
      const mainFiles = files
        .filter((f) => !f.path.includes('test') && !f.path.includes('spec') && f.content.length > 50)
        .slice(0, 5);

      const sampleContents = mainFiles
        .map((f) => `File: ${f.path}\nContent:\n${f.content.slice(0, 1500)}`)
        .join('\n\n');

      const systemPrompt = `You are a Senior Software Architect and Security Auditor.
Analyze the codebase details provided and generate a thorough structure analysis report.
You MUST output your response in valid raw JSON format. Do not wrap it in markdown code blocks.
The JSON must follow this exact typescript schema:
{
  "scoreCodeQuality": number (0-100),
  "scoreSecurity": number (0-100),
  "reportArchitecture": {
    "folders": { "path": string, "purpose": string }[],
    "summary": string
  },
  "reportSecurity": {
    "issues": { "severity": "HIGH"|"MEDIUM"|"LOW", "file": string, "description": string, "remediation": string }[]
  },
  "reportPerformance": {
    "issues": { "file": string, "impact": string, "description": string, "solution": string }[]
  },
  "reportDependencies": {
    "packages": { "name": string, "version": string, "outdated": boolean, "vulnerability": string }[]
  },
  "suggestions": string[]
}`;

      const userPrompt = `Here is the layout and configurations of our application codebase.

Codebase File Listing:
${JSON.stringify(fileSummaries, null, 2)}

Configuration Files Content:
${configContents}

Sample Source Code Files:
${sampleContents}

Please perform the full analysis now.`;

      const aiResponse = await aiService.chat(
        provider,
        model,
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        0.2, // low temperature for structured tasks
        3000
      );

      // Clean up potential markdown formatting block wrapper (e.g. ```json ... ```)
      let cleanedJson = aiResponse.trim();
      if (cleanedJson.startsWith('```')) {
        const lines = cleanedJson.split('\n');
        if (lines[0].includes('json')) {
          lines.shift();
        } else {
          lines.shift();
        }
        if (lines[lines.length - 1].startsWith('```')) {
          lines.pop();
        }
        cleanedJson = lines.join('\n').trim();
      }

      try {
        const parsed = JSON.parse(cleanedJson);
        return {
          scoreCodeQuality: parsed.scoreCodeQuality ?? 80,
          scoreSecurity: parsed.scoreSecurity ?? 80,
          reportArchitecture: parsed.reportArchitecture ?? {},
          reportSecurity: parsed.reportSecurity ?? {},
          reportPerformance: parsed.reportPerformance ?? {},
          reportDependencies: parsed.reportDependencies ?? {},
          suggestions: parsed.suggestions ?? [],
        };
      } catch (err) {
        logger.error(`Failed to parse LLM analysis JSON: ${cleanedJson}`);
        throw new Error('Failed to parse analysis structure from AI response.');
      }
    } catch (error: any) {
      logger.error(`Project analysis service error: ${error.message || error}`);
      throw error;
    }
  }
}

export const analyzerService = new AnalyzerService();
