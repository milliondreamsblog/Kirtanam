import { redirect } from "next/navigation";

export const metadata = {
  title: "Admin Dashboard - Spiritual Echoes",
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  await searchParams;

  redirect("/dashboard/admin/accounts");
}
