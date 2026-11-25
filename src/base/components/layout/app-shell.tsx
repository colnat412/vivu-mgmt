"use client";
import { navigateAfterAuth } from "@/base/lib/auth-navigation";
import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  Users,
  Settings,
  ScrollText,
  LogOut,
  Menu,
} from "lucide-react";
import { toast } from "@/base/components/ui/toast";
import { Brand, Preferences, Avatar, Pending } from "./common";
import { Button } from "@/base/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/base/components/ui/dialog";
import { useAdmin } from "@/base/providers/providers";
import useAdminQuery from "@/base/hooks/use-admin-query";
import useMutationRequest from "@/base/hooks/use-mutation-request";
import { request } from "@/base/api";
import type { Settings as AdminSettings } from "@/base/lib/types";
const navigation = [
  ["/", "overview", LayoutDashboard],
  ["/users", "users", Users],
  ["/settings", "settings", Settings],
  ["/audit", "audit", ScrollText],
] as const;
export function AppShell({ children }: { children: ReactNode }) {
  const t = useTranslations();
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/"
      : pathname.startsWith(href) ||
        (href === "/users" && pathname === "/sessions");
  const { actor } = useAdmin();
  const [open, setOpen] = useState(false);
  const settings = useAdminQuery<AdminSettings>("settings");
  const logout = useMutationRequest({
    mutationKey: ["logout"],
    mutationFn: () => request("POST", "/auth/logout"),
    options: {
      onSuccess: () => navigateAfterAuth("/login"),
      onError: () => {
        toast.error(t("failed"));
      },
    },
  });
  const nav = (
    <nav aria-label={t("menu")}>
      {navigation.map(([href, key, Icon]) => (
        <Link
          key={href}
          href={href}
          className="nav-link"
          data-active={isActive(href)}
          aria-current={isActive(href) ? "page" : undefined}
          onClick={() => setOpen(false)}
        >
          <Icon size={19} />
          {t(key)}
        </Link>
      ))}
    </nav>
  );
  return (
    <div className="shell">
      <aside className="sidebar desktop-only">
        <Brand />
        {nav}
        <div className="grow" />
        {settings.data?.supportEmail && (
          <a
            className="small p-3"
            href={`mailto:${settings.data.supportEmail}`}
          >
            {t("support")}
          </a>
        )}
      </aside>
      <div className="shell-main">
        <header className="topbar">
          <div className="row grow">
            <Button
              className="mobile-only"
              size="icon"
              variant="ghost"
              onClick={() => setOpen(true)}
              aria-label={t("menu")}
            >
              <Menu />
            </Button>
            <span className="font-semibold topbar-title">
              {settings.data?.consoleName ?? t("brand")}
            </span>
          </div>
          <div className="row">
            <Preferences />
            <span className="h-6 w-px bg-border" />
            <div className="row">
              <Avatar name={actor.name || actor.email} url={actor.avatarUrl} />
              <div className="account-copy account-email">
                <p className="font-semibold small">{actor.name}</p>
                <p className="muted small">{actor.email}</p>
              </div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              aria-label={t("logout")}
              disabled={logout.isPending}
              onClick={() => logout.mutate(undefined)}
            >
              {logout.isPending ? <Pending /> : <LogOut size={18} />}
            </Button>
          </div>
        </header>
        <main className="content">{children}</main>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="flex flex-col gap-8"
          aria-describedby={undefined}
        >
          <DialogTitle className="sr-only">{t("brand")}</DialogTitle>
          <Brand />
          {nav}
        </DialogContent>
      </Dialog>
    </div>
  );
}
