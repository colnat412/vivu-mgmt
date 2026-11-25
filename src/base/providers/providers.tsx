"use client";
import { createContext, useContext, useState, type ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/base/components/ui/toast";
import type { User } from "@/base/lib/types";
const AdminContext = createContext<{
  actor: User;
  revision: number;
  invalidate: () => void;
} | null>(null);
export function AdminProvider({
  actor,
  children,
}: {
  actor: User;
  children: ReactNode;
}) {
  const [revision, setRevision] = useState(0);
  return (
    <AdminContext.Provider
      value={{
        actor,
        revision,
        invalidate: () => setRevision((value) => value + 1),
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}
export function useAdmin() {
  const value = useContext(AdminContext);
  if (!value) throw new Error("AdminProvider missing");
  return value;
}
export function Providers({
  locale,
  messages,
  children,
}: {
  locale: string;
  messages: Record<string, string>;
  children: ReactNode;
}) {
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      timeZone="Asia/Ho_Chi_Minh"
    >
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
        <Toaster />
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}
