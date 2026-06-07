import { ReportsCenter } from "@/components/pages/ops/reports-center";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Reports" };

export default function ReportsPage() {
  return <ReportsCenter />;
}
