import type { Metadata } from "next";
import AccountPageClient from "@/components/AccountPageClient";

export const metadata: Metadata = {
  title: "Account - Image Background Remover",
  description: "Manage your account, view usage quota, and upgrade your plan.",
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return <AccountPageClient />;
}
