/**
 * Code sample (our own sketch, not an AWS SDK API). Identifiers stay in
 * English; explanatory comments are localized.
 */
import type { Locale } from "@/lib/i18n/config";

const C = {
  en: {
    title: "A careful retry helper: our sketch of the article's advice.",
    key: "one idempotency key for ALL attempts",
    timeout: "every remote call gets a timeout",
    ok: "success: stop",
    client: "4xx: retrying the same request won't help",
    budget: "local token bucket: no tokens, no retry",
    backoff: "capped exponential backoff…",
    jitter: "…with full jitter (see review note)",
    giveUp: "give up and surface the error",
  },
  vi: {
    title: "Một hàm retry cẩn trọng: phác thảo của chúng tôi theo lời khuyên trong bài.",
    key: "một idempotency key cho MỌI lần thử",
    timeout: "mọi lời gọi từ xa đều có timeout",
    ok: "thành công: dừng",
    client: "4xx: retry y nguyên request cũng vô ích",
    budget: "token bucket cục bộ: hết token thì không retry",
    backoff: "backoff lũy thừa có giới hạn…",
    jitter: "…kèm full jitter (xem ghi chú review)",
    giveUp: "bỏ cuộc và báo lỗi lên trên",
  },
  fr: {
    title: "Un utilitaire de reprise prudent : notre esquisse des conseils de l'article.",
    key: "une seule clé d'idempotence pour TOUTES les tentatives",
    timeout: "chaque appel distant a un timeout",
    ok: "succès : on s'arrête",
    client: "4xx : renvoyer la même requête n'aidera pas",
    budget: "token bucket local : sans jeton, pas de reprise",
    backoff: "backoff exponentiel plafonné…",
    jitter: "…avec full jitter (voir la note de relecture)",
    giveUp: "abandonner et remonter l'erreur",
  },
} satisfies Record<Locale, Record<string, string>>;

export function codeFor(locale: Locale) {
  const c = C[locale];
  return {
    retry: `// ${c.title}
async function callWithRetries(req: ChargeRequest, maxAttempts = 3) {
  const idempotencyKey = crypto.randomUUID();      // ${c.key}

  for (let attempt = 1; ; attempt++) {
    const res = await send(req, {
      idempotencyKey,
      timeoutMs: P999_LATENCY_MS,                  // ${c.timeout}
    }).catch((err) => err);

    if (res.ok) return res;                        // ${c.ok}
    if (res.status >= 400 && res.status < 500) throw res; // ${c.client}
    if (attempt === maxAttempts || !retryBudget.take()) {
      throw res;                                   // ${c.giveUp}
    }

    const backoff = Math.min(CAP_MS, BASE_MS * 2 ** (attempt - 1)); // ${c.backoff}
    await sleep(Math.random() * backoff);          // ${c.jitter}
  }
}`,
  };
}
