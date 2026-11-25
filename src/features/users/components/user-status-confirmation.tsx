"use client";

import { useTranslations } from "next-intl";
import { ConfirmAction } from "@/base/components/layout/confirm-action";
import { useAdmin } from "@/base/providers/providers";
import { request } from "@/base/api";
import type { User } from "@/base/lib/types";
import { canChangeUserStatus, isUserDisabled } from "../lib/user-actions";

export function UserStatusConfirmation({
  user,
  onClose,
  onCloseAutoFocus,
}: {
  user: User;
  onClose: () => void;
  onCloseAutoFocus?: (event: Event) => void;
}) {
  const t = useTranslations();
  const { actor, invalidate } = useAdmin();
  if (!canChangeUserStatus(user, actor.id)) return null;
  const disabled = isUserDisabled(user);
  return (
    <ConfirmAction
      title={`${t(disabled ? "unblock" : "block")} · ${user.email}`}
      hint={t(disabled ? "restoreHint" : "disabledHint")}
      onClose={onClose}
      onCloseAutoFocus={onCloseAutoFocus}
      onConfirm={async (reason) => {
        await request("PATCH", "/admin/users/" + user.id + "/status", {
          disabled: !disabled,
          reason,
        });
        invalidate();
      }}
    />
  );
}
