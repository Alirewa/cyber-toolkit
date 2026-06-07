import { LabsHub } from "@/components/pages/labs/labs-hub";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Bug Bounty Labs" };

export default function LabsPage() {
  return <LabsHub />;
}
