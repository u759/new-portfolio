'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Folder as FolderIcon,
  FileText,
  Globe,
  LoaderCircle,
  Mail,
  Menu,
  X,
} from 'lucide-react';
import { GithubIcon, LinkedinIcon } from '@/app/brand-icons';
import { getFileContent, FileNode } from '@/app/actions';
import {
  DEFAULT_FILE_PATH,
  SITE_NAME,
  fileHref,
  filePathFromHref,
  findFile,
  titleFromMarkdown,
} from '@/lib/content';

/** Picks an icon so a link's destination (GitHub, a live website, email) is clear at a glance. */
type LinkIcon = React.ComponentType<{ size?: number; className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>;

function linkIconFor(href: string): LinkIcon | null {
  if (href.startsWith('mailto:')) return Mail;
  if (!href.startsWith('http')) return null;

  const host = new URL(href).hostname.replace(/^www\./, '');
  if (host === 'github.com') return GithubIcon;
  if (host === 'linkedin.com') return LinkedinIcon;
  return Globe;
}

/** Plain left-clicks navigate in place; modified clicks (new tab, etc.) keep the browser default. */
function isPlainLeftClick(event: React.MouseEvent<HTMLAnchorElement>) {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}

function FileExplorer({
  node,
  depth = 0,
  onNavigate,
  selectedFile,
}: {
  node: FileNode;
  depth?: number;
  onNavigate: (filePath: string) => void;
  selectedFile: FileNode | null;
}) {
  const [isOpen, setIsOpen] = useState(true);

  const isFolder = node.type === 'folder';
  const isSelected = selectedFile?.path === node.path && !isFolder;

  const rowClassName = `flex items-center gap-2 py-1.5 cursor-pointer select-none text-[13px] transition-colors
          ${isSelected ? 'bg-[#e8e8e8] text-[#000000] font-medium' : 'text-[#444444] hover:bg-[#efefef]'} ${isFolder ? 'font-semibold text-[#666666]' : ''}`;
  const rowStyle = { paddingLeft: `${depth * 12 + 8}px` };

  const rowContent = (
    <>
      <span className="text-[#a0a0a0] flex-shrink-0 w-4 flex justify-center opacity-60">
        {isFolder ? (
          isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />
        ) : (
          <span className="w-4 inline-block" />
        )}
      </span>
      <span className="flex-shrink-0 opacity-60">
        {isFolder ? (
          <FolderIcon size={16} />
        ) : (
          <FileText size={16} />
        )}
      </span>
      <span className="truncate">{node.name}</span>
    </>
  );

  return (
    <div>
      {isFolder ? (
        <div
          className={rowClassName}
          style={rowStyle}
          role="button"
          aria-expanded={isOpen}
          onClick={() => setIsOpen(!isOpen)}
        >
          {rowContent}
        </div>
      ) : (
        <a
          href={fileHref(node.path)}
          className={rowClassName}
          style={rowStyle}
          aria-current={isSelected ? 'page' : undefined}
          onClick={(event) => {
            if (!isPlainLeftClick(event)) return;
            event.preventDefault();
            onNavigate(node.path);
          }}
        >
          {rowContent}
        </a>
      )}

      <AnimatePresence initial={false}>
        {isFolder && isOpen && node.children && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="flex flex-col overflow-hidden"
          >
            {node.children.map((child, index) => (
              <FileExplorer
                key={`${depth}-${index}`}
                node={child}
                depth={depth + 1}
                onNavigate={onNavigate}
                selectedFile={selectedFile}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

type GalleryImage = {
  src: string;
  alt: string;
};

function MarkdownImage({
  src,
  alt,
  onOpen,
}: {
  src?: string;
  alt?: string;
  onOpen: (image: GalleryImage) => void;
}) {
  if (!src) return null;

  const normalizedSrc = src.startsWith('/') ? src : `/${src}`;
  const image = (
    <Image
      src={normalizedSrc}
      alt={alt ?? ''}
      width={1200}
      height={800}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
      style={{ width: '100%', height: 'auto' }}
    />
  );

  return (
    <button
      type="button"
      className="group block w-full cursor-zoom-in appearance-none border-0 bg-transparent p-0"
      aria-label={`Expand ${alt || 'image'}`}
      data-markdown-image="true"
      data-image-src={normalizedSrc}
      data-image-alt={alt ?? ''}
      onClick={() => onOpen({ src: normalizedSrc, alt: alt ?? '' })}
    >
      {image}
    </button>
  );
}

export default function Portfolio({
  fileSystem,
  initialFile,
}: {
  fileSystem: FileNode[];
  initialFile: FileNode | null;
}) {
  const searchParams = useSearchParams();
  const requestedPath = searchParams.get('file') ?? DEFAULT_FILE_PATH;
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(initialFile);
  const selectedPathRef = useRef<string | null>(initialFile?.path ?? null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const markdownContentRef = useRef<HTMLDivElement>(null);
  const editorAreaRef = useRef<HTMLDivElement>(null);
  const imageDialogRef = useRef<HTMLDialogElement>(null);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [activeGalleryImageIndex, setActiveGalleryImageIndex] = useState<number | null>(null);
  const [isGalleryImageLoading, setIsGalleryImageLoading] = useState(false);

  // The URL (?file=...) is the source of truth, so links, refreshes, and back/forward all agree.
  useEffect(() => {
    if (requestedPath === selectedPathRef.current) {
      return;
    }

    const node = findFile(fileSystem, requestedPath);
    if (!node) {
      return;
    }

    let isCancelled = false;
    getFileContent(node.path).then((content) => {
      if (isCancelled) return;
      selectedPathRef.current = node.path;
      setActiveGalleryImageIndex(null);
      setGalleryImages([]);
      setSelectedFile({ ...node, content });
      editorAreaRef.current?.scrollTo({ top: 0 });
    });

    return () => {
      isCancelled = true;
    };
  }, [requestedPath, fileSystem]);

  useEffect(() => {
    if (!selectedFile?.content) return;
    const title = titleFromMarkdown(selectedFile.content);
    document.title = selectedFile.path === DEFAULT_FILE_PATH || !title ? SITE_NAME : `${title} — ${SITE_NAME}`;
  }, [selectedFile]);

  const navigateTo = (filePath: string) => {
    setIsSidebarOpen(false);
    if (filePath !== requestedPath) {
      window.history.pushState(null, '', fileHref(filePath));
    }
  };

  useEffect(() => {
    const dialog = imageDialogRef.current;

    if (!dialog) {
      throw new Error('[Exception in Home.imageDialogEffect]: Missing image dialog element. Expected a mounted HTMLDialogElement, received: null');
    }

    if (activeGalleryImageIndex === null) {
      if (dialog.open) {
        dialog.close();
      }
      return;
    }

    if (!galleryImages[activeGalleryImageIndex]) {
      throw new Error(`[Exception in Home.imageDialogEffect]: Invalid parameter 'activeGalleryImageIndex'. Expected an index in galleryImages, received: ${activeGalleryImageIndex}`);
    }

    if (!dialog.open) {
      dialog.showModal();
    }
  }, [activeGalleryImageIndex, galleryImages]);

  useEffect(() => {
    if (activeGalleryImageIndex === null) {
      return;
    }

    const handleGalleryKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setIsGalleryImageLoading(true);
        setActiveGalleryImageIndex((currentIndex) => {
          if (currentIndex === null || galleryImages.length === 0) {
            throw new Error(`[Exception in Home.handleGalleryKeyDown]: Invalid gallery navigation state. Expected an open gallery with images, received index: ${currentIndex}, image count: ${galleryImages.length}`);
          }
          return (currentIndex - 1 + galleryImages.length) % galleryImages.length;
        });
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        setIsGalleryImageLoading(true);
        setActiveGalleryImageIndex((currentIndex) => {
          if (currentIndex === null || galleryImages.length === 0) {
            throw new Error(`[Exception in Home.handleGalleryKeyDown]: Invalid gallery navigation state. Expected an open gallery with images, received index: ${currentIndex}, image count: ${galleryImages.length}`);
          }
          return (currentIndex + 1) % galleryImages.length;
        });
      }
    };

    window.addEventListener('keydown', handleGalleryKeyDown);
    return () => window.removeEventListener('keydown', handleGalleryKeyDown);
  }, [activeGalleryImageIndex, galleryImages.length]);

  const closeGallery = () => {
    setActiveGalleryImageIndex(null);
    setGalleryImages([]);
    setIsGalleryImageLoading(false);
    imageDialogRef.current?.close();
  };

  const openGalleryImage = (image: GalleryImage) => {
    const imageButtons = markdownContentRef.current?.querySelectorAll<HTMLButtonElement>('[data-markdown-image="true"]');

    if (!imageButtons || imageButtons.length === 0) {
      throw new Error(`[Exception in Home.openGalleryImage]: Missing Markdown image buttons. Expected at least one image button for '${image.src}', received: ${imageButtons?.length ?? 0}`);
    }

    const images = Array.from(imageButtons).map((button) => {
      const src = button.dataset.imageSrc;
      const alt = button.dataset.imageAlt;

      if (!src || alt === undefined) {
        throw new Error(`[Exception in Home.openGalleryImage]: Invalid Markdown image metadata. Expected data-image-src and data-image-alt on every image button, received src: ${src ?? 'missing'}, alt: ${alt ?? 'missing'}`);
      }

      return { src, alt };
    });

    const imageIndex = images.findIndex((candidate) => candidate.src === image.src);
    if (imageIndex < 0) {
      throw new Error(`[Exception in Home.openGalleryImage]: Image '${image.src}' was not found in the rendered Markdown gallery. Expected the clicked image to be present in the current document.`);
    }

    setGalleryImages(images);
    setIsGalleryImageLoading(true);
    setActiveGalleryImageIndex(imageIndex);
  };

  const activeGalleryImage = activeGalleryImageIndex === null
    ? null
    : galleryImages[activeGalleryImageIndex];

  return (
    <div className="flex h-screen bg-[#ffffff] font-sans overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-[260px] bg-[#f7f7f7] border-r border-[#e5e5e5] flex flex-col transform transition-transform duration-300 md:translate-x-0 md:static md:flex-shrink-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-4 flex items-center font-sans text-[11px] font-semibold uppercase text-[#888888] tracking-wider shrink-0 select-none border-b border-[#eeeeee]">
          Explorer
        </div>
        <div className="flex-1 overflow-y-auto py-3 font-mono hide-scrollbar">
          {fileSystem.map((node, index) => (
            <FileExplorer
              key={index}
              node={node}
              onNavigate={navigateTo}
              selectedFile={selectedFile}
            />
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar / Breadcrumb */}
        <div className="h-10 bg-[#f7f7f7] flex items-center shrink-0 border-b border-[#e5e5e5]">
          <button
            type="button"
            className="md:hidden ml-2 mr-3 flex items-center gap-1.5 text-xs font-mono text-[#666666] hover:text-[#000000]"
            aria-label="Open file explorer"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu size={18} aria-hidden="true" />
            <span>Files</span>
          </button>
          
          <div className="flex h-full">
            {selectedFile && (
              <div className="h-full bg-[#ffffff] flex items-center px-5 border-r border-[#e5e5e5] border-t-2 editor-tab-active text-xs font-mono cursor-default select-none pt-[2px]">
                {selectedFile.name}
              </div>
            )}
            <div className="flex-1"></div>
          </div>
        </div>

        {selectedFile && (
           <div className="py-2.5 px-8 text-xs text-[#888888] font-mono shrink-0">
             portfolio &gt; {selectedFile.path.split('/').join(' > ')}
           </div>
        )}

        {/* Editor Area */}
        <div className="flex-1 overflow-auto bg-[#ffffff] px-8 py-10 md:px-16" id="editor-area" ref={editorAreaRef}>
          <div className="max-w-4xl">
            {selectedFile && selectedFile.content ? (
              <div className="markdown-body" ref={markdownContentRef}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    a: ({ href, children }) => {
                      const linkedPath = href ? filePathFromHref(href) : null;
                      if (linkedPath) {
                        return (
                          <a
                            href={fileHref(linkedPath)}
                            onClick={(event) => {
                              if (!isPlainLeftClick(event)) return;
                              event.preventDefault();
                              navigateTo(linkedPath);
                            }}
                          >
                            {children}
                          </a>
                        );
                      }
                      const isExternal = href?.startsWith('http');
                      const LinkIcon = href ? linkIconFor(href) : null;
                      return (
                        <a
                          href={href}
                          target={isExternal ? '_blank' : undefined}
                          rel={isExternal ? 'noopener noreferrer' : undefined}
                        >
                          {LinkIcon && (
                            <LinkIcon size={14} aria-hidden="true" className="mr-1 inline-block align-[-2px]" />
                          )}
                          {children}
                        </a>
                      );
                    },
                    img: ({ src, alt }) => (
                      <MarkdownImage
                        src={typeof src === 'string' ? src : ''}
                        alt={typeof alt === 'string' ? alt : ''}
                        onOpen={openGalleryImage}
                      />
                    ),
                  }}
                >
                  {selectedFile.content}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-[#888888] mt-32">
                <div className="text-center font-mono text-sm">
                  <div className="mb-4 flex justify-center">
                    <FolderIcon size={48} className="text-[#cccccc]" opacity={0.6} />
                  </div>
                  <div>Select a file or folder</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="h-6 bg-[#0066cc] text-white text-[10px] flex items-center px-3 justify-between font-mono shrink-0">
          <div>UTF-8 | Markdown</div>
          <div>Line 1, Col 1 | Spaces: 2</div>
        </div>
      </div>

      <dialog
        ref={imageDialogRef}
        className="image-lightbox fixed inset-0 m-0 flex h-dvh w-dvw max-h-none max-w-none items-center justify-center bg-transparent p-4"
        aria-label="Expanded Markdown image"
        onClose={() => {
          setActiveGalleryImageIndex(null);
          setGalleryImages([]);
          setIsGalleryImageLoading(false);
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            closeGallery();
          }
        }}
      >
        {activeGalleryImage && activeGalleryImageIndex !== null && (
          <div className="relative flex h-full w-full max-w-6xl items-center justify-center">
            <Image
              fill
              src={activeGalleryImage.src}
              alt={activeGalleryImage.alt}
              sizes="(max-width: 1152px) 100vw, 1152px"
              className={`object-contain transition-opacity duration-200 ${isGalleryImageLoading ? 'opacity-0' : 'opacity-100'}`}
              onLoad={() => setIsGalleryImageLoading(false)}
              priority
            />

            {isGalleryImageLoading && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center" role="status" aria-label="Loading image">
                <LoaderCircle size={28} className="animate-spin text-white/80" aria-hidden="true" />
              </div>
            )}

            <button
              type="button"
              className="absolute right-2 top-2 rounded-full bg-black/60 p-2 text-white transition-colors hover:bg-black/80 focus:outline-none focus:ring-2 focus:ring-white"
              aria-label="Close expanded image"
              autoFocus
              onClick={closeGallery}
            >
              <X size={20} aria-hidden="true" />
            </button>

            {galleryImages.length > 1 && (
              <>
                <button
                  type="button"
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white transition-colors hover:bg-black/80 focus:outline-none focus:ring-2 focus:ring-white"
                  aria-label="Previous image"
                  onClick={() => {
                    setIsGalleryImageLoading(true);
                    setActiveGalleryImageIndex((activeGalleryImageIndex - 1 + galleryImages.length) % galleryImages.length);
                  }}
                >
                  <ChevronLeft size={24} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white transition-colors hover:bg-black/80 focus:outline-none focus:ring-2 focus:ring-white"
                  aria-label="Next image"
                  onClick={() => {
                    setIsGalleryImageLoading(true);
                    setActiveGalleryImageIndex((activeGalleryImageIndex + 1) % galleryImages.length);
                  }}
                >
                  <ChevronRight size={24} aria-hidden="true" />
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs font-mono text-white">
                  {activeGalleryImageIndex + 1} / {galleryImages.length}
                </div>
              </>
            )}
          </div>
        )}
      </dialog>
    </div>
  );
}
