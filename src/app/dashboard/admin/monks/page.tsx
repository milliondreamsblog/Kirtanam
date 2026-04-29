import { redirect } from "next/navigation";

export default function LegacyMonksPage() {
  redirect("/dashboard/admin/users");
}
