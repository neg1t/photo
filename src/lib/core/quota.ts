type StorageQuotaInput = {
  currentUsageBytes: bigint;
  incomingBytes: bigint;
  limitBytes: bigint;
};

type StorageQuotaResult = {
  allowed: boolean;
  projectedUsageBytes: bigint;
  remainingBytes: bigint;
  excessBytes: bigint;
};

export function ensureStorageQuota({
  currentUsageBytes,
  incomingBytes,
  limitBytes,
}: StorageQuotaInput): StorageQuotaResult {
  const projectedUsageBytes = currentUsageBytes + incomingBytes;
  const allowed = projectedUsageBytes <= limitBytes;
  const remainingBytes = allowed
    ? limitBytes - projectedUsageBytes
    : currentUsageBytes >= limitBytes
      ? 0n
      : limitBytes - currentUsageBytes;

  return {
    allowed,
    projectedUsageBytes,
    remainingBytes,
    excessBytes: allowed ? 0n : projectedUsageBytes - limitBytes,
  };
}
