import { redirect } from "next/navigation";

// Personal mode — root URL goes straight to dashboard.
export default function RootPage() {
  redirect("/dashboard");
}
