import type { ChatMode } from "../types/chat.js";

export type Role = "consumer" | "clinician" | "admin";

export const roleByMode: Record<ChatMode, Role[]> = {
  consumer: ["consumer", "clinician", "admin"],
  clinician: ["clinician", "admin"]
};

export function isRoleAllowedForMode(args: {
  role?: Role;
  mode: ChatMode;
}): boolean {
  if (!args.role) return false;
  return roleByMode[args.mode]?.includes(args.role) ?? false;
}

