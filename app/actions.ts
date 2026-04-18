'use server';

import * as fs from 'fs';
import * as path from 'path';

export type FileType = 'file' | 'folder';

export interface FileNode {
  name: string;
  type: FileType;
  path: string;
  content?: string;
  children?: FileNode[];
}

const CONTENT_DIR = path.join(process.cwd(), 'content');

function resolveContentDir(): string | null {
  const candidates = new Set<string>([
    CONTENT_DIR,
    path.join(process.cwd(), '.next', 'standalone', 'content'),
    path.join(process.cwd(), '.next', 'server', 'content'),
  ]);

  let currentDir = process.cwd();
  for (let i = 0; i < 6; i += 1) {
    candidates.add(path.join(currentDir, 'content'));
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      break;
    }
    currentDir = parentDir;
  }

  for (const dir of candidates) {
    if (fs.existsSync(dir)) {
      return dir;
    }
  }

  return null;
}

export async function getFileSystem(): Promise<FileNode[]> {
  const contentDir = resolveContentDir();

  if (!contentDir) {
    return [];
  }

  function readDirectory(dir: string, relativePath: string): FileNode[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const nodes: FileNode[] = [];

    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;

      const entryPath = path.join(dir, entry.name);
      const entryRelativePath = path.join(relativePath, entry.name).replace(/\\/g, '/');

      if (entry.isDirectory()) {
        nodes.push({
          name: entry.name,
          type: 'folder',
          path: entryRelativePath,
          children: readDirectory(entryPath, entryRelativePath),
        });
      } else if (entry.name.endsWith('.md')) {
        nodes.push({
          name: entry.name,
          type: 'file',
          path: entryRelativePath,
        });
      }
    }

    nodes.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    return nodes;
  }

  return readDirectory(contentDir, '');
}

export async function getFileContent(filePath: string): Promise<string> {
  const contentDir = resolveContentDir();

  if (!contentDir) {
    return '';
  }

  const safePath = path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, '');
  const fullPath = path.join(contentDir, safePath);
  const relativePath = path.relative(contentDir, fullPath);
  
  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    throw new Error('Invalid path');
  }
  
  if (!fs.existsSync(fullPath)) {
    return '';
  }
  
  return fs.readFileSync(fullPath, 'utf8');
}
