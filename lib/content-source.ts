import * as fs from 'fs';
import * as path from 'path';
import type { FileNode } from '@/lib/content';

/** Server-only: reads the Markdown tree under content/. */
const CONTENT_DIR = path.join(process.cwd(), 'content');

export function getFileSystem(): FileNode[] {
  function readDirectory(dir: string, relativePath: string): FileNode[] {
    const nodes: FileNode[] = [];

    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue;

      const entryRelativePath = path.posix.join(relativePath, entry.name);

      if (entry.isDirectory()) {
        nodes.push({
          name: entry.name,
          type: 'folder',
          path: entryRelativePath,
          children: readDirectory(path.join(dir, entry.name), entryRelativePath),
        });
      } else if (entry.name.endsWith('.md')) {
        nodes.push({ name: entry.name, type: 'file', path: entryRelativePath });
      }
    }

    return nodes.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  }

  return fs.existsSync(CONTENT_DIR) ? readDirectory(CONTENT_DIR, '') : [];
}

export function listMarkdownFiles(nodes: FileNode[] = getFileSystem()): FileNode[] {
  return nodes.flatMap((node) => (node.type === 'folder' ? listMarkdownFiles(node.children ?? []) : [node]));
}

export function getFileContent(filePath: string): string {
  const fullPath = path.join(CONTENT_DIR, filePath);
  const relativePath = path.relative(CONTENT_DIR, fullPath);

  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    throw new Error(`[Exception in getFileContent]: Invalid parameter 'filePath'. Expected a path inside content/, received: ${filePath}`);
  }

  return fs.readFileSync(fullPath, 'utf8');
}
