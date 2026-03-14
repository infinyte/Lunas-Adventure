import path from 'path';
import { fileURLToPath } from 'url';
import createServer, { createServer as createServerFactory } from './appFactory.js';

// Handle __dirname (not available in ES Modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createServer = createServerFactory;

const isMainModule = process.argv[1] && path.resolve(process.argv[1]) === __filename;

if (isMainModule) {
  const runtimeServer = createServerFactory();
  runtimeServer.start();
}

export default createServerFactory;
