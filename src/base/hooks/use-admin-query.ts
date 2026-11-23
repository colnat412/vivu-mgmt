"use client";
import useQueryGet from "./use-query-get";
import { useAdmin } from "@/base/providers/providers";
export default function useAdminQuery<T>(path: string, enabled = true) {
  const { actor, revision } = useAdmin();
  const query = useQueryGet<T>({
    queryKey: [actor.id, revision, path],
    endPoint: "/admin/" + path,
    enabled,
  });
  return { ...query, data: query.isStale ? null : query.data };
}
