import type { CSSProperties, ComponentType } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Globe, Mail } from 'lucide-react';
import { GithubIcon, LinkedinIcon } from '@/app/brand-icons';
import { MarkdownImage } from '@/app/markdown-image';
import { imageGridFromTable, type GridImage } from '@/lib/image-grid';
import { isInternalPageHref } from '@/lib/content';
import rehypeImageSize from '@/lib/rehype-image-size';

/** Max width of the Markdown column (Tailwind `max-w-4xl`). */
const CONTENT_MAX_WIDTH_PX = 896;
/** Gallery rows never get shorter than this, so narrow windows wrap to fewer images per row. */
const MIN_ROW_HEIGHT_PX = 160;
/** Typical phone width, used only to estimate which image file size to download. */
const PHONE_WIDTH_PX = 390;

type IconComponent = ComponentType<{ size?: number; className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>;

/** Picks an icon so a link's destination (GitHub, a live website, email) is clear at a glance. */
function linkIconFor(href: string): IconComponent | null {
  if (href.startsWith('mailto:')) return Mail;
  if (!href.startsWith('http')) return null;

  const host = new URL(href).hostname.replace(/^www\./, '');
  if (host === 'github.com') return GithubIcon;
  if (host === 'linkedin.com') return LinkedinIcon;
  return Globe;
}

/**
 * Justified gallery for image-only Markdown tables, done entirely in CSS (see .image-grid in
 * globals.css): each image's flex-basis and flex-grow are proportional to its aspect ratio, so
 * every wrapped row has one shared height and fills the width at any window size. The table's
 * column count sets how many images fit per row on wide screens.
 */
function ImageGrid({ images, columnCount }: { images: GridImage[]; columnCount: number }) {
  const aspectRatios = images.map((image) => image.width / image.height);
  const averageAspectRatio = aspectRatios.reduce((sum, ratio) => sum + ratio, 0) / aspectRatios.length;
  const gridStyle = {
    '--columns': columnCount,
    '--average-aspect-ratio': averageAspectRatio,
    '--min-row-height': `${MIN_ROW_HEIGHT_PX}px`,
  } as CSSProperties;

  return (
    <div className="image-grid" style={gridStyle}>
      <div className="image-grid-flow">
        {images.map((image, index) => {
          const aspectRatio = aspectRatios[index];
          // Rough rendered width, only used to choose which image file to download.
          const desktopWidth = Math.ceil((aspectRatio / (columnCount * averageAspectRatio)) * CONTENT_MAX_WIDTH_PX * 1.25);
          const phoneWidth = Math.min(100, Math.ceil(((aspectRatio * MIN_ROW_HEIGHT_PX * 1.5) / PHONE_WIDTH_PX) * 100));

          return (
            <div key={index} className="image-grid-item" style={{ '--aspect-ratio': aspectRatio } as CSSProperties}>
              <MarkdownImage
                src={image.src}
                alt={image.alt}
                width={image.width}
                height={image.height}
                sizes={`(max-width: 768px) ${phoneWidth}vw, ${desktopWidth}px`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Renders a Markdown document on the server; images arrive with real sizes from rehypeImageSize. */
export function MarkdownDocument({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeImageSize]}
      components={{
        a: ({ href, children }) => {
          if (href && isInternalPageHref(href)) {
            return <Link href={href}>{children}</Link>;
          }

          const isExternal = href?.startsWith('http');
          const LinkIcon = href ? linkIconFor(href) : null;
          return (
            <a href={href} target={isExternal ? '_blank' : undefined} rel={isExternal ? 'noopener noreferrer' : undefined}>
              {LinkIcon && <LinkIcon size={14} aria-hidden="true" className="mr-1 inline-block align-[-2px]" />}
              {children}
            </a>
          );
        },
        table: ({ node, children }) => {
          const grid = node ? imageGridFromTable(node) : null;
          return grid ? <ImageGrid images={grid.images} columnCount={grid.columnCount} /> : <table>{children}</table>;
        },
        img: ({ src, alt, width, height }) => {
          if (typeof src !== 'string' || typeof width !== 'number' || typeof height !== 'number') {
            throw new Error(`[Exception in MarkdownDocument.img]: Missing image metadata. Expected src, width and height from rehypeImageSize, received src: ${String(src)}, width: ${String(width)}, height: ${String(height)}`);
          }
          return (
            <MarkdownImage
              src={src}
              alt={typeof alt === 'string' ? alt : ''}
              width={width}
              height={height}
              sizes={`(max-width: 768px) 100vw, ${CONTENT_MAX_WIDTH_PX}px`}
            />
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
