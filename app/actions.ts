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

export async function getFileSystem(): Promise<FileNode[]> {
  if (!fs.existsSync(CONTENT_DIR)) {
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

  return readDirectory(CONTENT_DIR, '');
}

export async function getFileContent(filePath: string): Promise<string> {
  const safePath = path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, '');
  const fullPath = path.join(CONTENT_DIR, safePath);
  
  if (!fullPath.startsWith(CONTENT_DIR)) {
    throw new Error('Invalid path');
  }
  
  if (!fs.existsSync(fullPath)) {
    return '';
  }
  
  return fs.readFileSync(fullPath, 'utf8');
}
