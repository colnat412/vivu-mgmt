"use client";
import useAdminQuery from "@/base/hooks/use-admin-query";
import useDebouncedValue from "@/base/hooks/use-debounced-value";
import type { User, Page } from "@/base/lib/types";
export default function useUsers(
  search: string,
  status = "",
  page = 0,
  size = 20,
) {
  const q = useDebouncedValue(search.trim(), 300);
  return useAdminQuery<Page<User>>(
    "users?" +
      new URLSearchParams({
        q,
        status,
        page: String(page),
        size: String(size),
      }),
  );
}
