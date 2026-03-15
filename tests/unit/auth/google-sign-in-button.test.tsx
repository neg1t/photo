import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { signInMock } = vi.hoisted(() => ({
  signInMock: vi.fn(),
}));

vi.mock("next-auth/react", () => ({
  signIn: signInMock,
}));

import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";

describe("GoogleSignInButton", () => {
  beforeEach(() => {
    signInMock.mockReset();
    signInMock.mockResolvedValue(undefined);
  });

  it("starts Google OAuth via signIn and shows a loading state", async () => {
    const user = userEvent.setup();

    render(<GoogleSignInButton callbackUrl="/dashboard" />);

    await user.click(
      screen.getByRole("button", { name: "Продолжить через Google" }),
    );

    expect(signInMock).toHaveBeenCalledWith("google", {
      callbackUrl: "/dashboard",
    });
    expect(
      screen.getByRole("button", { name: "Переходим в Google..." }),
    ).toBeDisabled();
  });
});
