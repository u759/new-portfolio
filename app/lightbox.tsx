'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight, LoaderCircle, X } from 'lucide-react';

export type LightboxImage = { src: string; alt: string };

const LightboxContext = createContext<((image: LightboxImage) => void) | null>(null);

export function useOpenLightbox() {
  const openImage = useContext(LightboxContext);
  if (!openImage) {
    throw new Error('[Exception in useOpenLightbox]: Missing LightboxProvider. Expected a LightboxProvider ancestor, received: null');
  }
  return openImage;
}

/** Full-screen image viewer that steps through every Markdown image on the current page. */
export function LightboxProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [images, setImages] = useState<LightboxImage[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);

  const close = () => {
    setActiveIndex(null);
    setImages([]);
    setIsImageLoading(false);
    dialogRef.current?.close();
  };

  const step = (offset: number) => {
    setIsImageLoading(true);
    setActiveIndex((currentIndex) => {
      if (currentIndex === null || images.length === 0) {
        throw new Error(`[Exception in LightboxProvider.step]: Invalid gallery navigation state. Expected an open gallery with images, received index: ${currentIndex}, image count: ${images.length}`);
      }
      return (currentIndex + offset + images.length) % images.length;
    });
  };

  const openImage = (image: LightboxImage) => {
    const imageButtons = document.querySelectorAll<HTMLButtonElement>('[data-markdown-image="true"]');
    const pageImages = Array.from(imageButtons).map((button) => {
      const { imageSrc, imageAlt } = button.dataset;
      if (!imageSrc || imageAlt === undefined) {
        throw new Error(`[Exception in LightboxProvider.openImage]: Invalid Markdown image metadata. Expected data-image-src and data-image-alt on every image button, received src: ${imageSrc ?? 'missing'}, alt: ${imageAlt ?? 'missing'}`);
      }
      return { src: imageSrc, alt: imageAlt };
    });

    const imageIndex = pageImages.findIndex((candidate) => candidate.src === image.src);
    if (imageIndex < 0) {
      throw new Error(`[Exception in LightboxProvider.openImage]: Image '${image.src}' was not found on the page. Expected the clicked image to be rendered by MarkdownImage.`);
    }

    setImages(pageImages);
    setIsImageLoading(true);
    setActiveIndex(imageIndex);
  };

  useEffect(() => {
    close();
    // Closing on navigation only; `close` is recreated every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      throw new Error('[Exception in LightboxProvider.dialogEffect]: Missing image dialog element. Expected a mounted HTMLDialogElement, received: null');
    }

    if (activeIndex === null) {
      if (dialog.open) dialog.close();
      return;
    }
    if (!images[activeIndex]) {
      throw new Error(`[Exception in LightboxProvider.dialogEffect]: Invalid parameter 'activeIndex'. Expected an index in images, received: ${activeIndex}`);
    }
    if (!dialog.open) dialog.showModal();
  }, [activeIndex, images]);

  useEffect(() => {
    if (activeIndex === null) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        step(event.key === 'ArrowLeft' ? -1 : 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // `step` only depends on images.length, which is listed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, images.length]);

  const activeImage = activeIndex === null ? null : images[activeIndex];

  return (
    <LightboxContext.Provider value={openImage}>
      {children}

      <dialog
        ref={dialogRef}
        className="image-lightbox fixed inset-0 m-0 flex h-dvh w-dvw max-h-none max-w-none items-center justify-center bg-transparent p-4"
        aria-label="Expanded Markdown image"
        onClose={() => {
          setActiveIndex(null);
          setImages([]);
          setIsImageLoading(false);
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        {activeImage && activeIndex !== null && (
          <div className="relative flex h-full w-full max-w-6xl items-center justify-center">
            <Image
              fill
              src={activeImage.src}
              alt={activeImage.alt}
              sizes="(max-width: 1152px) 100vw, 1152px"
              className={`object-contain transition-opacity duration-200 ${isImageLoading ? 'opacity-0' : 'opacity-100'}`}
              onLoad={() => setIsImageLoading(false)}
              priority
            />

            {isImageLoading && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center" role="status" aria-label="Loading image">
                <LoaderCircle size={28} className="animate-spin text-white/80" aria-hidden="true" />
              </div>
            )}

            <button
              type="button"
              className="absolute right-2 top-2 rounded-full bg-black/60 p-2 text-white transition-colors hover:bg-black/80 focus:outline-none focus:ring-2 focus:ring-white"
              aria-label="Close expanded image"
              autoFocus
              onClick={close}
            >
              <X size={20} aria-hidden="true" />
            </button>

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white transition-colors hover:bg-black/80 focus:outline-none focus:ring-2 focus:ring-white"
                  aria-label="Previous image"
                  onClick={() => step(-1)}
                >
                  <ChevronLeft size={24} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white transition-colors hover:bg-black/80 focus:outline-none focus:ring-2 focus:ring-white"
                  aria-label="Next image"
                  onClick={() => step(1)}
                >
                  <ChevronRight size={24} aria-hidden="true" />
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs font-mono text-white">
                  {activeIndex + 1} / {images.length}
                </div>
              </>
            )}
          </div>
        )}
      </dialog>
    </LightboxContext.Provider>
  );
}
