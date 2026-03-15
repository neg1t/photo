import { describe, expect, it } from "vitest";

import { ensureStorageQuota } from "@/lib/core/quota";

describe("ensureStorageQuota", () => {
  it("allows uploads when projected usage stays under the limit", () => {
    const result = ensureStorageQuota({
      currentUsageBytes: 1_000n,
      incomingBytes: 400n,
      limitBytes: 2_000n,
    });

    expect(result.allowed).toBe(true);
    expect(result.projectedUsageBytes).toBe(1_400n);
    expect(result.remainingBytes).toBe(600n);
  });

  it("blocks uploads when projected usage exceeds the limit", () => {
    const result = ensureStorageQuota({
      currentUsageBytes: 1_700n,
      incomingBytes: 400n,
      limitBytes: 2_000n,
    });

    expect(result.allowed).toBe(false);
    expect(result.projectedUsageBytes).toBe(2_100n);
    expect(result.remainingBytes).toBe(300n);
    expect(result.excessBytes).toBe(100n);
  });
});
