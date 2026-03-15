import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  getServerAuthSession: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/env", () => ({
  env: {
    auth: {
      isGoogleConfigured: true,
    },
  },
}));

import LoginPage from "@/app/login/page";

describe("LoginPage", () => {
  it("shows a readable message for Google sign-in errors", async () => {
    const page = await LoginPage({
      searchParams: Promise.resolve({
        error: "google",
      }),
    });

    render(page);

    expect(
      screen.getByText(
        "Не удалось начать вход через Google. Повторите попытку еще раз.",
      ),
    ).toBeInTheDocument();
  });
});
