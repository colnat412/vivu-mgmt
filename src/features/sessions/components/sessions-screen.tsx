"use client";
import { navigateAfterAuth } from "@/base/lib/auth-navigation";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Monitor, ArrowRight } from "lucide-react";
import { Button } from "@/base/components/ui/button";
import {
  Heading,
  Avatar,
  Loading,
  ErrorState,
  Empty,
  SearchField,
  Status,
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
  const query = useAdminQuery<Sessions>("users/" + id + "/sessions");
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
                    {t("sessionCount", { total: data.items.length })}
                  </p>
                </div>
              </div>
              <div className="row wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/sessions")}
                >
                  {t("changeUser")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!data.items.length}
                  onClick={() =>
                    setAction({
                      current: data.items.some((session) => session.current),
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
                      {["sessionId", "created", "expires", "actions"].map(
                        (key) => (
                          <th key={key}>{t(key)}</th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((session) => (
                      <tr key={session.id}>
                        <td>
                          <div className="row">
                            <Monitor size={17} className="muted" />
                            <span title={session.id} className="mono">
                              {session.id.slice(0, 8)}…{session.id.slice(-4)}
                            </span>
                            {session.current && (
                              <span className="status">{t("current")}</span>
                            )}
                          </div>
                        </td>
                        <td>{date(session.createdAt)}</td>
                        <td>
                          <div className="stack gap-1">
                            <span>{date(session.expiresAt)}</span>
                            {settings.data &&
                              now !== null &&
                              new Date(session.expiresAt).getTime() - now <
                                settings.data.sessionWarningMinutes * 60000 && (
                                <span className="small text-amber-500">
                                  {t("expiring")}
                                </span>
                              )}
                          </div>
                        </td>
                        <td>
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
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
