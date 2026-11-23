"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Heading,
  Loading,
  ErrorState,
  Empty,
  Status,
  Pagination,
  useDate,
} from "@/base/components/layout/common";
import useAdminQuery from "@/base/hooks/use-admin-query";
import type { Audit, Page } from "@/base/lib/types";
export function AuditTable({ items }: { items: Audit[] }) {
  const t = useTranslations();
  const date = useDate();
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            {["actor", "action", "target", "reason", "outcome", "time"].map(
              (key) => (
                <th key={key}>{t(key)}</th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.actor}</td>
              <td>{t.has(item.action) ? t(item.action) : item.action}</td>
              <td className="reason-cell">{item.target}</td>
              <td className="reason-cell">{item.reason}</td>
              <td>
                <Status value={item.outcome} />
              </td>
              <td className="small muted">{date(item.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function AuditScreen() {
  const t = useTranslations();
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const query = useAdminQuery<Page<Audit>>(
    "audit?page=" + page + "&size=" + size,
  );
  return (
    <div className="page">
      <Heading title={t("audit")} />
      <section className="panel table-panel">
        {query.error ? (
          <ErrorState retry={query.refetch} />
        ) : !query.data ? (
          <Loading />
        ) : !query.data.items.length ? (
          <Empty message={t("noAudit")} />
        ) : (
          <AuditTable items={query.data.items} />
        )}
        {query.data && (
          <Pagination data={query.data} onPage={setPage} onPageSize={setSize} />
        )}
      </section>
    </div>
  );
}
