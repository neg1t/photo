import type { AccessStatus } from "@prisma/client";

export function canManageProtectedContent(accessStatus: AccessStatus) {
  return accessStatus === "ACTIVE";
}
