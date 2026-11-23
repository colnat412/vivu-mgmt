"use client";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  Users,
  UserCheck,
  Clock3,
  UserRoundX,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/base/components/ui/button";
import {
  Heading,
  Loading,
  ErrorState,
  Empty,
} from "@/base/components/layout/common";
import useAdminQuery from "@/base/hooks/use-admin-query";
import type { Overview, Audit, Page } from "@/base/lib/types";
import { AuditTable } from "@/features/audit/components/audit-screen";
export function OverviewScreen() {
  const t = useTranslations();
  const overview = useAdminQuery<Overview>("overview");
  const audit = useAdminQuery<Page<Audit>>("audit?page=0&size=5");
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
      <section className="panel">
        <div className="row between wrap">
          <div className="row">
            <span className="stat-icon">
              <ShieldCheck size={22} />
            </span>
            <div className="stack gap-1">
              <h2>{t("quickActions")}</h2>
            </div>
          </div>
          <Button asChild>
            <Link href="/users">
              {t("openUsers")}
              <ArrowUpRight size={17} />
            </Link>
          </Button>
        </div>
      </section>
      <section className="panel table-panel">
        <div className="table-tools between">
          <h2>{t("recentActivity")}</h2>
          <Button size="sm" variant="ghost" asChild>
            <Link href="/audit">
              {t("viewAll")}
              <ArrowUpRight size={15} />
            </Link>
          </Button>
        </div>
        {audit.error ? (
          <ErrorState retry={audit.refetch} />
        ) : !audit.data ? (
          <Loading />
        ) : audit.data.items.length ? (
          <AuditTable items={audit.data.items} />
        ) : (
          <Empty message={t("noAudit")} />
        )}
      </section>
    </div>
  );
}
