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
  userId: string;
  createdAt: string;
  expiresAt: string;
  current: boolean;
}
export interface Sessions {
  user: User;
  items: Session[];
}
export interface Overview {
  users: number;
  activeUsers: number;
  pendingUsers: number;
  disabledUsers: number;
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
