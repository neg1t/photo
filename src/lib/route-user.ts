import { getServerAuthSession } from "@/lib/auth";
import { AppError } from "@/lib/errors";

export async function requireRouteUser() {
  const session = await getServerAuthSession();

  if (!session?.user?.id || !session.user.email) {
    throw new AppError("Необходима авторизация.", 401);
  }

  return session.user;
}
