import type { SourceRef } from "@/content/schema";

/** Opened and checked on accessedOn. Authors exactly as credited; null date when the page shows none. */
export const sources: SourceRef[] = [
  {
    id: "timeouts-retries-jitter",
    title: "Timeouts, retries, and backoff with jitter",
    publisher: "AWS Builders' Library",
    authors: ["Marc"],
    url: "https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/",
    publishedOn: "2019-12-05",
    accessedOn: "2026-11-24",
    role: "primary",
    note: {
      en: "Primary source. The page now redirects to AWS Builder Center, which credits the author only as “Marc”.",
      vi: "Nguồn chính. Trang hiện chuyển hướng sang AWS Builder Center, nơi chỉ ghi tên tác giả là “Marc”.",
      fr: "Source principale. La page redirige désormais vers AWS Builder Center, qui ne crédite l'auteur que sous le nom « Marc ».",
    },
  },
  {
    id: "idempotent-apis",
    title: "Making retries safe with idempotent APIs",
    publisher: "AWS Builders' Library",
    authors: ["Malcolm Featonby"],
    url: "https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/",
    publishedOn: null,
    accessedOn: "2026-11-24",
    role: "supporting",
    note: {
      en: "Used for the idempotency section. The page shows no publication date.",
      vi: "Dùng cho phần idempotency. Trang không ghi ngày xuất bản.",
      fr: "Utilisée pour la section sur l'idempotence. La page n'indique pas de date de publication.",
    },
  },
  {
    id: "aws-sdk-retry-behavior",
    title: "Retry behavior",
    publisher: "AWS SDKs and Tools Reference Guide",
    authors: ["Amazon Web Services"],
    url: "https://docs.aws.amazon.com/sdkref/latest/guide/feature-retry-behavior.html",
    publishedOn: null,
    accessedOn: "2026-11-24",
    role: "supporting",
    note: {
      en: "Used to confirm the full-jitter formula. AWS documentation with no individual author or date shown; it describes the updated (2026) SDK retry behavior.",
      vi: "Dùng để xác nhận công thức full jitter. Tài liệu AWS không ghi tác giả cá nhân hay ngày; trang mô tả hành vi retry mới (2026) của SDK.",
      fr: "Utilisée pour confirmer la formule du full jitter. Documentation AWS sans auteur individuel ni date ; elle décrit le nouveau comportement de reprise des SDK (2026).",
    },
  },
];
