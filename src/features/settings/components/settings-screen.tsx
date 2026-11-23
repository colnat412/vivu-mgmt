"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, CircleDashed } from "lucide-react";
import { Button } from "@/base/components/ui/button";
import { Input } from "@/base/components/ui/input";
import { Heading, Loading, ErrorState } from "@/base/components/layout/common";
import { ConfirmAction } from "@/base/components/layout/confirm-action";
import useAdminQuery from "@/base/hooks/use-admin-query";
import { useAdmin } from "@/base/providers/providers";
import { request } from "@/base/api";
import type { Settings } from "@/base/lib/types";
function SettingsForm({ value }: { value: Settings }) {
  const t = useTranslations();
  const { invalidate } = useAdmin();
  const [name, setName] = useState(value.consoleName);
  const [email, setEmail] = useState(value.supportEmail);
  const [warning, setWarning] = useState(String(value.sessionWarningMinutes));
  const [confirm, setConfirm] = useState(false);
  const dirty =
    name !== value.consoleName ||
    email !== value.supportEmail ||
    Number(warning) !== value.sessionWarningMinutes;
  return (
    <>
      <section className="panel">
        <div className="row between">
          <h2>{t("general")}</h2>
          <span className="muted small">
            {t("version", { version: value.version })}
          </span>
        </div>
        <form
          className="form max-w-xl"
          onSubmit={(event) => {
            event.preventDefault();
            if (name.trim() && Number(warning) >= 1 && Number(warning) <= 1440)
              setConfirm(true);
          }}
        >
          <label className="form-field">
            {t("consoleName")}
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              maxLength={80}
            />
          </label>
          <label className="form-field">
            {t("supportEmail")}
            <Input
              type="email"
              maxLength={254}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label className="form-field">
            {t("warning")}
            <Input
              type="number"
              min={1}
              max={1440}
              step={1}
              required
              value={warning}
              onChange={(event) => setWarning(event.target.value)}
            />
          </label>
          <div>
            <Button disabled={!dirty || !name.trim()}>
              {t("saveSettings")}
            </Button>
          </div>
        </form>
      </section>
      <section className="panel">
        <div className="stack gap-2">
          <h2>{t("providers")}</h2>
        </div>
        {value.providers.map((provider) => (
          <div key={provider.name} className="row between">
            <span className="font-medium">{provider.name}</span>
            <span className="row small muted">
              {provider.configured ? (
                <CheckCircle2 size={16} className="text-emerald-500" />
              ) : (
                <CircleDashed size={16} />
              )}
              {t(provider.configured ? "configured" : "notConfigured")}
            </span>
          </div>
        ))}
      </section>
      {confirm && (
        <ConfirmAction
          title={t("saveSettings")}
          onClose={() => setConfirm(false)}
          onConfirm={async (reason) => {
            await request("PUT", "/admin/settings", {
              consoleName: name.trim(),
              supportEmail: email.trim(),
              sessionWarningMinutes: Number(warning),
              version: value.version,
              reason,
            });
            invalidate();
          }}
        />
      )}
    </>
  );
}
export function SettingsScreen() {
  const t = useTranslations();
  const query = useAdminQuery<Settings>("settings");
  return (
    <div className="page">
      <Heading title={t("settings")} />
      {query.error ? (
        <ErrorState retry={query.refetch} />
      ) : !query.data ? (
        <Loading />
      ) : (
        <SettingsForm key={query.data.version} value={query.data} />
      )}
    </div>
  );
}
