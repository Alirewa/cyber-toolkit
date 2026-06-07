import { LabWorkspace } from "@/components/pages/labs/lab-workspace";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const name = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return { title: name };
}

export default async function LabDetailPage({ params }: Props) {
  const { slug } = await params;
  return <LabWorkspace slug={slug} />;
}
