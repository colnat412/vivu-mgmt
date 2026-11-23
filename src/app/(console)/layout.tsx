import { redirect } from "next/navigation";
import { currentAdmin } from "@/base/api/server";
import { AdminProvider } from "@/base/providers/providers";
import { AppShell } from "@/base/components/layout/app-shell";
export default async function ConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const identity = await currentAdmin();
  if (identity.status !== 200)
    redirect(
      identity.status === 401 && identity.refresh
        ? "/api/auth/refresh"
        : "/login",
    );
  return (
    <AdminProvider actor={identity.data}>
      <AppShell>{children}</AppShell>
    </AdminProvider>
  );
}
