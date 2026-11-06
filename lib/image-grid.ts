import type { Element, ElementContent } from 'hast';

export type GridImage = { src: string; alt: string; width: number; height: number };

function isBlankText(node: ElementContent): boolean {
  return node.type === 'text' && node.value.trim() === '';
}

function childElements(node: Element, tagNames: string[]): Element[] {
  return node.children.filter(
    (child): child is Element => child.type === 'element' && tagNames.includes(child.tagName),
  );
}

/**
 * Returns the images of a Markdown table in reading order with the column count it was written
 * with, or null if any cell holds anything other than an image (so ordinary data tables keep
 * rendering as tables). Image dimensions come from the rehypeImageSize plugin.
 */
export function imageGridFromTable(table: Element): { images: GridImage[]; columnCount: number } | null {
  const rows = childElements(table, ['thead', 'tbody']).flatMap((section) => childElements(section, ['tr']));
  const images: GridImage[] = [];
  let columnCount = 0;

  for (const row of rows) {
    const cells = childElements(row, ['th', 'td']);
    columnCount = Math.max(columnCount, cells.length);

    for (const cell of cells) {
      for (const child of cell.children) {
        if (isBlankText(child)) continue;
        if (child.type !== 'element' || child.tagName !== 'img') return null;

        const { src, alt, width, height } = child.properties;
        if (typeof src !== 'string' || typeof width !== 'number' || typeof height !== 'number') {
          throw new Error(`[Exception in imageGridFromTable]: Missing image metadata. Expected src, width and height from rehypeImageSize, received src: ${String(src)}, width: ${String(width)}, height: ${String(height)}`);
        }
        images.push({ src, alt: typeof alt === 'string' ? alt : '', width, height });
      }
    }
  }

  return images.length > 0 ? { images, columnCount } : null;
}
