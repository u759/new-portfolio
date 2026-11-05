import type { FileNode } from '@/app/actions';

export const DEFAULT_FILE_PATH = 'about.md';
export const SITE_NAME = 'Ayden Nguyen';
export const SITE_DESCRIPTION =
  'Computer Engineering student at UBC building flight-controller firmware, embedded systems, and full-stack software.';

export function findFile(nodes: FileNode[], filePath: string): FileNode | null {
  for (const node of nodes) {
    if (node.type === 'file' && node.path === filePath) {
      return node;
    }
    if (node.type === 'folder' && node.children) {
      const match = findFile(node.children, filePath);
      if (match) {
        return match;
      }
    }
  }
  return null;
}

export function fileHref(filePath: string): string {
  return filePath === DEFAULT_FILE_PATH ? '/' : `/?file=${encodeURI(filePath)}`;
}

/** Returns the file path an in-site href points at, or null for any other link. */
export function filePathFromHref(href: string): string | null {
  const match = /^\/?\?file=(.+)$/.exec(href);
  return match ? decodeURI(match[1]) : null;
}

export function titleFromMarkdown(content: string): string | null {
  const heading = content.split(/\r?\n/).find((line) => line.startsWith('# '));
  return heading ? heading.slice(2).trim() : null;
}

/** First line of prose or bullet text, stripped of Markdown syntax, for link previews. */
export function summaryFromMarkdown(content: string, maxLength = 160): string | null {
  const line = content
    .split(/\r?\n/)
    .map((candidate) => candidate.trim())
    .find((candidate) => candidate !== '' && !/^(#|\*\*|\||!\[|---)/.test(candidate));

  if (!line) {
    return null;
  }

  const text = line
    .replace(/^[-*]\s+/, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_`]/g, '')
    .trim();

  return text.length > maxLength ? `${text.slice(0, maxLength - 1).trimEnd()}…` : text;
}
