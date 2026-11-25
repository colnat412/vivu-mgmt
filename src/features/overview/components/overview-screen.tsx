"use client";
import { useTranslations } from "next-intl";
import { Users, UserCheck, Clock3, UserRoundX } from "lucide-react";
import { Heading, Loading, ErrorState } from "@/base/components/layout/common";
import useAdminQuery from "@/base/hooks/use-admin-query";
import type { Overview } from "@/base/lib/types";
import { RecentLogins } from "@/features/sessions/components/recent-logins";
export function OverviewScreen() {
  const t = useTranslations();
  const overview = useAdminQuery<Overview>("overview");
  const cards = [
    ["total", "users", Users],
    ["active", "activeUsers", UserCheck],
    ["pending", "pendingUsers", Clock3],
    ["blocked", "disabledUsers", UserRoundX],
  ] as const;
  return (
    <div className="page">
      <Heading title={t("overview")} />
      {overview.error ? (
        <section className="panel">
          <ErrorState retry={overview.refetch} />
        </section>
      ) : !overview.data ? (
        <Loading />
      ) : (
        <div className="stats">
          {cards.map(([label, key, Icon]) => (
            <section className="panel stat" key={key}>
              <div className="row between">
                <span className="muted small">{t(label)}</span>
                <span className="stat-icon">
                  <Icon size={20} />
                </span>
              </div>
              <span className="stat-number">
                {overview.data![key].toLocaleString()}
              </span>
            </section>
          ))}
        </div>
      )}
      <RecentLogins />
    </div>
  );
}
