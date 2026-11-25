import type { User } from "@/base/lib/types";

export function isUserDisabled(user: User) {
  return user.status === "DELETED" || user.status === "BLOCKED";
}

export function canChangeUserStatus(user: User, actorId: string) {
  return !user.admin && user.id !== actorId;
}
