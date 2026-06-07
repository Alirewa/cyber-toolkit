import { FindingsDashboard } from "@/components/pages/ops/findings-dashboard";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Findings" };

export default function FindingsPage() {
  return <FindingsDashboard />;
}
