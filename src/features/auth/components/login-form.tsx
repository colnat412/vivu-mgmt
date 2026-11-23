"use client";
import { navigateAfterAuth } from "@/base/lib/auth-navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Button } from "@/base/components/ui/button";
import { Input } from "@/base/components/ui/input";
import { Brand, Preferences, Pending } from "@/base/components/layout/common";
import useMutationRequest from "@/base/hooks/use-mutation-request";
import { request } from "@/base/api";
export function LoginForm() {
  const t = useTranslations();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const mutation = useMutationRequest({
    mutationKey: ["login"],
    mutationFn: (body: { email: string; password: string }) =>
      request("POST", "/auth/login", body),
    options: { onSuccess: () => navigateAfterAuth("/") },
  });
  return (
    <div className="login">
      <div className="login-form-wrap">
        <div className="login-form">
          <div className="row between">
            <Brand />
            <Preferences />
          </div>
          <h1>{t("loginTitle")}</h1>
          <form
            className="form"
            onSubmit={(event) => {
              event.preventDefault();
              mutation.mutate({ email: email.trim(), password });
            }}
          >
            <label className="form-field">
              {t("email")}
              <Input
                type="email"
                autoComplete="username"
                required
                maxLength={254}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={mutation.isPending}
              />
            </label>
            <label className="form-field">
              {t("password")}
              <Input
                type="password"
                autoComplete="current-password"
                required
                maxLength={256}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={mutation.isPending}
              />
            </label>
            {mutation.error && (
              <p className="error-text" role="alert">
                {t(
                  mutation.error.status === 503
                    ? "unavailable"
                    : mutation.error.message.includes("POLICY")
                      ? "policyError"
                      : "loginError",
                )}
              </p>
            )}
            <Button
              size="lg"
              disabled={!email.trim() || !password || mutation.isPending}
            >
              {mutation.isPending ? <Pending /> : <ArrowRight size={17} />}
              {t(mutation.isPending ? "loggingIn" : "login")}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
