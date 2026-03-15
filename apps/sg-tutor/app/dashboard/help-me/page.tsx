// Purpose: Catch-all redirect for the deprecated help-me route to the new homework-help workspace.
import { redirect } from "next/navigation";

export default function DeprecatedHelpMeRoute() {
    redirect("/dashboard/homework-help");
}
