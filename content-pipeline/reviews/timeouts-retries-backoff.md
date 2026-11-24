# Review: Timeouts, Retries and Backoff with Jitter: Surviving Partial Failure

- Slug: `timeouts-retries-backoff` · status: **draft** · created 2026-11-24 · provenance: lesson-generation-skill (candidate `2026-11-24-aws-timeouts-retries-jitter`)
- Length: VI 2681 words · EN 2097 words · FR 2403 words · ~20 min
- Visuals: `sequence` (sequence), `amplification` (chart), `jitter` (chart)
- Automated gates: pass · 1 review flag(s) · 0 warning(s)

## Sources
- [Timeouts, retries, and backoff with jitter](https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/): AWS Builders' Library, Marc, published 2019-12-05, checked 2026-11-24 (primary)
- [Making retries safe with idempotent APIs](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/): AWS Builders' Library, Malcolm Featonby, published **date not stated**, checked 2026-11-24 (supporting)
- [Retry behavior](https://docs.aws.amazon.com/sdkref/latest/guide/feature-retry-behavior.html): AWS SDKs and Tools Reference Guide, Amazon Web Services, published **date not stated**, checked 2026-11-24 (supporting)

## Claims to check (27)
| | Claim | Source | Evidence |
|---|---|---|---|
| ✅ | Retries help in the right dose but cause damage when overused. | timeouts-retries-jitter | Retries are similar to a powerful medicine -- useful in the right dose, but can cause significant damage when used too much. |
| ✅ | Slow requests hold resources; enough of them can exhaust a server. | timeouts-retries-jitter | When a number of requests hold on to resources for a long time, the server can run out of those resources. |
| ✅ | Choosing the timeout value is typically the hardest part. | timeouts-retries-jitter | Typically, the most difficult problem is choosing a timeout value to set. |
| ✅ | Amazon picks an acceptable false-timeout rate (e.g. 0.1%) and uses the matching downstream latency percentile (p99.9). | timeouts-retries-jitter | we choose an acceptable rate of false timeouts (such as 0.1%) / we look at the corresponding latency percentile on the downstream service (p99.9 in this example). |
| ✅ | Timeouts set too low cause extra retries, more backend traffic and latency. | timeouts-retries-jitter | Increased traffic on the backend and increased latency because too many requests are retried. |
| ✅ | A ~20 ms timeout caused timeouts right after deployments because connection setup took longer; fixed by connecting at startup before taking traffic. | timeouts-retries-jitter | The timeout was set very low, to around 20 milliseconds. / immediately following deployments / establishing these connections when a process started up, but before receiving traffic. |
| ✅ | Retries are selfish: they spend server time for a higher chance of success. | timeouts-retries-jitter | Retries are “selfish.” In other words, when a client retries, it spends more of the server's time to get a higher chance of success. |
| ✅ | APIs with side effects aren't safe to retry unless idempotent. | timeouts-retries-jitter | In general, our view is that APIs with side effects aren't safe to retry unless they provide idempotency. |
| ✅ | Client errors shouldn't be retried as-is; server errors may succeed later. | timeouts-retries-jitter | client errors should not be retried with the same request because they aren't going to succeed later / server errors may succeed on subsequent tries. |
| ✅ | Exponential backoff increases the wait exponentially; capping it is capped exponential backoff. | timeouts-retries-jitter | The most common pattern is an exponential backoff, where the wait time is increased exponentially after every attempt. / capped exponential backoff. |
| ✅ | With a cap alone, all clients end up retrying constantly at the capped rate. | timeouts-retries-jitter | Now all of the clients are retrying constantly at the capped rate. |
| ✅ | In a five-deep call stack where each layer retries independently, database load grows 243×. | timeouts-retries-jitter | Consider a system where the customer's call causes a five-deep stack of service calls. / If each layer retries independently, the load on the database will increase 243x |
| ✅ | Best practice: retry at a single point in the stack. | timeouts-retries-jitter | our best practice is to retry at a single point in the stack. |
| ✅ | A local token bucket limits retries; AWS added it to the AWS SDK in 2016. | timeouts-retries-jitter | limiting retries locally using a token bucket / retry at a fixed rate when the tokens are exhausted / AWS added this behavior to the AWS SDK in 2016. |
| ✅ | Amazon avoids amplification by retrying only when the dependency looks healthy. | timeouts-retries-jitter | We avoid this amplification by retrying only when we observe that the dependency is healthy. |
| ✅ | Circuit breakers add modal behavior that is hard to test and can add recovery time. | timeouts-retries-jitter | Unfortunately, circuit breakers introduce modal behavior into systems that can be difficult to test, / and can introduce significant addition time to recovery. |
| ✅ | Some timeout implementations don't cover DNS lookups or TLS handshakes. | timeouts-retries-jitter | There are also implementations where the timeout doesn't cover all remote calls, like DNS or TLS handshakes. |
| ✅ | Over the internet, factor in reasonable worst-case network latency. | timeouts-retries-jitter | clients have substantial network latency, such as over the internet. / In these cases, we factor in reasonable worst-case network latency. |
| ✅ | Stop retrying when retries no longer improve availability. | timeouts-retries-jitter | We stop retrying when the retries are not helping to improve availability. |
| ✅ | Without jitter, clients that back off to the same time collide again. | timeouts-retries-jitter | If all the failed calls back off to the same time, they cause contention or overload again when they are retried. |
| ✅ | Jitter also applies to timers and periodic jobs; Amazon uses a consistent per-host value; it reduced server capacity needs. | timeouts-retries-jitter | Jitter isn't only for retries. / we consider adding some jitter to all timers, periodic jobs, and other delayed work / produces the same number every time on the same host / less server capacity |
| ✅ | Idempotent: a request can be retried with no additional side effects. | idempotent-apis | An idempotent operation is one where a request can be retransmitted or retried with no additional side effects |
| ✅ | AWS prefers a caller-provided client request identifier (ClientToken); SDKs generate one if absent. | idempotent-apis | incorporate a unique caller-provided client request identifier into our API contract / modeled by the ClientToken field / they will generate a unique client request identifier |
| ✅ | Retries with the same identifier get a semantically equivalent response; mismatched parameters get a validation error. | idempotent-apis | deliver a semantically equivalent response in every case for the same unique request identifier / return a validation error indicating a parameter mismatch |
| ✅ | Full jitter waits a random time between 0 and the capped exponential backoff. _(Verified 2026-11-24 against the AWS SDK reference. The AWS Architecture Blog article still returned no body to the fetch tool, so it is not cited as evidence.)_ | aws-sdk-retry-behavior | The SDK uses exponential backoff with full jitter. / delay = random(0, 1) × min(20,000 ms, base_delay × 2^retry) / The random multiplier is called full jitter. |
| 🧮 | 3 attempts per layer across 5 layers gives 3^5 = 243 requests at the bottom. | ours | Our arithmetic, matching the source's 243×; chart values checked by a unit test. |
| 🧮 | The jitter chart shows illustrative retry timing for 100 clients. | ours | Our deterministic, seeded simulation (no measurements); totals checked by a unit test. |

## Needs a human decision
- [ ] status is draft: visible in dev/preview only until published

## Errors
- none

## Warnings
- none

## Reviewer checklist
See `content-pipeline/REVIEW.md`. Tick each item, resolve every ⚠️ claim (verify and set `status: "verified"` with evidence, or remove/rewrite the claim), then run `npm run content:publish -- timeouts-retries-backoff`.
