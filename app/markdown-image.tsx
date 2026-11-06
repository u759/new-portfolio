'use client';

import Image from 'next/image';
import { useOpenLightbox } from '@/app/lightbox';

/** A Markdown image drawn with next/image at its real dimensions; click to expand. */
export function MarkdownImage({
  src,
  alt,
  width,
  height,
  sizes,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  sizes: string;
}) {
  const openLightbox = useOpenLightbox();

  return (
    <button
      type="button"
      className="group block w-full cursor-zoom-in appearance-none border-0 bg-transparent p-0"
      aria-label={`Expand ${alt || 'image'}`}
      data-markdown-image="true"
      data-image-src={src}
      data-image-alt={alt}
      onClick={() => openLightbox({ src, alt })}
    >
      <Image src={src} alt={alt} width={width} height={height} sizes={sizes} style={{ width: '100%', height: 'auto' }} />
    </button>
  );
}
