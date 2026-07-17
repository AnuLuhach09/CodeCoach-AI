import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { fileRepository } from '../repositories/file.repository';
import { ragService } from './rag.service';
import { logger } from '../utils/logger';

const execPromise = promisify(exec);

export class GitService {
  private ignoreFolders = ['node_modules', 'dist', 'build', 'coverage', '.git', '.github', '.vscode', '.idea'];
  private ignoreExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf', '.zip', '.tar', '.gz', '.mp4', '.mp3', '.woff', '.woff2', '.ttf'];

  async cloneAndIndex(projectId: string, repoUrl: string, branch: string = 'main'): Promise<{ filesCount: number; structure: string[] }> {
    const tempDir = path.join(__dirname, '../../temp', `repo_${projectId}_${Date.now()}`);
    
    try {
      // Ensure temp dir exists
      fs.mkdirSync(tempDir, { recursive: true });

      // Run git clone
      logger.info(`Cloning repo ${repoUrl} to ${tempDir}`);
      await execPromise(`git clone --depth 1 --branch ${branch} ${repoUrl} ${tempDir}`);

      // Read files recursively
      const filePaths: string[] = [];
      this.walkDirectory(tempDir, tempDir, filePaths);

      logger.info(`Found ${filePaths.length} files to index in ${repoUrl}`);

      let filesCount = 0;
      const structure: string[] = [];

      for (const relativePath of filePaths) {
        const fullPath = path.join(tempDir, relativePath);
        const stats = fs.statSync(fullPath);

        // Skip files larger than 1MB to prevent performance slowdowns
        if (stats.size > 1024 * 1024) continue;

        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          
          // Determine mime type / file language
          const ext = path.extname(relativePath).toLowerCase();
          const mimeType = this.getMimeType(ext);

          // Save to Postgres
          const fileRecord = await fileRepository.create({
            projectId,
            name: path.basename(relativePath),
            path: relativePath,
            content,
            mimeType,
            size: stats.size,
            isIndexed: true,
          });

          // Ingest into ChromaDB RAG index
          await ragService.indexFile(projectId, fileRecord.id, relativePath, content);
          
          structure.push(relativePath);
          filesCount++;
        } catch (e) {
          // File might not be text
          logger.warn(`Skipping binary or unreadable file: ${relativePath}`);
        }
      }

      return { filesCount, structure };
    } catch (error: any) {
      logger.error(`Git cloning and indexing failed for ${repoUrl}: ${error.message || error}`);
      throw new Error(`Git clone/indexing error: ${error.message || error}`);
    } finally {
      // Clean up cloned files from disk
      if (fs.existsSync(tempDir)) {
        try {
          fs.rmSync(tempDir, { recursive: true, force: true });
          logger.info(`Cleaned up temp directory ${tempDir}`);
        } catch (err) {
          logger.error(`Error cleaning up temp directory ${tempDir}: ${err}`);
        }
      }
    }
  }

  private walkDirectory(baseDir: string, currentDir: string, filePaths: string[]) {
    const items = fs.readdirSync(currentDir);

    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const relativePath = path.relative(baseDir, fullPath);
      const stats = fs.statSync(fullPath);

      if (stats.isDirectory()) {
        if (this.ignoreFolders.includes(item)) continue;
        this.walkDirectory(baseDir, fullPath, filePaths);
      } else {
        const ext = path.extname(item).toLowerCase();
        if (this.ignoreExtensions.includes(ext)) continue;
        filePaths.push(relativePath);
      }
    }
  }

  private getMimeType(ext: string): string {
    const map: { [key: string]: string } = {
      '.js': 'application/javascript',
      '.ts': 'application/x-typescript',
      '.tsx': 'application/x-typescript-react',
      '.jsx': 'application/javascript-react',
      '.py': 'text/x-python',
      '.java': 'text/x-java',
      '.go': 'text/x-go',
      '.rs': 'text/x-rust',
      '.json': 'application/json',
      '.md': 'text/markdown',
      '.html': 'text/html',
      '.css': 'text/css',
      '.sh': 'text/x-shellscript',
      '.yml': 'text/yaml',
      '.yaml': 'text/yaml',
    };
    return map[ext] || 'text/plain';
  }
}

export const gitService = new GitService();
