"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Monitor, Smartphone, Tablet, RefreshCw } from "lucide-react";
import { Button } from "@/base/components/ui/button";
import {
  Loading,
  ErrorState,
  Empty,
  Pagination,
  Status,
  SearchField,
  useDate,
} from "@/base/components/layout/common";
import useAdminQuery from "@/base/hooks/use-admin-query";
import useDebouncedValue from "@/base/hooks/use-debounced-value";
import type { RecentLogin, Page } from "@/base/lib/types";

export function RecentLogins() {
  const t = useTranslations();
  const date = useDate();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const q = useDebouncedValue(search.trim(), 300);
  const query = useAdminQuery<Page<RecentLogin>>(
    "login-history?" + new URLSearchParams({ page: String(page), q }),
  );
  return (
    <section className="panel table-panel">
      <div className="table-tools">
        <div className="flex w-full flex-col gap-3">
          <div className="row between">
            <h2>{t("recentLogins")}</h2>
            <Button
              variant="outline"
              size="icon"
              aria-label={t("refreshSessions")}
              onClick={() => void query.refetch().catch(() => undefined)}
            >
              <RefreshCw size={16} />
            </Button>
          </div>
          <SearchField
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(0);
            }}
          />
        </div>
      </div>
      {query.error ? (
        <ErrorState retry={query.refetch} />
      ) : !query.data ? (
        <Loading />
      ) : !query.data.items.length ? (
        <Empty message={t("noRecentLogins")} />
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                {[
                  "name",
                  "time",
                  "sessionDevice",
                  "sessionClient",
                  "outcome",
                  "actions",
                ].map((key) => (
                  <th key={key}>{t(key)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {query.data.items.map((login) => (
                <tr key={login.id}>
                  <td>
                    <div className="stack gap-1">
                      {login.userId ? (
                        <Link
                          className="font-semibold"
                          href={"/users/" + login.userId}
                        >
                          {login.name || login.email}
                        </Link>
                      ) : (
                        <span>{t("sessionUnknown")}</span>
                      )}
                      <span className="muted small">{login.email || "—"}</span>
                    </div>
                  </td>
                  <td>{date(login.signedInAt)}</td>
                  <td>
                    <div className="row">
                      {login.deviceType === "MOBILE" ? (
                        <Smartphone size={17} className="muted" />
                      ) : login.deviceType === "TABLET" ? (
                        <Tablet size={17} className="muted" />
                      ) : (
                        <Monitor size={17} className="muted" />
                      )}
                      <span>
                        {login.browser === "Unknown"
                          ? t("sessionUnknown")
                          : login.browser}{" "}
                        ·{" "}
                        {login.operatingSystem === "Unknown"
                          ? t("sessionUnknown")
                          : login.operatingSystem}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="stack gap-1">
                      <span>{t("sessionClient" + login.clientType)}</span>
                      <span className="muted small">
                        {t("sessionMethod" + login.loginMethod)}
                      </span>
                    </div>
                  </td>
                  <td>
                    <Status value={login.outcome} />
                  </td>
                  <td>
                    {login.userId ? (
                      <Button asChild variant="ghost" size="sm">
                        <Link
                          href={
                            "/sessions?userId=" +
                            encodeURIComponent(login.userId)
                          }
                        >
                          {t("manageSessions")}
                        </Link>
                      </Button>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {query.data && <Pagination data={query.data} onPage={setPage} />}
    </section>
  );
}
