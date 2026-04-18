'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronDown, Folder as FolderIcon, FileText, Menu } from 'lucide-react';
import { getFileSystem, getFileContent, FileNode } from '@/app/actions';

function FileExplorer({
  node,
  depth = 0,
  onFileSelect,
  selectedFile,
}: {
  node: FileNode;
  depth?: number;
  onFileSelect: (file: FileNode, content: string) => void;
  selectedFile: FileNode | null;
}) {
  const [isOpen, setIsOpen] = useState(true);

  const toggleOpen = () => setIsOpen(!isOpen);

  const isFolder = node.type === 'folder';
  const isSelected = selectedFile?.path === node.path && !isFolder;

  const handleClick = async () => {
    if (isFolder) {
      toggleOpen();
    } else {
      const content = await getFileContent(node.path);
      onFileSelect(node, content);
    }
  };

  return (
    <div>
      <div
        className={`flex items-center gap-2 py-1.5 cursor-pointer select-none text-[13px] transition-colors
          ${isSelected ? 'bg-[#e8e8e8] text-[#000000] font-medium' : 'text-[#444444] hover:bg-[#efefef]'} ${isFolder ? 'font-semibold text-[#666666]' : ''}`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={handleClick}
      >
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
      </div>

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
                onFileSelect={onFileSelect}
                selectedFile={selectedFile}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MarkdownImage({ src, alt }: { src?: string; alt?: string }) {
  if (!src) return null;

  const normalizedSrc = src.startsWith('/') ? src : `/${src}`;

  return (
    <div className="markdown-image-wrapper">
      <Image
        src={normalizedSrc}
        alt={alt ?? ''}
        width={1200}
        height={800}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
        style={{ width: '100%', height: 'auto' }}
      />
    </div>
  );
}

export default function Home() {
  const [fileSystem, setFileSystem] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchRoot = async () => {
      const nodes = await getFileSystem();
      setFileSystem(nodes);
      
      // Select about.md initially if it exists
      const initialFile = nodes.find(n => n.name === 'about.md' && n.type === 'file');
      if (initialFile) {
        const content = await getFileContent(initialFile.path);
        setSelectedFile({ ...initialFile, content });
      }
    };
    fetchRoot();
  }, []);

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
              onFileSelect={(file, content) => {
                setSelectedFile({ ...file, content });
                setIsSidebarOpen(false); // Close sidebar on mobile after selection
              }}
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
            className="md:hidden ml-2 mr-3 text-[#666666] hover:text-[#000000]"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu size={18} />
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
        <div className="flex-1 overflow-auto bg-[#ffffff] px-8 py-10 md:px-16" id="editor-area">
          <div className="max-w-4xl">
            {/* Directly conditionally render content without animations */}
            {selectedFile && selectedFile.content ? (
              <div className="markdown-body">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    img: ({ src, alt }) => (
                      <MarkdownImage
                        src={typeof src === 'string' ? src : ''}
                        alt={typeof alt === 'string' ? alt : ''}
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
    </div>
  );
}
