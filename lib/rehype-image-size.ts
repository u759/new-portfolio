import * as fs from 'fs';
import * as path from 'path';
import { imageSize } from 'image-size';
import type { Element, Root, RootContent } from 'hast';

/**
 * Rehype plugin: reads each local image's real dimensions from public/ and sets `width` and
 * `height` on its <img>, so next/image can reserve exactly the right space before the image
 * loads. Runs where the page is rendered (at build time for statically generated pages), so a
 * new photo is picked up automatically with nothing to record by hand.
 */
const PUBLIC_DIR = path.join(process.cwd(), 'public');

type Size = { width: number; height: number };
const sizeCache = new Map<string, { modifiedMs: number; size: Size }>();

function readImageSize(src: string): Size {
  const filePath = path.join(PUBLIC_DIR, decodeURI(src));
  const relativePath = path.relative(PUBLIC_DIR, filePath);
  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    throw new Error(`[Exception in rehypeImageSize]: Invalid image src. Expected a path inside public/, received: ${src}`);
  }
  if (!fs.existsSync(filePath)) {
    throw new Error(`[Exception in rehypeImageSize]: Image not found. Expected '${src}' to exist at public${src}, but no file was found.`);
  }

  const modifiedMs = fs.statSync(filePath).mtimeMs;
  const cached = sizeCache.get(filePath);
  if (cached && cached.modifiedMs === modifiedMs) {
    return cached.size;
  }

  const { width, height, orientation } = imageSize(fs.readFileSync(filePath));
  // EXIF orientations 5–8 are rotated 90°, so the displayed width and height are swapped.
  const size = orientation !== undefined && orientation >= 5 ? { width: height, height: width } : { width, height };
  sizeCache.set(filePath, { modifiedMs, size });
  return size;
}

function visitImages(node: Root | RootContent, onImage: (image: Element) => void) {
  if (node.type === 'element' && node.tagName === 'img') {
    onImage(node);
  }
  if ('children' in node) {
    for (const child of node.children) visitImages(child, onImage);
  }
}

export default function rehypeImageSize() {
  return (tree: Root) => {
    visitImages(tree, (image) => {
      const src = image.properties.src;
      if (typeof src !== 'string') return;

      if (/^(https?:)?\/\//.test(src)) {
        throw new Error(`[Exception in rehypeImageSize]: Remote images are not supported. Expected an image under public/, received: ${src}`);
      }

      const localSrc = src.startsWith('/') ? src : `/${src}`;
      const { width, height } = readImageSize(localSrc);
      image.properties.src = localSrc;
      image.properties.width = width;
      image.properties.height = height;
    });
  };
}
