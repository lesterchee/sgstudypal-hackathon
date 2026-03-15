// Purpose: Sprint 115 — Automatically route users from the root to the application dashboard.
import { redirect } from "next/navigation";

export default function RootPage() {
  redirect("/dashboard/homework-help");
}
