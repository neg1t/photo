import { describe, expect, it } from "vitest";

import { canManageProtectedContent } from "@/lib/core/access";

describe("canManageProtectedContent", () => {
  it("allows active photographers to manage protected content", () => {
    expect(canManageProtectedContent("ACTIVE")).toBe(true);
  });

  it("blocks pending and suspended photographers", () => {
    expect(canManageProtectedContent("PENDING")).toBe(false);
    expect(canManageProtectedContent("SUSPENDED")).toBe(false);
  });
});
