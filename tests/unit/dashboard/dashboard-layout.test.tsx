import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireCurrentUserMock, envMock } = vi.hoisted(() => ({
  requireCurrentUserMock: vi.fn(),
  envMock: {
    auth: {
      adminEmails: ["onlygame1996@gmail.com"],
    },
  },
}));

vi.mock("@/lib/session", () => ({
  requireCurrentUser: requireCurrentUserMock,
}));

vi.mock("@/lib/env", () => ({
  env: envMock,
}));

import DashboardLayout from "@/app/dashboard/layout";

function createUser(email: string) {
  return {
    id: "user-1",
    email,
    accessStatus: "ACTIVE",
    storageUsedBytes: 1024n,
    storageLimitBytes: 2048n,
    profile: {
      firstName: "Иван",
      lastName: "Петров",
      username: "ivan",
    },
  };
}

describe("DashboardLayout", () => {
  beforeEach(() => {
    requireCurrentUserMock.mockReset();
  });

  it("hides the admin link for non-admin users", async () => {
    requireCurrentUserMock.mockResolvedValue(createUser("user@example.com"));

    const page = await DashboardLayout({
      children: <div>content</div>,
    });

    render(page);

    expect(screen.queryByRole("link", { name: "Админка" })).not.toBeInTheDocument();
  });

  it("shows the admin link for configured admin emails", async () => {
    requireCurrentUserMock.mockResolvedValue(createUser("onlygame1996@gmail.com"));

    const page = await DashboardLayout({
      children: <div>content</div>,
    });

    render(page);

    expect(screen.getByRole("link", { name: "Админка" })).toBeInTheDocument();
  });
});
