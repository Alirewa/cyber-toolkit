import { OpsHub } from "@/components/pages/ops/ops-hub";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Security Operations" };

export default function OpsPage() {
  return <OpsHub />;
}
