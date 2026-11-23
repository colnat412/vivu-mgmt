import { navigateAfterAuth } from "@/base/lib/auth-navigation";
import axios, { type AxiosRequestConfig } from "axios";
export type QueryKey = readonly unknown[];
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number | null,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
export function normalizeApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (axios.isAxiosError(error))
    return new ApiError(
      error.response?.data?.message || "REQUEST_FAILED",
      error.response?.status ?? null,
    );
  return new ApiError("REQUEST_FAILED", null);
}
export const api = axios.create({
  baseURL: "/api",
  timeout: 20000,
  withCredentials: true,
});
let refreshing: Promise<unknown> | null = null;
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    if (
      error.response?.status === 401 &&
      config &&
      !config._retried &&
      config.url?.startsWith("/admin/")
    ) {
      config._retried = true;
      try {
        refreshing ??= axios.post("/api/auth/refresh").finally(() => {
          refreshing = null;
        });
        await refreshing;
        return await api.request(config);
      } catch {
        navigateAfterAuth("/login");
      }
    }
    throw normalizeApiError(error);
  },
);
export async function axiosGet<T>(
  path: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  return (await api.get(path, config)).data.data;
}
export async function request<T>(
  method: string,
  path: string,
  data?: unknown,
): Promise<T> {
  return (await api.request({ method, url: path, data })).data.data;
}
