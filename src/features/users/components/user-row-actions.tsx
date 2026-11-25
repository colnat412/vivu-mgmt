"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  Ellipsis,
  Pencil,
  Monitor,
  LockKeyhole,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/base/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/base/components/ui/dropdown-menu";
import { useAdmin } from "@/base/providers/providers";
import type { User } from "@/base/lib/types";
import { canChangeUserStatus, isUserDisabled } from "../lib/user-actions";
import { UserStatusConfirmation } from "./user-status-confirmation";

export function UserRowActions({ user }: { user: User }) {
  const t = useTranslations();
  const { actor } = useAdmin();
  const [confirm, setConfirm] = useState(false);
  const openingDialog = useRef(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const disabled = isUserDisabled(user);
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            ref={trigger}
            type="button"
            variant="ghost"
            size="icon"
            className="size-11"
            aria-label={t("userActions", { name: user.name || user.email })}
          >
            <Ellipsis size={18} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          onCloseAutoFocus={(event) => {
            if (openingDialog.current) event.preventDefault();
          }}
        >
          <DropdownMenuItem asChild>
            <Link href={"/users/" + user.id + "#edit-profile"}>
              <Pencil />
              {t("editUser")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={"/sessions?userId=" + encodeURIComponent(user.id)}>
              <Monitor />
              {t("manageSessions")}
            </Link>
          </DropdownMenuItem>
          {canChangeUserStatus(user, actor.id) && (
            <DropdownMenuItem
              variant={disabled ? "default" : "destructive"}
              onSelect={() => {
                openingDialog.current = true;
                setConfirm(true);
              }}
            >
              {disabled ? <RotateCcw /> : <LockKeyhole />}
              {t(disabled ? "restoreUser" : "disableUser")}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {confirm && (
        <UserStatusConfirmation
          user={user}
          onClose={() => {
            openingDialog.current = false;
            setConfirm(false);
          }}
          onCloseAutoFocus={(event) => {
            if (trigger.current) {
              event.preventDefault();
              trigger.current.focus();
            }
          }}
        />
      )}
    </>
  );
}
