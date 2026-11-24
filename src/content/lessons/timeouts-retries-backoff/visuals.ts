import type { ChartFrame, ChartSpec, Localized, SequenceSpec, VisualSpec } from "@/content/schema";

const L = (en: string, vi: string, fr: string): Localized => ({ en, vi, fr });
const same = (text: string): Localized => ({ en: text, vi: text, fr: text });

/* ------------------------------------------------------------------ */
/* 1. Retry timelines (sequence)                                       */
/* ------------------------------------------------------------------ */

const TIMEOUT_NOTE = L("⏱ 2 s timeout fires", "⏱ hết timeout 2 s", "⏱ timeout de 2 s");

export const retrySequence: SequenceSpec = {
  kind: "sequence",
  id: "retry-sequence",
  participants: [
    { id: "client", label: L("Client", "Client", "Client"), kind: "io" },
    { id: "api", label: L("Payment API", "API thanh toán", "API paiement"), kind: "code" },
    { id: "db", label: L("Database", "Database", "Base"), kind: "tool" },
  ],
  scenarios: [
    {
      id: "transient",
      label: L("Transient error, retry works", "Lỗi thoáng qua, retry thành công", "Erreur passagère, la reprise marche"),
      summary: L(
        "A server error that goes away on its own: the case retries are made for.",
        "Một lỗi server tự hết: đúng trường hợp retry được sinh ra để xử lý.",
        "Une erreur serveur qui disparaît d'elle-même : le cas pour lequel les reprises existent.",
      ),
      steps: [
        {
          from: "client",
          to: "api",
          style: "request",
          label: L("POST /charge", "POST /charge", "POST /charge"),
          caption: L(
            "The client sends the request and starts a timer: the timeout.",
            "Client gửi request và bắt đầu đếm giờ: đó là timeout.",
            "Le client envoie la requête et démarre un minuteur : le timeout.",
          ),
        },
        {
          from: "api",
          to: "client",
          style: "error",
          label: L("503 Unavailable", "503 Unavailable", "503 Unavailable"),
          caption: L(
            "A transient server error. Server errors may succeed if retried; client errors (a malformed request) won't.",
            "Lỗi server thoáng qua. Lỗi server có thể thành công nếu retry; lỗi phía client (request sai định dạng) thì không.",
            "Erreur serveur passagère. Une erreur serveur peut réussir à la reprise ; une erreur client (requête mal formée), non.",
          ),
        },
        {
          from: "client",
          to: "client",
          style: "note",
          label: L("wait 100 ms + jitter", "chờ 100 ms + jitter", "attendre 100 ms + jitter"),
          caption: L(
            "Back off before retrying: wait, plus a random jitter, so thousands of clients don't come back at the same instant.",
            "Lùi lại trước khi retry: chờ một chút, cộng thêm jitter ngẫu nhiên, để hàng nghìn client không quay lại cùng một lúc.",
            "Reculer avant de réessayer : attendre, plus une gigue aléatoire, pour que des milliers de clients ne reviennent pas au même instant.",
          ),
        },
        {
          from: "client",
          to: "api",
          style: "request",
          label: L("POST /charge (retry 1)", "POST /charge (retry 1)", "POST /charge (reprise 1)"),
          caption: L("Second attempt.", "Lần thử thứ hai.", "Deuxième tentative."),
        },
        {
          from: "api",
          to: "db",
          style: "request",
          label: L("INSERT charge", "INSERT charge", "INSERT charge"),
          caption: L("This time the service reaches the database.", "Lần này service tới được database.", "Cette fois, le service atteint la base."),
        },
        {
          from: "db",
          to: "api",
          style: "response",
          label: L("OK", "OK", "OK"),
          caption: L("The write succeeds.", "Ghi thành công.", "L'écriture réussit."),
        },
        {
          from: "api",
          to: "client",
          style: "response",
          label: L("201 Created", "201 Created", "201 Created"),
          outcome: "success",
          caption: L(
            "Success on the second attempt. One well-timed retry hid a transient failure from the user.",
            "Thành công ở lần thử thứ hai. Một lần retry đúng lúc đã che đi một lỗi thoáng qua khỏi mắt người dùng.",
            "Réussite à la deuxième tentative. Une reprise bien dosée a masqué une panne passagère à l'utilisateur.",
          ),
        },
      ],
    },
    {
      id: "double-charge",
      label: L("Timeout + blind retry", "Timeout + retry mù quáng", "Timeout + reprise aveugle"),
      summary: L(
        "The first request actually succeeded, but the answer came too late.",
        "Request đầu tiên thực ra đã thành công, chỉ là câu trả lời đến quá muộn.",
        "La première requête a en fait réussi, mais la réponse est arrivée trop tard.",
      ),
      steps: [
        {
          from: "client",
          to: "api",
          style: "request",
          label: L("POST /charge $89", "POST /charge $89", "POST /charge 89 $"),
          caption: L("The client sends the charge with a 2-second timeout.", "Client gửi lệnh trừ tiền với timeout 2 giây.", "Le client envoie le débit avec un timeout de 2 secondes."),
        },
        {
          from: "api",
          to: "db",
          style: "request",
          label: L("INSERT charge (slow)", "INSERT charge (chậm)", "INSERT charge (lent)"),
          caption: L("The service writes the charge, but the database is slow today.", "Service ghi lệnh trừ tiền, nhưng hôm nay database chạy chậm.", "Le service écrit le débit, mais la base est lente aujourd'hui."),
        },
        {
          from: "client",
          to: "client",
          style: "note",
          label: TIMEOUT_NOTE,
          caption: L(
            "The client stops waiting. It can't tell whether the charge happened.",
            "Client ngừng chờ. Nó không biết lệnh trừ tiền đã xảy ra hay chưa.",
            "Le client cesse d'attendre. Il ne peut pas savoir si le débit a eu lieu.",
          ),
        },
        {
          from: "api",
          to: "client",
          style: "timeout",
          label: L("201 Created (too late)", "201 Created (quá muộn)", "201 Created (trop tard)"),
          caption: L(
            "The success response arrives after the client stopped listening.",
            "Phản hồi thành công đến sau khi client đã thôi lắng nghe.",
            "La réponse de succès arrive après que le client a cessé d'écouter.",
          ),
        },
        {
          from: "client",
          to: "api",
          style: "request",
          label: L("POST /charge $89 (retry)", "POST /charge $89 (retry)", "POST /charge 89 $ (reprise)"),
          caption: L("It retries the same request.", "Nó retry đúng request đó.", "Il réessaie la même requête."),
        },
        {
          from: "api",
          to: "db",
          style: "request",
          label: L("INSERT charge", "INSERT charge", "INSERT charge"),
          caption: L(
            "The service can't tell this is a retry, so it charges again.",
            "Service không thể biết đây là retry, nên trừ tiền thêm lần nữa.",
            "Le service ne peut pas savoir qu'il s'agit d'une reprise : il débite à nouveau.",
          ),
        },
        {
          from: "api",
          to: "client",
          style: "response",
          label: L("201 Created", "201 Created", "201 Created"),
          outcome: "failed",
          caption: L(
            "The customer is charged twice. An API with side effects is only safe to retry if it is idempotent.",
            "Khách hàng bị trừ tiền hai lần. API có side effect chỉ an toàn để retry nếu nó idempotent.",
            "Le client est débité deux fois. Une API à effets de bord n'est sûre à réessayer que si elle est idempotente.",
          ),
        },
      ],
    },
    {
      id: "idempotent",
      label: L("Retry with idempotency key", "Retry với idempotency key", "Reprise avec clé d'idempotence"),
      summary: L(
        "Same failure, but every attempt carries the same request ID.",
        "Cùng sự cố, nhưng mọi lần thử đều mang cùng một request ID.",
        "Même panne, mais chaque tentative porte le même identifiant de requête.",
      ),
      steps: [
        {
          from: "client",
          to: "api",
          style: "request",
          label: L("POST /charge key=a1b2", "POST /charge key=a1b2", "POST /charge key=a1b2"),
          caption: L(
            "The client generates a unique request ID once, and will reuse it for every retry.",
            "Client sinh một request ID duy nhất một lần, và dùng lại nó cho mọi lần retry.",
            "Le client génère une seule fois un identifiant de requête unique, réutilisé à chaque reprise.",
          ),
        },
        {
          from: "api",
          to: "db",
          style: "request",
          label: L("INSERT charge a1b2", "INSERT charge a1b2", "INSERT charge a1b2"),
          caption: L("The service stores the charge together with the key.", "Service lưu lệnh trừ tiền cùng với key.", "Le service enregistre le débit avec la clé."),
        },
        {
          from: "client",
          to: "client",
          style: "note",
          label: TIMEOUT_NOTE,
          caption: L("Same slow database, same timeout.", "Vẫn database chậm, vẫn timeout.", "Même base lente, même timeout."),
        },
        {
          from: "api",
          to: "client",
          style: "timeout",
          label: L("201 Created (too late)", "201 Created (quá muộn)", "201 Created (trop tard)"),
          caption: L("The reply is lost to the timeout again.", "Phản hồi lại bị timeout bỏ lỡ.", "La réponse est encore perdue à cause du timeout."),
        },
        {
          from: "client",
          to: "api",
          style: "request",
          label: L("POST /charge key=a1b2", "POST /charge key=a1b2", "POST /charge key=a1b2"),
          caption: L("The retry carries the same key.", "Lần retry mang cùng một key.", "La reprise porte la même clé."),
        },
        {
          from: "api",
          to: "db",
          style: "request",
          label: L("lookup a1b2 → found", "tra a1b2 → đã có", "chercher a1b2 → trouvée"),
          caption: L(
            "The service finds the key: this request was already processed.",
            "Service tìm thấy key: request này đã được xử lý rồi.",
            "Le service trouve la clé : cette requête a déjà été traitée.",
          ),
        },
        {
          from: "api",
          to: "client",
          style: "response",
          label: L("201 Created (same)", "201 Created (như cũ)", "201 Created (identique)"),
          outcome: "success",
          caption: L(
            "It returns an equivalent response without charging again. AWS SDKs do this with a ClientToken they generate and reuse on retries.",
            "Nó trả về phản hồi tương đương mà không trừ tiền lần nữa. AWS SDK làm điều này với ClientToken do SDK tự sinh và dùng lại khi retry.",
            "Il renvoie une réponse équivalente sans débiter à nouveau. Les SDK AWS font cela avec un ClientToken qu'ils génèrent et réutilisent à chaque reprise.",
          ),
        },
      ],
    },
  ],
};

/* ------------------------------------------------------------------ */
/* 2. Retry amplification (chart) — exact arithmetic                   */
/* ------------------------------------------------------------------ */

export const LAYERS = 5;
export const ATTEMPTS_PER_LAYER = 3;
const LAYER_LABELS: Localized[] = [
  same("1"),
  same("2"),
  same("3"),
  same("4"),
  L("DB", "DB", "Base"),
];

/** Requests reaching each layer when the database keeps failing. */
export function amplification(policy: "every-layer" | "one-point" | "none"): number[] {
  return Array.from({ length: LAYERS }, (_, i) =>
    policy === "every-layer" ? ATTEMPTS_PER_LAYER ** (i + 1) : policy === "one-point" ? ATTEMPTS_PER_LAYER : 1,
  );
}

function amplificationFrames(policy: "every-layer" | "one-point" | "none", tone: "bad" | "ok" | "muted"): ChartFrame[] {
  const values = amplification(policy);
  return values.map((value, depth) => ({
    label: L(`Down to layer ${depth + 1}`, `Xuống tới tầng ${depth + 1}`, `Jusqu'à la couche ${depth + 1}`),
    caption:
      policy === "every-layer"
        ? L(
            `Each caller makes up to ${ATTEMPTS_PER_LAYER} attempts, so layer ${depth + 1} receives ${ATTEMPTS_PER_LAYER}^${depth + 1} = ${value} requests for one customer call.`,
            `Mỗi bên gọi thử tối đa ${ATTEMPTS_PER_LAYER} lần, nên tầng ${depth + 1} nhận ${ATTEMPTS_PER_LAYER}^${depth + 1} = ${value} request cho một lần gọi của khách hàng.`,
            `Chaque appelant fait jusqu'à ${ATTEMPTS_PER_LAYER} tentatives : la couche ${depth + 1} reçoit ${ATTEMPTS_PER_LAYER}^${depth + 1} = ${value} requêtes pour un seul appel client.`,
          )
        : policy === "one-point"
          ? L(
              `Only the top layer retries. Layer ${depth + 1} receives ${value} requests: the load stays flat however deep the stack.`,
              `Chỉ tầng trên cùng retry. Tầng ${depth + 1} nhận ${value} request: tải giữ nguyên dù stack sâu đến đâu.`,
              `Seule la couche du haut réessaie. La couche ${depth + 1} reçoit ${value} requêtes : la charge reste plate, quelle que soit la profondeur.`,
            )
          : L(
              `No retries: layer ${depth + 1} receives ${value} request. Cheapest, but every transient error reaches the user.`,
              `Không retry: tầng ${depth + 1} nhận ${value} request. Rẻ nhất, nhưng mọi lỗi thoáng qua đều đến tay người dùng.`,
              `Aucune reprise : la couche ${depth + 1} reçoit ${value} requête. Le moins coûteux, mais chaque erreur passagère atteint l'utilisateur.`,
            ),
    bars: values.map((v, i) => ({ label: LAYER_LABELS[i], value: i <= depth ? v : 0, tone })),
  }));
}

export const amplificationChart: ChartSpec = {
  kind: "chart",
  id: "retry-amplification",
  valueLabel: L("Requests per customer call", "Request cho mỗi lần gọi của khách", "Requêtes par appel client"),
  valueFormat: "integer",
  yMax: ATTEMPTS_PER_LAYER ** LAYERS,
  xLabels: "all",
  method: L(
    `arithmetic: a five-deep call stack where the database keeps failing and each retrying caller makes up to ${ATTEMPTS_PER_LAYER} attempts (${ATTEMPTS_PER_LAYER}^5 = 243, the figure in the source).`,
    `số học: một chuỗi gọi sâu năm tầng, database liên tục lỗi và mỗi bên gọi có retry thử tối đa ${ATTEMPTS_PER_LAYER} lần (${ATTEMPTS_PER_LAYER}^5 = 243, đúng con số trong nguồn).`,
    `arithmétique : une pile d'appels à cinq niveaux où la base échoue sans cesse et où chaque appelant qui réessaie fait jusqu'à ${ATTEMPTS_PER_LAYER} tentatives (${ATTEMPTS_PER_LAYER}^5 = 243, le chiffre de la source).`,
  ),
  scenarios: [
    { id: "every-layer", label: L("Every layer retries", "Tầng nào cũng retry", "Chaque couche réessaie"), frames: amplificationFrames("every-layer", "bad") },
    { id: "one-point", label: L("Retry at one point", "Retry ở một điểm", "Reprise en un seul point"), frames: amplificationFrames("one-point", "ok") },
    { id: "none", label: L("No retries", "Không retry", "Aucune reprise"), frames: amplificationFrames("none", "muted") },
  ],
};

/* ------------------------------------------------------------------ */
/* 3. Jitter (chart) — seeded, reproducible simulation (illustrative)  */
/* ------------------------------------------------------------------ */

export const JITTER = { clients: 100, baseMs: 100, rounds: 3, bucketMs: 50, horizonMs: 1000 } as const;

/** Small deterministic PRNG (mulberry32) so the chart is identical on every build. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type JitterPolicy = "fixed" | "exponential" | "full-jitter";

/** Retry start times (ms) per round, for every client; all attempts fail (the server is still recovering). */
export function simulateRetries(policy: JitterPolicy): number[][] {
  const random = mulberry32(42);
  const rounds: number[][] = Array.from({ length: JITTER.rounds }, () => []);
  for (let c = 0; c < JITTER.clients; c++) {
    let t = 0;
    for (let r = 0; r < JITTER.rounds; r++) {
      const backoff = policy === "fixed" ? JITTER.baseMs : JITTER.baseMs * 2 ** r;
      const wait = policy === "full-jitter" ? random() * backoff : backoff;
      t += wait;
      rounds[r].push(t);
    }
  }
  return rounds;
}

/** Retries per time bucket, cumulated over the first `upToRound` rounds. */
export function histogram(policy: JitterPolicy, upToRound: number): number[] {
  const buckets = new Array(JITTER.horizonMs / JITTER.bucketMs).fill(0);
  simulateRetries(policy)
    .slice(0, upToRound)
    .flat()
    .forEach((t) => {
      const i = Math.min(buckets.length - 1, Math.floor(t / JITTER.bucketMs));
      buckets[i] += 1;
    });
  return buckets;
}

function jitterFrames(policy: JitterPolicy, tone: "bad" | "accent" | "ok"): ChartFrame[] {
  return Array.from({ length: JITTER.rounds }, (_, r) => {
    const bars = histogram(policy, r + 1);
    const peak = Math.max(...bars);
    return {
      label: L(`After retry ${r + 1}`, `Sau lần retry ${r + 1}`, `Après la reprise ${r + 1}`),
      caption: L(
        `${JITTER.clients * (r + 1)} retries so far. Busiest 50 ms slot: ${peak} retries arriving together.`,
        `Đã có ${JITTER.clients * (r + 1)} lần retry. Khung 50 ms đông nhất: ${peak} lần retry đến cùng lúc.`,
        `${JITTER.clients * (r + 1)} reprises jusqu'ici. Créneau de 50 ms le plus chargé : ${peak} reprises arrivées ensemble.`,
      ),
      bars: bars.map((value, i) => ({
        label: same(`${Number(((i * JITTER.bucketMs) / 1000).toFixed(2))}s`),
        value,
        tone,
      })),
    };
  });
}

export const jitterChart: ChartSpec = {
  kind: "chart",
  id: "jitter",
  valueLabel: L("Retries per 50 ms", "Số retry mỗi 50 ms", "Reprises par 50 ms"),
  valueFormat: "integer",
  yMax: JITTER.clients,
  xLabels: "sparse",
  method: L(
    "our simulation, not a measurement: 100 clients fail at time 0 and retry 3 times while the server is still down. Fixed: wait 100 ms each time. Exponential: wait 100, 200, 400 ms. Full jitter: wait a random time between 0 and that exponential value. Seeded random numbers make it reproducible.",
    "mô phỏng của chúng tôi, không phải số đo: 100 client lỗi ở thời điểm 0 và retry 3 lần trong khi server vẫn chưa hồi phục. Cố định: mỗi lần chờ 100 ms. Lũy thừa: chờ 100, 200, 400 ms. Full jitter: chờ ngẫu nhiên từ 0 đến giá trị lũy thừa đó. Số ngẫu nhiên có seed nên tái lập được.",
    "notre simulation, pas une mesure : 100 clients échouent à l'instant 0 et réessaient 3 fois pendant que le serveur est encore en panne. Fixe : attendre 100 ms à chaque fois. Exponentiel : 100, 200, 400 ms. Full jitter : une attente aléatoire entre 0 et cette valeur exponentielle. Nombres aléatoires à graine fixe, donc reproductibles.",
  ),
  scenarios: [
    { id: "fixed", label: L("Fixed delay", "Chờ cố định", "Délai fixe"), frames: jitterFrames("fixed", "bad") },
    { id: "exponential", label: L("Exponential backoff", "Backoff lũy thừa", "Backoff exponentiel"), frames: jitterFrames("exponential", "accent") },
    { id: "full-jitter", label: L("Backoff + full jitter", "Backoff + full jitter", "Backoff + full jitter"), frames: jitterFrames("full-jitter", "ok") },
  ],
};

export const visuals: Record<string, VisualSpec> = {
  sequence: retrySequence,
  amplification: amplificationChart,
  jitter: jitterChart,
};
