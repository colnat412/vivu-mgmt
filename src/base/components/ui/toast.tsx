"use client";

import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { CircleCheck, CircleAlert, Info, TriangleAlert } from "lucide-react";
import { Toaster as SonnerToaster } from "sonner";
import "./toast.css";

export { toast } from "sonner";

export function Toaster() {
  const { resolvedTheme } = useTheme();
  const t = useTranslations();

  return (
    <SonnerToaster
      className="app-toaster"
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      position="top-right"
      closeButton
      duration={5000}
      icons={{
        success: <CircleCheck size={16} />,
        error: <CircleAlert size={16} />,
        info: <Info size={16} />,
        warning: <TriangleAlert size={16} />,
      }}
      toastOptions={{
        closeButtonAriaLabel: t("close"),
      }}
    />
  );
}
