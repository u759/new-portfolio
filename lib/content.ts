export type FileNode = {
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: FileNode[];
};

export const DEFAULT_FILE_PATH = 'about.md';
export const SITE_NAME = 'Ayden Nguyen';
export const SITE_DESCRIPTION =
  'Computer Engineering student at UBC building flight-controller firmware, embedded systems, and full-stack software.';

/** content/experience/professional.md is served at /experience/professional; about.md is the home page. */
export function fileHref(filePath: string): string {
  return filePath === DEFAULT_FILE_PATH ? '/' : `/${filePath.replace(/\.md$/, '')}`;
}

export function filePathFromSlug(slug: string[] | undefined): string {
  return slug && slug.length > 0 ? `${slug.map(decodeURIComponent).join('/')}.md` : DEFAULT_FILE_PATH;
}

export function filePathFromPathname(pathname: string): string {
  return filePathFromSlug(pathname.split('/').filter(Boolean));
}

/** True for links to other pages of this site (not assets like /resume.pdf, not other sites). */
export function isInternalPageHref(href: string): boolean {
  if (!href.startsWith('/') || href.startsWith('//')) return false;
  const lastSegment = href.split(/[?#]/)[0].split('/').pop() ?? '';
  return !lastSegment.includes('.');
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
