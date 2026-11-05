import type { Metadata } from 'next';
import { getFileContent, getFileSystem, FileNode } from '@/app/actions';
import Portfolio from '@/app/portfolio';
import {
  DEFAULT_FILE_PATH,
  SITE_DESCRIPTION,
  SITE_NAME,
  findFile,
  summaryFromMarkdown,
  titleFromMarkdown,
} from '@/lib/content';

type PageProps = {
  searchParams: Promise<{ file?: string | string[] }>;
};

async function loadRequestedFile(searchParams: PageProps['searchParams']) {
  const { file } = await searchParams;
  const requestedPath = typeof file === 'string' ? file : DEFAULT_FILE_PATH;
  const fileSystem = await getFileSystem();
  const node = findFile(fileSystem, requestedPath) ?? findFile(fileSystem, DEFAULT_FILE_PATH);

  const selectedFile: FileNode | null = node
    ? { ...node, content: await getFileContent(node.path) }
    : null;

  return { fileSystem, selectedFile };
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { selectedFile } = await loadRequestedFile(searchParams);

  if (!selectedFile?.content || selectedFile.path === DEFAULT_FILE_PATH) {
    return {};
  }

  // The layout's title template doesn't apply to a page in its own segment, so add the suffix here.
  const title = `${titleFromMarkdown(selectedFile.content) ?? selectedFile.name} — ${SITE_NAME}`;
  const description = summaryFromMarkdown(selectedFile.content) ?? SITE_DESCRIPTION;

  return {
    title,
    description,
    openGraph: { title, description },
  };
}

export default async function Page({ searchParams }: PageProps) {
  const { fileSystem, selectedFile } = await loadRequestedFile(searchParams);

  return <Portfolio fileSystem={fileSystem} initialFile={selectedFile} />;
}
