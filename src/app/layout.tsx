import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Providers } from "@/base/providers/providers";
import vi from "../../messages/vi.json";
import en from "../../messages/en.json";
import "./globals.css";
export const metadata: Metadata = {
  title: { default: "Vi Vu Admin", template: "%s · Vi Vu Admin" },
  description: "Quản trị Vi Vu",
  icons: { icon: "/icon.svg", shortcut: "/favicon.ico" },
  robots: { index: false, follow: false },
};
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale =
    (await cookies()).get("admin_locale")?.value === "en" ? "en" : "vi";
  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <Providers locale={locale} messages={locale === "en" ? en : vi}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
