import { ToolExecutionPage } from "@/components/pages/tools/tool-execution-page";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const name = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return { title: name };
}

export default async function ToolPage({ params }: Props) {
  const { slug } = await params;
  return <ToolExecutionPage slug={slug} />;
}
