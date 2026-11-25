"use client";
import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "@/base/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/base/components/ui/dialog";
import { Button } from "@/base/components/ui/button";
import { Textarea } from "@/base/components/ui/textarea";
import { Pending } from "./common";
import { ApiError } from "@/base/api";
import useMutationRequest from "@/base/hooks/use-mutation-request";
export function ConfirmAction({
  title,
  hint,
  onClose,
  onConfirm,
  onCloseAutoFocus,
}: {
  title: string;
  hint?: string;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<unknown>;
  onCloseAutoFocus?: (event: Event) => void;
}) {
  const t = useTranslations();
  const descriptionId = useId();
  const [reason, setReason] = useState("");
  const mutation = useMutationRequest({
    mutationKey: ["confirm", title],
    mutationFn: onConfirm,
    options: {
      onSuccess: () => {
        toast.success(t("saved"));
        onClose();
      },
      onError: (error) => {
        toast.error(
          error instanceof ApiError &&
            error.message.includes("SETTINGS_CHANGED")
            ? t("settingsChanged")
            : t(
                error.message.includes("EMAIL_EXISTS")
                  ? "emailExists"
                  : error.message.includes("ADMIN_ACCOUNT_PROTECTED")
                    ? "profileConflict"
                    : "failed",
              ),
        );
      },
    },
  });
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !mutation.isPending) onClose();
      }}
    >
      <DialogContent
        onCloseAutoFocus={onCloseAutoFocus}
        aria-describedby={hint ? descriptionId : undefined}
        showCloseButton={!mutation.isPending}
        onInteractOutside={(event) => {
          if (mutation.isPending) event.preventDefault();
        }}
        onEscapeKeyDown={(event) => {
          if (mutation.isPending) event.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {hint && (
            <DialogDescription id={descriptionId}>{hint}</DialogDescription>
          )}
        </DialogHeader>
        <form
          className="form"
          onSubmit={(event) => {
            event.preventDefault();
            if (reason.trim().length >= 3) mutation.mutate(reason.trim());
          }}
        >
          <label className="form-field">
            {t("reason")}
            <Textarea
              autoFocus
              required
              minLength={3}
              maxLength={500}
              value={reason}
              disabled={mutation.isPending}
              onChange={(event) => setReason(event.target.value)}
              placeholder={t("reasonPlaceholder")}
            />
          </label>
          {mutation.error && (
            <p role="alert" className="error-text">
              {t("failed")}
            </p>
          )}
          <div className="row justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={mutation.isPending}
              onClick={onClose}
            >
              {t("cancel")}
            </Button>
            <Button disabled={mutation.isPending || reason.trim().length < 3}>
              {mutation.isPending && <Pending />}
              {t(mutation.isPending ? "saving" : "confirm")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
