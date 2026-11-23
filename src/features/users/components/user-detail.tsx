"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, Monitor, LockKeyhole } from "lucide-react";
import {
  Heading,
  Avatar,
  Status,
  Loading,
  ErrorState,
  useDate,
} from "@/base/components/layout/common";
import { ConfirmAction } from "@/base/components/layout/confirm-action";
import { Button } from "@/base/components/ui/button";
import { Input } from "@/base/components/ui/input";
import useAdminQuery from "@/base/hooks/use-admin-query";
import { useAdmin } from "@/base/providers/providers";
import { request } from "@/base/api";
import type { User } from "@/base/lib/types";
function ProfileEditor({ user }: { user: User }) {
  const router = useRouter();
  const t = useTranslations();
  const { actor, invalidate } = useAdmin();
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const dirty =
    name.trim() !== user.name || email.trim() !== user.email || removeAvatar;
  return (
    <section className="panel">
      <h2>{t("editProfile")}</h2>
      <form
        className="form max-w-xl"
        onSubmit={(event) => {
          event.preventDefault();
          if (name.trim() && email.trim()) setConfirm(true);
        }}
      >
        <label className="form-field">
          {t("name")}
          <Input
            required
            maxLength={100}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <label className="form-field">
          {t("email")}
          <Input
            type="email"
            required
            maxLength={254}
            disabled={user.admin || actor.id === user.id}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <p className="muted small">{t("profileHint")}</p>
        {user.avatarUrl && (
          <label className="row">
            <input
              type="checkbox"
              checked={removeAvatar}
              onChange={(event) => setRemoveAvatar(event.target.checked)}
            />
            {t("removeAvatar")}
          </label>
        )}
        <div>
          <Button disabled={!dirty || !name.trim()}>{t("saveProfile")}</Button>
        </div>
      </form>
      {confirm && (
        <ConfirmAction
          title={t("saveProfile")}
          hint={email.trim() !== user.email ? t("profileHint") : undefined}
          onClose={() => setConfirm(false)}
          onConfirm={async (reason) => {
            await request("PATCH", "/admin/users/" + user.id, {
              name: name.trim(),
              email: email.trim(),
              removeAvatar,
              reason,
            });
            invalidate();
            if (actor.id === user.id) router.refresh();
          }}
        />
      )}
    </section>
  );
}
export function UserDetail({ id }: { id: string }) {
  const t = useTranslations();
  const date = useDate();
  const query = useAdminQuery<User>("users/" + id);
  const { actor, invalidate } = useAdmin();
  const [confirm, setConfirm] = useState(false);
  const user = query.data;
  const disabled = user?.status === "DELETED" || user?.status === "BLOCKED";
  return (
    <div className="page">
      <div>
        <Button asChild variant="ghost">
          <Link href="/users">
            <ArrowLeft size={16} />
            {t("back")}
          </Link>
        </Button>
      </div>
      <Heading title={t("account")} />
      {query.error ? (
        <ErrorState retry={query.refetch} />
      ) : !user ? (
        <Loading />
      ) : (
        <>
          <section className="panel">
            <div className="row between wrap">
              <div className="row">
                <Avatar name={user.name || user.email} url={user.avatarUrl} />
                <div className="account-copy">
                  <h2>{user.name}</h2>
                  <p className="muted">{user.email}</p>
                </div>
              </div>
              <Status value={user.status} />
            </div>
            {[
              [t("accountId"), user.id],
              [t("role"), t(user.admin ? "admin" : "member")],
              [t("authentication"), t(user.hasPassword ? "yes" : "no")],
              [t("createdAccount"), date(user.createdAt)],
              [t("updated"), date(user.updatedAt)],
              [
                t("accepted"),
                user.policiesAcceptedAt
                  ? date(user.policiesAcceptedAt)
                  : t("notAccepted"),
              ],
              [t("policyVersion"), user.policiesVersion ?? "—"],
              [t("policyLocale"), user.policiesLocale?.toUpperCase() ?? "—"],
              ...(disabled
                ? [
                    [
                      t("restoreStatus"),
                      t(
                        user.statusBeforeDeletion === "ACTIVE"
                          ? "ACTIVE"
                          : "INACTIVE",
                      ),
                    ],
                  ]
                : []),
            ].map(([label, value]) => (
              <div className="detail-pair" key={label}>
                <span className="muted">{label}</span>
                <span>{value}</span>
              </div>
            ))}
            <div className="row wrap">
              <Button asChild>
                <Link href={"/sessions?userId=" + id}>
                  <Monitor size={16} />
                  {t("manageSessions")}
                </Link>
              </Button>
              {!user.admin && actor.id !== id && (
                <Button variant="outline" onClick={() => setConfirm(true)}>
                  <LockKeyhole size={16} />
                  {t(disabled ? "unblock" : "block")}
                </Button>
              )}
            </div>
            {user.admin && <p className="muted small">{t("protected")}</p>}
          </section>
          <ProfileEditor key={JSON.stringify(user)} user={user} />
        </>
      )}
      {confirm && user && (
        <ConfirmAction
          title={t(disabled ? "unblock" : "block")}
          hint={t(disabled ? "restoreHint" : "disabledHint")}
          onClose={() => setConfirm(false)}
          onConfirm={async (reason) => {
            await request("PATCH", "/admin/users/" + id + "/status", {
              disabled: !disabled,
              reason,
            });
            invalidate();
          }}
        />
      )}
    </div>
  );
}
