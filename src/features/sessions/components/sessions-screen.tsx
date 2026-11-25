"use client";
import { navigateAfterAuth } from "@/base/lib/auth-navigation";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Monitor,
  Smartphone,
  Tablet,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/base/components/ui/button";
import {
  Heading,
  Avatar,
  Loading,
  ErrorState,
  Empty,
  SearchField,
  Status,
  Pagination,
  useDate,
} from "@/base/components/layout/common";
import { ConfirmAction } from "@/base/components/layout/confirm-action";
import { useAdmin } from "@/base/providers/providers";
import useAdminQuery from "@/base/hooks/use-admin-query";
import useUsers from "@/features/users/hooks/use-users";
import type { Sessions, Settings } from "@/base/lib/types";
import { request } from "@/base/api";
function UserPicker() {
  const t = useTranslations();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const query = useUsers(search);
  return (
    <section className="panel">
      <h2>{t("pickUser")}</h2>
      <SearchField value={search} onChange={setSearch} />
      {query.error ? (
        <ErrorState retry={query.refetch} />
      ) : !query.data ? (
        <Loading />
      ) : !query.data.items.length ? (
        <Empty message={t("noUsers")} />
      ) : (
        <div className="stack gap-2">
          {query.data.items.map((user) => (
            <Button
              key={user.id}
              variant="ghost"
              className="h-auto justify-start p-3"
              onClick={() => router.push("/sessions?userId=" + user.id)}
            >
              <Avatar name={user.name || user.email} />
              <div className="grow text-left">
                <p>{user.name}</p>
                <p className="muted small">{user.email}</p>
              </div>
              <Status value={user.status} />
              <ArrowRight size={16} />
            </Button>
          ))}
        </div>
      )}
    </section>
  );
}
function SessionList({ id }: { id: string }) {
  const t = useTranslations();
  const date = useDate();
  const router = useRouter();
  const { invalidate } = useAdmin();
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const query = useAdminQuery<Sessions>(
    "users/" + id + "/sessions?page=" + page + "&size=" + size,
  );
  const settings = useAdminQuery<Settings>("settings");
  const [action, setAction] = useState<{
    sid?: string;
    current: boolean;
  } | null>(null);
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const data = query.data;
  return (
    <>
      <section className="panel table-panel">
        {query.error ? (
          <ErrorState retry={query.refetch} />
        ) : !data ? (
          <Loading />
        ) : (
          <>
            <div className="table-tools between">
              <div className="row">
                <Avatar name={data.user.name || data.user.email} />
                <div>
                  <h2>{data.user.name}</h2>
                  <p className="muted small">
                    {data.user.email} ·{" "}
                    {t("sessionCount", { total: data.activeCount })} ·{" "}
                    {t("sessionHistoryCount", { total: data.totalElements })}
                  </p>
                </div>
              </div>
              <div className="row wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void query.refetch().catch(() => undefined)}
                  aria-label={t("refreshSessions")}
                >
                  <RefreshCw size={15} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/users")}
                >
                  {t("changeUser")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!data.activeCount}
                  onClick={() =>
                    setAction({
                      current: data.currentSessionActive,
                    })
                  }
                >
                  {t("revokeAll")}
                </Button>
              </div>
            </div>
            {!data.items.length ? (
              <Empty message={t("noSessions")} />
            ) : (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      {[
                        "sessionDevice",
                        "sessionClient",
                        "sessionState",
                        "created",
                        "sessionRefreshed",
                        "expires",
                        "sessionEnded",
                        "actions",
                      ].map((key) => (
                        <th key={key}>{t(key)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((session) => (
                      <tr key={session.id}>
                        <td>
                          <div className="row">
                            {session.deviceType === "MOBILE" ? (
                              <Smartphone size={17} className="muted" />
                            ) : session.deviceType === "TABLET" ? (
                              <Tablet size={17} className="muted" />
                            ) : (
                              <Monitor size={17} className="muted" />
                            )}
                            <div className="stack gap-1">
                              <span>
                                {session.browser === "Unknown"
                                  ? t("sessionUnknown")
                                  : session.browser}{" "}
                                ·{" "}
                                {session.operatingSystem === "Unknown"
                                  ? t("sessionUnknown")
                                  : session.operatingSystem}
                              </span>
                              <span
                                title={session.id}
                                className="mono muted small"
                              >
                                {session.id.slice(0, 8)}…{session.id.slice(-4)}
                              </span>
                            </div>
                            {session.current && (
                              <span className="status">{t("current")}</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="stack gap-1">
                            <span>
                              {t("sessionClient" + session.clientType)}
                            </span>
                            <span className="muted small">
                              {t("sessionMethod" + session.loginMethod)}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className="status" data-status={session.status}>
                            {t("sessionState" + session.status)}
                          </span>
                        </td>
                        <td>{date(session.createdAt)}</td>
                        <td>{date(session.lastRefreshedAt)}</td>
                        <td>
                          <div className="stack gap-1">
                            <span>{date(session.expiresAt)}</span>
                            {settings.data &&
                              session.status === "ACTIVE" &&
                              now !== null &&
                              new Date(session.expiresAt).getTime() - now <
                                settings.data.sessionWarningMinutes * 60000 && (
                                <span className="small text-amber-500">
                                  {t("expiring")}
                                </span>
                              )}
                          </div>
                        </td>
                        <td>{date(session.endedAt)}</td>
                        <td>
                          {session.status === "ACTIVE" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setAction({
                                  sid: session.id,
                                  current: session.current,
                                })
                              }
                            >
                              {t("revoke")}
                            </Button>
                          ) : (
                            <span className="muted">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <Pagination
              data={data}
              onPage={setPage}
              onPageSize={(next) => {
                setSize(next);
                setPage(0);
              }}
            />
          </>
        )}
      </section>
      {action && (
        <ConfirmAction
          title={t(action.sid ? "revoke" : "revokeAll")}
          hint={t("revokeHint")}
          onClose={() => setAction(null)}
          onConfirm={async (reason) => {
            await request(
              "POST",
              "/admin/users/" +
                id +
                "/sessions/" +
                (action.sid ? action.sid + "/" : "") +
                "revoke",
              { reason },
            );
            if (action.current) navigateAfterAuth("/login");
            else invalidate();
          }}
        />
      )}
    </>
  );
}
export function SessionsScreen({ userId }: { userId?: string }) {
  const t = useTranslations();
  return (
    <div className="page">
      <Heading title={t("sessions")} />
      {userId ? <SessionList key={userId} id={userId} /> : <UserPicker />}
    </div>
  );
}
