import type { AccessStatus } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      accessStatus: AccessStatus;
      username: string | null;
      isAdmin: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessStatus?: AccessStatus;
    username?: string | null;
    isAdmin?: boolean;
  }
}
