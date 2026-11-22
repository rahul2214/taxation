import { redirect } from "next/navigation";

// Redirect on the server, so /dashboard doesn't render a spinner page first and then navigate.
export default function DashboardRedirectPage() {
  redirect("/dashboard/account");
}
