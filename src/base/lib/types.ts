export interface User {
  id: string;
  name: string;
  email: string;
  status: "ACTIVE" | "INACTIVE" | "DELETED" | "BLOCKED";
  avatarUrl: string | null;
  hasPassword: boolean;
  admin: boolean;
  policiesAcceptedAt: string | null;
  policiesVersion: string | null;
  policiesLocale: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  statusBeforeDeletion: string | null;
}
export interface Page<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
export interface Session {
  id: string;
  clientType: "ADMIN" | "WEB" | "PWA" | "UNKNOWN";
  browser: string;
  operatingSystem: string;
  deviceType: "DESKTOP" | "MOBILE" | "TABLET" | "UNKNOWN";
  loginMethod: "PASSWORD" | "GOOGLE" | "OTP" | "UNKNOWN";
  createdAt: string;
  lastRefreshedAt: string | null;
  expiresAt: string;
  endedAt: string | null;
  status: "ACTIVE" | "LOGGED_OUT" | "REVOKED" | "EXPIRED" | "ENDED" | "FAILED";
  current: boolean;
}
export interface Sessions extends Page<Session> {
  user: User;
  activeCount: number;
  currentSessionActive: boolean;
}
export interface Overview {
  users: number;
  activeUsers: number;
  pendingUsers: number;
  disabledUsers: number;
}
export interface RecentLogin {
  id: string;
  userId: string | null;
  name: string | null;
  email: string | null;
  clientType: Session["clientType"];
  browser: string;
  operatingSystem: string;
  deviceType: Session["deviceType"];
  loginMethod: Session["loginMethod"];
  signedInAt: string;
  outcome: "SUCCESS" | "FAILED";
}
export interface Audit {
  id: string;
  actor: string;
  action: string;
  target: string;
  reason: string;
  outcome: string;
  createdAt: string;
}
export interface Settings {
  consoleName: string;
  supportEmail: string;
  sessionWarningMinutes: number;
  version: number;
  providers: { name: string; configured: boolean }[];
}
