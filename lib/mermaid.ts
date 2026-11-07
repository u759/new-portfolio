import { createHash } from 'crypto';
import { renderMermaidSVG } from 'beautiful-mermaid';
import type { Element } from 'hast';

/**
 * Server-only: turns ```mermaid code blocks into SVG while the page is rendered (at build time
 * for statically generated pages), so diagrams arrive as plain markup with no client JavaScript.
 * beautiful-mermaid lays diagrams out without a browser, unlike the official mermaid package.
 */

// Theme variables from globals.css, so diagrams follow the site's colours.
const DIAGRAM_THEME = {
  bg: 'var(--color-ide-bg)',
  fg: 'var(--color-ide-text)',
  accent: 'var(--color-ide-accent)',
  // Registered by next/font in app/layout.tsx; the library also measures text for this font.
  font: 'Inter',
  transparent: true,
  padding: 16,
};

/** Returns the source of a ```mermaid block given its <pre> element, or null for any other block. */
export function mermaidSourceFromPre(pre: Element): string | null {
  const code = pre.children.find((child): child is Element => child.type === 'element' && child.tagName === 'code');
  const classNames = code?.properties.className;
  if (!code || !Array.isArray(classNames) || !classNames.includes('language-mermaid')) {
    return null;
  }
  return code.children.map((child) => (child.type === 'text' ? child.value : '')).join('');
}

/**
 * Renders Mermaid source to an inline SVG string plus its natural width in px (used to cap
 * scaling in CSS). The library emits a standalone SVG, so two
 * things are adjusted for inlining into a page that may hold several diagrams:
 * - its Google Fonts @import is removed, since the page already self-hosts Inter;
 * - its element ids (arrowhead markers) get a per-diagram prefix, so ids stay unique on the page.
 */
export function renderMermaid(source: string): { svg: string; width: number } {
  let svg: string;
  try {
    svg = renderMermaidSVG(source, DIAGRAM_THEME);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`[Exception in renderMermaid]: Invalid Mermaid diagram. Expected diagram source beautiful-mermaid can render, received error: ${reason}\nSource:\n${source}`);
  }

  const widthMatch = svg.match(/^<svg\b[^>]*\bwidth="([\d.]+)"/);
  if (!widthMatch) {
    throw new Error(`[Exception in renderMermaid]: Missing SVG width. Expected beautiful-mermaid to return an <svg> with a numeric width attribute, received: ${svg.slice(0, 200)}`);
  }

  const withoutFontImports = svg.replace(/^\s*@import url\('https:\/\/fonts\.googleapis\.com\/[^']*'\);\s*$\n?/gm, '');

  const idPrefix = `mermaid-${createHash('sha256').update(source).digest('hex').slice(0, 8)}-`;
  const inlineSvg = withoutFontImports
    .replace(/\bid="([^"]+)"/g, `id="${idPrefix}$1"`)
    .replace(/url\(#([^)]+)\)/g, `url(#${idPrefix}$1)`)
    .replace(/href="#([^"]+)"/g, `href="#${idPrefix}$1"`);

  return { svg: inlineSvg, width: Number(widthMatch[1]) };
}
