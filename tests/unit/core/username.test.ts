import { describe, expect, it } from "vitest";

import { createUniqueUsername } from "@/lib/core/username";

describe("createUniqueUsername", () => {
  it("transliterates Russian names and joins them into a slug", async () => {
    const username = await createUniqueUsername(
      {
        firstName: "Анна",
        lastName: "Иванова",
        email: "anna@example.com",
      },
      async () => false,
    );

    expect(username).toBe("anna-ivanova");
  });

  it("adds a numeric suffix when the base username is taken", async () => {
    const taken = new Set(["anna-ivanova", "anna-ivanova-2"]);

    const username = await createUniqueUsername(
      {
        firstName: "Анна",
        lastName: "Иванова",
        email: "anna@example.com",
      },
      async (candidate) => taken.has(candidate),
    );

    expect(username).toBe("anna-ivanova-3");
  });

  it("falls back to photographer when names and email local-part are not usable", async () => {
    const username = await createUniqueUsername(
      {
        firstName: "",
        lastName: "",
        email: "@example.com",
      },
      async () => false,
    );

    expect(username).toBe("photographer");
  });
});
