export type CollectionStatus = "DRAFT" | "PUBLISHED" | "EXPIRED" | "DELETED";
export type CollectionPublicState = "visible" | "expired" | "hidden";

type PublishableCollection = {
  id: string;
  status: CollectionStatus;
  expiresAt: Date;
  shareToken: string | null;
  publishedAt: Date | null;
};

export function publishCollection(
  collection: PublishableCollection,
  createShareToken: () => string,
  now = new Date(),
) {
  return {
    ...collection,
    status: "PUBLISHED" as const,
    shareToken: collection.shareToken ?? createShareToken(),
    publishedAt: now,
  };
}

export function getCollectionPublicState(
  collection: Pick<PublishableCollection, "status" | "expiresAt">,
  now = new Date(),
): CollectionPublicState {
  if (collection.status === "DRAFT" || collection.status === "DELETED") {
    return "hidden";
  }

  if (collection.expiresAt <= now) {
    return "expired";
  }

  return "visible";
}
