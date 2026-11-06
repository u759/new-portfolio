'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronRight, FileText, Folder as FolderIcon, Menu } from 'lucide-react';
import { LightboxProvider } from '@/app/lightbox';
import { fileHref, filePathFromPathname, type FileNode } from '@/lib/content';

function FileExplorer({ node, depth = 0, selectedPath }: { node: FileNode; depth?: number; selectedPath: string }) {
  const [isOpen, setIsOpen] = useState(true);

  const isFolder = node.type === 'folder';
  const isSelected = !isFolder && node.path === selectedPath;

  const rowClassName = `flex items-center gap-2 py-1.5 cursor-pointer select-none text-[13px] transition-colors
          ${isSelected ? 'bg-[#e8e8e8] text-[#000000] font-medium' : 'text-[#444444] hover:bg-[#efefef]'} ${isFolder ? 'font-semibold text-[#666666]' : ''}`;
  const rowStyle = { paddingLeft: `${depth * 12 + 8}px` };

  const rowContent = (
    <>
      <span className="text-[#a0a0a0] flex-shrink-0 w-4 flex justify-center opacity-60">
        {isFolder ? (isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : <span className="w-4 inline-block" />}
      </span>
      <span className="flex-shrink-0 opacity-60">{isFolder ? <FolderIcon size={16} /> : <FileText size={16} />}</span>
      <span className="truncate">{node.name}</span>
    </>
  );

  return (
    <div>
      {isFolder ? (
        <div className={rowClassName} style={rowStyle} role="button" aria-expanded={isOpen} onClick={() => setIsOpen(!isOpen)}>
          {rowContent}
        </div>
      ) : (
        <Link href={fileHref(node.path)} className={rowClassName} style={rowStyle} aria-current={isSelected ? 'page' : undefined}>
          {rowContent}
        </Link>
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
            {node.children.map((child) => (
              <FileExplorer key={child.path} node={child} depth={depth + 1} selectedPath={selectedPath} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Editor-style frame (explorer, tab, breadcrumb, status bar) around the current Markdown page. */
export function PortfolioShell({ fileSystem, children }: { fileSystem: FileNode[]; children: React.ReactNode }) {
  const pathname = usePathname();
  const selectedPath = filePathFromPathname(pathname);
  const selectedName = selectedPath.split('/').pop();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const editorAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsSidebarOpen(false);
    editorAreaRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <LightboxProvider>
      <div className="flex h-screen bg-[#ffffff] font-sans overflow-hidden">
        {isSidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
        )}

        <nav
          aria-label="Files"
          className={`fixed inset-y-0 left-0 z-50 w-[260px] bg-[#f7f7f7] border-r border-[#e5e5e5] flex flex-col transform transition-transform duration-300 md:translate-x-0 md:static md:flex-shrink-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <div className="p-4 flex items-center font-sans text-[11px] font-semibold uppercase text-[#888888] tracking-wider shrink-0 select-none border-b border-[#eeeeee]">
            Explorer
          </div>
          <div className="flex-1 overflow-y-auto py-3 font-mono hide-scrollbar">
            {fileSystem.map((node) => (
              <FileExplorer key={node.path} node={node} selectedPath={selectedPath} />
            ))}
          </div>
        </nav>

        <div className="flex-1 flex flex-col min-w-0">
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
              <div className="h-full bg-[#ffffff] flex items-center px-5 border-r border-[#e5e5e5] border-t-2 editor-tab-active text-xs font-mono cursor-default select-none pt-[2px]">
                {selectedName}
              </div>
              <div className="flex-1"></div>
            </div>
          </div>

          <div className="py-2.5 px-8 text-xs text-[#888888] font-mono shrink-0">
            portfolio &gt; {selectedPath.split('/').join(' > ')}
          </div>

          <main className="flex-1 overflow-auto bg-[#ffffff] px-8 py-10 md:px-16" id="editor-area" ref={editorAreaRef}>
            <div className="max-w-4xl">{children}</div>
          </main>

          <div className="h-6 bg-[#0066cc] text-white text-[10px] flex items-center px-3 justify-between font-mono shrink-0">
            <div>UTF-8 | Markdown</div>
            <div>Line 1, Col 1 | Spaces: 2</div>
          </div>
        </div>
      </div>
    </LightboxProvider>
  );
}
