import { redirect } from "next/navigation";

export default function AdminDashboardIndexPage() {
  redirect("/dashboard/admin/accounts");
}
