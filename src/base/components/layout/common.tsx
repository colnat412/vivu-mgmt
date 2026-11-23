"use client";
import Image from "next/image";
import { useState, useSyncExternalStore } from "react";
import { paginationItems } from "@/base/lib/pagination";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Inbox,
  LoaderCircle,
  Languages,
  Sun,
  Moon,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/base/components/ui/button";
import { Input } from "@/base/components/ui/input";
import { Skeleton } from "@/base/components/ui/skeleton";
import type { Page } from "@/base/lib/types";
export function Brand() {
  return (
    <div className="brand">
      <Image src="/icon.svg" width={38} height={38} alt="" priority />
      <span>
        Vi Vu<span className="muted small"> ADMIN</span>
      </span>
    </div>
  );
}
export function Preferences() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <div className="row">
      <Button
        size="icon"
        variant="ghost"
        aria-label={t("theme")}
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      >
        <Sun className="hidden dark:block" />
        <Moon className="dark:hidden" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        aria-label={t("language")}
        onClick={() => {
          document.cookie = `admin_locale=${locale === "vi" ? "en" : "vi"};path=/;max-age=31536000;SameSite=Lax`;
          router.refresh();
        }}
      >
        <Languages size={16} />
        {locale.toUpperCase()}
      </Button>
    </div>
  );
}
export function Heading({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="page-heading">
      <h1>{title}</h1>
      {hint && <p className="muted">{hint}</p>}
    </div>
  );
}
export function Loading() {
  const t = useTranslations();
  return (
    <div className="stack" role="status" aria-label={t("loading")}>
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-44 w-full" />
    </div>
  );
}
export function ErrorState({ retry }: { retry: () => unknown }) {
  const t = useTranslations();
  return (
    <div className="state" role="alert">
      <AlertCircle size={28} />
      <p>{t("error")}</p>
      <Button
        variant="outline"
        onClick={() => void Promise.resolve(retry()).catch(() => undefined)}
      >
        {t("retry")}
      </Button>
    </div>
  );
}
export function Empty({ message }: { message?: string }) {
  const t = useTranslations();
  return (
    <div className="state">
      <Inbox size={32} className="muted" />
      <p className="muted">{message ?? t("empty")}</p>
    </div>
  );
}
export function Status({ value }: { value: string }) {
  const t = useTranslations();
  return (
    <span className="status" data-status={value}>
      {t.has(value) ? t(value) : value}
    </span>
  );
}
export function Avatar({ name, url }: { name: string; url?: string | null }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  return (
    <span className="avatar">
      {url && url !== failedUrl && /^https?:\/\//.test(url) ? (
        <Image
          src={url}
          onError={() => setFailedUrl(url)}
          alt=""
          unoptimized
          width={38}
          height={38}
        />
      ) : (
        name.trim().slice(0, 2).toUpperCase()
      )}
    </span>
  );
}
export function SearchField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const t = useTranslations();
  return (
    <div className="search-box">
      <Search size={17} className="muted" />
      <Input
        value={value}
        maxLength={100}
        onChange={(event) => onChange(event.target.value)}
        placeholder={t("search")}
        aria-label={t("search")}
      />
    </div>
  );
}
function subscribePaginationWidth(callback: () => void) {
  const compact = window.matchMedia("(max-width: 480px)");
  const narrow = window.matchMedia("(max-width: 359px)");
  compact.addEventListener("change", callback);
  narrow.addEventListener("change", callback);
  return () => {
    compact.removeEventListener("change", callback);
    narrow.removeEventListener("change", callback);
  };
}
function paginationBoundary() {
  return window.matchMedia("(max-width: 359px)").matches
    ? 0
    : window.matchMedia("(max-width: 480px)").matches
      ? 1
      : 2;
}
export function Pagination({
  data,
  onPage,
  onPageSize,
}: {
  data: Page<unknown>;
  onPage: (page: number) => void;
  onPageSize?: (size: number) => void;
}) {
  const t = useTranslations();
  const boundary = useSyncExternalStore(
    subscribePaginationWidth,
    paginationBoundary,
    () => 2,
  );
  const total = Math.max(1, data.totalPages);
  const current = Math.min(total, Math.max(1, data.page + 1));
  const from = data.totalElements === 0 ? 0 : data.page * data.size + 1;
  const to = Math.min(data.totalElements, (data.page + 1) * data.size);
  return (
    <div className="table-footer paging-footer">
      <div className="paging-summary">
        <span className="muted small">
          {t("displayedRows", { from, to, total: data.totalElements })}
        </span>
        {onPageSize && (
          <label className="paging-size">
            <span>{t("rowsPerPage")}</span>
            <select
              className="select"
              aria-label={t("rowsPerPage")}
              value={data.size}
              onChange={(event) => {
                onPageSize(Number(event.target.value));
                onPage(0);
              }}
            >
              {[5, 10, 20, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <nav aria-label={t("pagination")}>
        <ul className="paging-list">
          <li>
            <button
              type="button"
              className="paging-item"
              disabled={current === 1}
              aria-label={t("previous")}
              onClick={() => onPage(current - 2)}
            >
              <span className="paging-face">
                <ChevronLeft size={18} />
              </span>
            </button>
          </li>
          {paginationItems(current, total, boundary).map((item) => (
            <li key={item}>
              {typeof item === "number" ? (
                <button
                  type="button"
                  className="paging-item"
                  aria-label={t("goToPage", { page: item })}
                  aria-current={current === item ? "page" : undefined}
                  onClick={() => onPage(item - 1)}
                >
                  <span className="paging-face">{item}</span>
                </button>
              ) : (
                <span className="paging-ellipsis" aria-hidden="true">
                  …
                </span>
              )}
            </li>
          ))}
          <li>
            <button
              type="button"
              className="paging-item"
              disabled={current === total}
              aria-label={t("next")}
              onClick={() => onPage(current)}
            >
              <span className="paging-face">
                <ChevronRight size={18} />
              </span>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}
export function Pending() {
  return <LoaderCircle size={16} className="animate-spin" />;
}
export function useDate() {
  const locale = useLocale();
  return (date: string | null) =>
    date
      ? new Intl.DateTimeFormat(locale, {
          dateStyle: "medium",
          timeStyle: "short",
          timeZone: "Asia/Ho_Chi_Minh",
        }).format(new Date(date))
      : "—";
}
