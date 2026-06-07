import { FindingDetailPage } from "@/components/pages/ops/finding-detail";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Finding Detail" };

interface Props { params: Promise<{ id: string }> }

export default async function FindingPage({ params }: Props) {
  const { id } = await params;
  return <FindingDetailPage id={id} />;
}
