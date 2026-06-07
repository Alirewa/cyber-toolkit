import { LabsProgress } from "@/components/pages/labs/labs-progress";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Progress" };

export default function LabsProgressPage() {
  return <LabsProgress />;
}
