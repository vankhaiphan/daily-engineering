import type { LessonReview } from "@/content/schema";

const T = "timeouts-retries-jitter";
const I = "idempotent-apis";

/** Every factual claim taught, with verbatim evidence (checked 2026-11-24). */
export const review: LessonReview = {
  reviewedBy: "",
  reviewedOn: "2026-11-24",
  claims: [
    { id: "medicine", claim: "Retries help in the right dose but cause damage when overused.", sourceId: T, evidence: "Retries are similar to a powerful medicine -- useful in the right dose, but can cause significant damage when used too much.", status: "verified" },
    { id: "resources", claim: "Slow requests hold resources; enough of them can exhaust a server.", sourceId: T, evidence: "When a number of requests hold on to resources for a long time, the server can run out of those resources.", status: "verified" },
    { id: "hardest", claim: "Choosing the timeout value is typically the hardest part.", sourceId: T, evidence: "Typically, the most difficult problem is choosing a timeout value to set.", status: "verified" },
    { id: "percentile", claim: "Amazon picks an acceptable false-timeout rate (e.g. 0.1%) and uses the matching downstream latency percentile (p99.9).", sourceId: T, evidence: "we choose an acceptable rate of false timeouts (such as 0.1%) / we look at the corresponding latency percentile on the downstream service (p99.9 in this example).", status: "verified" },
    { id: "too-low", claim: "Timeouts set too low cause extra retries, more backend traffic and latency.", sourceId: T, evidence: "Increased traffic on the backend and increased latency because too many requests are retried.", status: "verified" },
    { id: "twenty-ms", claim: "A ~20 ms timeout caused timeouts right after deployments because connection setup took longer; fixed by connecting at startup before taking traffic.", sourceId: T, evidence: "The timeout was set very low, to around 20 milliseconds. / immediately following deployments / establishing these connections when a process started up, but before receiving traffic.", status: "verified" },
    { id: "selfish", claim: "Retries are selfish: they spend server time for a higher chance of success.", sourceId: T, evidence: "Retries are “selfish.” In other words, when a client retries, it spends more of the server's time to get a higher chance of success.", status: "verified" },
    { id: "not-safe", claim: "APIs with side effects aren't safe to retry unless idempotent.", sourceId: T, evidence: "In general, our view is that APIs with side effects aren't safe to retry unless they provide idempotency.", status: "verified" },
    { id: "errors", claim: "Client errors shouldn't be retried as-is; server errors may succeed later.", sourceId: T, evidence: "client errors should not be retried with the same request because they aren't going to succeed later / server errors may succeed on subsequent tries.", status: "verified" },
    { id: "backoff", claim: "Exponential backoff increases the wait exponentially; capping it is capped exponential backoff.", sourceId: T, evidence: "The most common pattern is an exponential backoff, where the wait time is increased exponentially after every attempt. / capped exponential backoff.", status: "verified" },
    { id: "capped-problem", claim: "With a cap alone, all clients end up retrying constantly at the capped rate.", sourceId: T, evidence: "Now all of the clients are retrying constantly at the capped rate.", status: "verified" },
    { id: "amplification", claim: "In a five-deep call stack where each layer retries independently, database load grows 243×.", sourceId: T, evidence: "Consider a system where the customer's call causes a five-deep stack of service calls. / If each layer retries independently, the load on the database will increase 243x", status: "verified" },
    { id: "single-point", claim: "Best practice: retry at a single point in the stack.", sourceId: T, evidence: "our best practice is to retry at a single point in the stack.", status: "verified" },
    { id: "token-bucket", claim: "A local token bucket limits retries; AWS added it to the AWS SDK in 2016.", sourceId: T, evidence: "limiting retries locally using a token bucket / retry at a fixed rate when the tokens are exhausted / AWS added this behavior to the AWS SDK in 2016.", status: "verified" },
    { id: "healthy", claim: "Amazon avoids amplification by retrying only when the dependency looks healthy.", sourceId: T, evidence: "We avoid this amplification by retrying only when we observe that the dependency is healthy.", status: "verified" },
    { id: "circuit-breakers", claim: "Circuit breakers add modal behavior that is hard to test and can add recovery time.", sourceId: T, evidence: "Unfortunately, circuit breakers introduce modal behavior into systems that can be difficult to test, / and can introduce significant addition time to recovery.", status: "verified" },
    { id: "dns-tls", claim: "Some timeout implementations don't cover DNS lookups or TLS handshakes.", sourceId: T, evidence: "There are also implementations where the timeout doesn't cover all remote calls, like DNS or TLS handshakes.", status: "verified" },
    { id: "internet-latency", claim: "Over the internet, factor in reasonable worst-case network latency.", sourceId: T, evidence: "clients have substantial network latency, such as over the internet. / In these cases, we factor in reasonable worst-case network latency.", status: "verified" },
    { id: "stop-retrying", claim: "Stop retrying when retries no longer improve availability.", sourceId: T, evidence: "We stop retrying when the retries are not helping to improve availability.", status: "verified" },
    { id: "jitter-why", claim: "Without jitter, clients that back off to the same time collide again.", sourceId: T, evidence: "If all the failed calls back off to the same time, they cause contention or overload again when they are retried.", status: "verified" },
    { id: "jitter-timers", claim: "Jitter also applies to timers and periodic jobs; Amazon uses a consistent per-host value; it reduced server capacity needs.", sourceId: T, evidence: "Jitter isn't only for retries. / we consider adding some jitter to all timers, periodic jobs, and other delayed work / produces the same number every time on the same host / less server capacity", status: "verified" },
    { id: "idempotency-definition", claim: "Idempotent: a request can be retried with no additional side effects.", sourceId: I, evidence: "An idempotent operation is one where a request can be retransmitted or retried with no additional side effects", status: "verified" },
    { id: "client-token", claim: "AWS prefers a caller-provided client request identifier (ClientToken); SDKs generate one if absent.", sourceId: I, evidence: "incorporate a unique caller-provided client request identifier into our API contract / modeled by the ClientToken field / they will generate a unique client request identifier", status: "verified" },
    { id: "equivalent-response", claim: "Retries with the same identifier get a semantically equivalent response; mismatched parameters get a validation error.", sourceId: I, evidence: "deliver a semantically equivalent response in every case for the same unique request identifier / return a validation error indicating a parameter mismatch", status: "verified" },
    {
      id: "full-jitter-formula",
      claim: "Full jitter waits a random time between 0 and the capped exponential backoff.",
      evidence: "Standard definition used in our simulation. The primary source points to the AWS Architecture Blog for jitter algorithms, but that page's body did not load during research, so this was not confirmed against a source.",
      status: "needs-review",
      note: "Confirm against https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/ or another primary source, then mark verified with a quote",
    },
    { id: "amplification-math", claim: "3 attempts per layer across 5 layers gives 3^5 = 243 requests at the bottom.", evidence: "Our arithmetic, matching the source's 243×; chart values checked by a unit test.", status: "derived" },
    { id: "jitter-sim", claim: "The jitter chart shows illustrative retry timing for 100 clients.", evidence: "Our deterministic, seeded simulation (no measurements); totals checked by a unit test.", status: "derived" },
  ],
};
