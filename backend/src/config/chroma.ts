import { ChromaClient } from 'chromadb';
import { logger } from '../utils/logger';

const chromaUrl = process.env.CHROMA_URL || 'http://localhost:8000';

export const chromaClient = new ChromaClient({
  path: chromaUrl,
});

export const initChroma = async () => {
  try {
    const version = await chromaClient.version();
    logger.info(`Connected to ChromaDB, version: ${version}`);
  } catch (error) {
    logger.error(`Failed to connect to ChromaDB: ${error}`);
  }
};
