import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MarkdownDocument } from '@/app/markdown';
import { getFileContent, listMarkdownFiles } from '@/lib/content-source';
import {
  DEFAULT_FILE_PATH,
  SITE_DESCRIPTION,
  SITE_NAME,
  fileHref,
  filePathFromSlug,
  summaryFromMarkdown,
  titleFromMarkdown,
} from '@/lib/content';

type PageProps = { params: Promise<{ slug?: string[] }> };

// Every Markdown file is pre-rendered at build time; any other URL is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return listMarkdownFiles().map((file) => ({
    slug: fileHref(file.path).split('/').filter(Boolean),
  }));
}

async function loadPage(params: PageProps['params']) {
  const { slug } = await params;
  const filePath = filePathFromSlug(slug);
  if (!listMarkdownFiles().some((file) => file.path === filePath)) {
    notFound();
  }
  return { filePath, content: getFileContent(filePath) };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { filePath, content } = await loadPage(params);
  if (filePath === DEFAULT_FILE_PATH) {
    return {};
  }

  // The layout's title applies only to this segment's default, so the suffix is added here.
  const title = `${titleFromMarkdown(content) ?? filePath} — ${SITE_NAME}`;
  const description = summaryFromMarkdown(content) ?? SITE_DESCRIPTION;
  return { title, description, openGraph: { title, description } };
}

export default async function Page({ params }: PageProps) {
  const { content } = await loadPage(params);

  return (
    <div className="markdown-body">
      <MarkdownDocument content={content} />
    </div>
  );
}
