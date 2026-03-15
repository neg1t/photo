import { describe, expect, it } from "vitest";

import { createSeeOtherRedirectResponse } from "@/lib/http";

describe("createSeeOtherRedirectResponse", () => {
  it("returns a 303 redirect to the target page with encoded query params", () => {
    const response = createSeeOtherRedirectResponse(
      new Request("https://photo.test/dashboard/collections/create"),
      "/dashboard/collections",
      {
        success: "Фотографии загружены.",
      },
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "https://photo.test/dashboard/collections?success=%D0%A4%D0%BE%D1%82%D0%BE%D0%B3%D1%80%D0%B0%D1%84%D0%B8%D0%B8+%D0%B7%D0%B0%D0%B3%D1%80%D1%83%D0%B6%D0%B5%D0%BD%D1%8B.",
    );
  });
});
