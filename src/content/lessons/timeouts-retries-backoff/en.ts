import type { LessonBody } from "@/content/schema";
import { codeFor } from "./code";

const T = "timeouts-retries-jitter";
const code = codeFor("en");

export const en: LessonBody = {
  title: "Timeouts, Retries and Backoff with Jitter: Surviving Partial Failure",
  subtitle:
    "How long to wait, when to try again, and how not to turn a small outage into a big one. Lessons from Amazon's Builders' Library, made interactive.",
  hook: "A retry can rescue a request or take down a database. Learn the dose that heals: timeouts, backoff, jitter and idempotency.",
  sections: [
    {
      id: "intro",
      kind: "intro",
      title: "The 20-millisecond outage",
      blocks: [
        {
          type: "p",
          text: "An Amazon team once set the timeout for a call to a dependency very low, around 20 milliseconds. Most of the time that was plenty. But right after every deployment, a small number of calls timed out. The cause wasn't a slow dependency at all: new processes had to establish their connections first, and connection setup alone took longer than 20 ms. The fix was to open those connections when the process started, before it received any traffic.",
        },
        {
          type: "p",
          text: "That story opens a classic article in the AWS Builders' Library, “Timeouts, retries, and backoff with jitter” (December 2019). Its point: in a distributed system, servers, networks and deployments fail all the time, partially and briefly. Four small tools decide whether those failures stay small: **timeouts**, **retries**, **backoff** and **jitter**. Used well they hide failures from users. Used carelessly they amplify them.",
        },
        {
          type: "quote",
          text: "Retries are similar to a powerful medicine -- useful in the right dose, but can cause significant damage when used too much.",
          sourceId: T,
        },
        {
          type: "callout",
          tone: "insight",
          title: "By the end you will be able to",
          text: "Choose a timeout from a latency percentile; decide which errors to retry; explain retry amplification with numbers; describe exponential backoff, jitter and retry budgets; and make a retried API safe with an idempotency key.",
        },
      ],
    },
    {
      id: "intuition",
      kind: "concept",
      title: "Intuition: calling a busy restaurant",
      blocks: [
        {
          type: "p",
          text: "You call a restaurant to book a table. If nobody answers after a while, you hang up: that's a **timeout**. You call again: a **retry**. If it's still busy, you wait longer before each new attempt: **backoff**. Now imagine a thousand people who all hung up at 7:00 and all redial at exactly 7:01. The line jams again. If each person waits a slightly different, random amount of time, the calls spread out and the restaurant can answer them: that's **jitter**.",
        },
        {
          type: "p",
          text: "One more twist: you asked for a table, the line dropped, and you don't know whether the booking was saved. If you call again and say “a table for four at 8”, you might end up with two bookings. If you say “this is booking request #a1b2”, the restaurant can tell it's the same request. That's **idempotency**.",
        },
        {
          type: "callout",
          tone: "analogy",
          title: "The core tension",
          text: "Retries are selfish: each one spends more of the server's time to raise your own chance of success. When a server is healthy, that's a good trade. When it's overloaded, everyone's selfish retries make it worse.",
        },
      ],
    },
    {
      id: "timeouts",
      kind: "deep-dive",
      title: "Timeouts: how long to wait",
      blocks: [
        {
          type: "p",
          text: "Every remote call needs a timeout. A request that waits forever holds resources the whole time: memory, threads, connections, ports. When enough requests hold resources for a long time, the server runs out, and a slow dependency becomes your outage.",
        },
        {
          type: "p",
          text: "The hard part, according to the article, is choosing the value. Too high, and stuck requests pile up. Too low, and you time out requests that would have succeeded, which causes more retries, more backend traffic and higher latency.",
        },
        { type: "quote", text: "Typically, the most difficult problem is choosing a timeout value to set.", sourceId: T },
        {
          type: "p",
          text: "Amazon's method is concrete: pick an acceptable rate of false timeouts, for example 0.1%, then set the timeout at the matching latency percentile of the downstream service, here **p99.9**. If the dependency answers within 180 ms 99.9% of the time, a timeout near 180 ms means only about one healthy request in a thousand is wrongly cut off. (The 180 ms figure is our example.)",
        },
        {
          type: "list",
          items: [
            "**Measure the right thing**: the 20 ms story shows that a timeout can include connection setup, which normal latency metrics may not.",
            "**Know what the timeout covers**: depending on the library, it may or may not include DNS lookup or the TLS handshake.",
            "**Leave headroom for wide-area calls**: latency over the internet varies much more than inside a data center.",
          ],
        },
      ],
    },
    {
      id: "retries",
      kind: "deep-dive",
      title: "Retries: when trying again helps, and when it hurts",
      blocks: [
        {
          type: "p",
          text: "Many failures are transient: a server restarts, a packet is lost, a node is briefly overloaded. Retrying turns those into successes the user never sees. But not every failure is worth retrying, and not every request is safe to send twice. Step through the three timelines below.",
        },
        { type: "interactive", widget: "sequence", ref: "sequence" },
        {
          type: "list",
          items: [
            "**Client errors** (a malformed or unauthorized request) won't succeed later. Don't retry the same request.",
            "**Server errors and timeouts** may succeed on a later attempt. These are the candidates for retries.",
            "**Side effects** change the picture: after a timeout you don't know whether the first attempt happened. Retrying a non-idempotent API can charge a card twice.",
          ],
        },
        { type: "quote", text: "In general, our view is that APIs with side effects aren't safe to retry unless they provide idempotency.", sourceId: T },
        {
          type: "p",
          text: "The companion article “Making retries safe with idempotent APIs” defines an idempotent operation as one where a request can be retried with no additional side effects. AWS's preferred design is a unique **client request identifier** in the API contract, generated by the caller and reused for every retry; many AWS APIs call it ClientToken, and the SDKs generate one automatically when the caller doesn't. A retry with the same identifier gets a semantically equivalent response. If the same identifier arrives with different parameters, the service returns a validation error rather than guessing the caller's intent.",
        },
      ],
    },
    {
      id: "amplification",
      kind: "explore",
      title: "Retry amplification: 3 attempts become 243",
      blocks: [
        {
          type: "p",
          text: "Retries multiply when systems are layered. The article's example: a customer's call causes a five-deep stack of service calls, and the database at the bottom starts failing. If every layer retries independently, each failure multiplies the load on the layer below. With three attempts per layer, the database receives 3⁵ = 243 requests for each customer call, exactly when it is least able to handle them.",
        },
        { type: "interactive", widget: "chart", ref: "amplification" },
        {
          type: "p",
          text: "The fix is structural: retry at a single point in the stack. Lower layers fail fast and report the error upward; one layer decides whether to try again. The amplification disappears, and the remaining retries are easy to reason about.",
        },
        { type: "quote", text: "our best practice is to retry at a single point in the stack.", sourceId: T },
      ],
    },
    {
      id: "backoff",
      kind: "deep-dive",
      title: "Backoff, caps and retry budgets",
      blocks: [
        {
          type: "p",
          text: "Retrying immediately hits a struggling server while it's still struggling. **Exponential backoff** waits longer after each failed attempt: for example 100 ms, then 200 ms, then 400 ms. Because waits grow quickly, the article recommends a **cap**, called capped exponential backoff. But a cap alone has a side effect: once every client reaches the maximum wait, they all keep retrying constantly at that capped rate.",
        },
        {
          type: "p",
          text: "So Amazon also limits retries **locally with a token bucket**: each retry spends a token; while tokens remain, calls may retry; once the bucket is empty, retries continue only at a fixed, slow rate. AWS added this behavior to the AWS SDK in 2016. More generally, the team avoids amplification by retrying only when it observes that the dependency is healthy.",
        },
        {
          type: "callout",
          tone: "warning",
          title: "What about circuit breakers?",
          text: "A circuit breaker stops calling a failing dependency entirely for a while. It's popular, but the article warns that it introduces modal behavior that is hard to test and can add significant time to recovery. Retry budgets (token buckets) give a gentler, always-on limit.",
        },
      ],
    },
    {
      id: "jitter",
      kind: "explore",
      title: "Jitter: break the synchronized stampede",
      blocks: [
        {
          type: "p",
          text: "Backoff alone doesn't help when many clients fail at the same moment: they all compute the same wait and all come back at the same instant. If all the failed calls back off to the same time, they cause contention or overload again when retried. **Jitter** adds randomness to each wait, so retries spread out over time.",
        },
        {
          type: "p",
          text: "The chart below is our own simulation, not a measurement: 100 clients fail together and retry three times while the server is still down. Compare where the retries land with a fixed delay, with exponential backoff, and with backoff plus full jitter (a random wait between zero and the backoff value).",
        },
        { type: "interactive", widget: "chart", ref: "jitter" },
        {
          type: "p",
          text: "Jitter isn't only for retries. The article recommends adding it to timers, periodic jobs and other delayed work too: clients polling once a minute, or jobs scheduled at midnight, all line up into spikes otherwise. For scheduled work, Amazon uses a **consistent** jitter per host rather than a fresh random value, so problems reproduce in a recognizable pattern. Spreading that load let them do the same work with less server capacity.",
        },
      ],
    },
    {
      id: "code",
      kind: "example",
      title: "Putting it together in code",
      blocks: [
        {
          type: "p",
          text: "Here is a sketch of a client-side retry helper that applies everything above: a timeout on every call, retries only for errors that can succeed later, a local retry budget, capped exponential backoff with full jitter, and one idempotency key shared by all attempts. Names like `send`, `retryBudget` and `P999_LATENCY_MS` are placeholders, not a real SDK.",
        },
        {
          type: "code",
          language: "ts",
          code: code.retry,
          caption: "Our sketch. In a layered system, only one layer should run a loop like this.",
        },
      ],
    },
    {
      id: "tradeoffs",
      kind: "tradeoffs",
      title: "Trade-offs you should be able to defend",
      blocks: [
        {
          type: "table",
          caption: "Synthesized from the article; the rule-of-thumb column is ours.",
          columns: ["Technique", "Protects against", "Risk if misused", "Rule of thumb"],
          rows: [
            ["Timeout", "Resource exhaustion from stuck calls", "Too low: false timeouts and retry storms", "Set from p99.9 of the dependency; check what it covers"],
            ["Retry", "Transient errors", "Duplicate side effects; amplification", "Only server errors/timeouts; one layer; idempotent APIs"],
            ["Exponential backoff", "Hammering a struggling server", "Clients synchronize at the cap", "Always cap it, and add jitter"],
            ["Jitter", "Synchronized spikes", "Harder to reproduce timing bugs", "Random for retries; consistent per host for schedules"],
            ["Token bucket", "Retry storms during big outages", "Fewer retries when you'd want them", "Spend tokens per retry; refill slowly"],
            ["Circuit breaker", "Calling a dead dependency", "Modal behavior; slower recovery", "Prefer retry budgets; test both modes if you use one"],
          ],
        },
        {
          type: "p",
          text: "The article's closing advice ties the trade-offs together: transient failures and latency are inevitable, so plan for them, but be careful with retries. Retry when the dependency looks healthy, and stop when retrying no longer improves availability.",
        },
      ],
    },
    {
      id: "quiz",
      kind: "quiz",
      title: "Check your understanding",
      blocks: [
        {
          type: "quiz",
          questions: [
            {
              id: "q-timeout",
              prompt:
                "Your team accepts that about 1 in 1,000 healthy calls may be cut off by a timeout. Which value should the timeout be based on?",
              correctOptionId: "c",
              options: [
                {
                  id: "a",
                  text: "The dependency's average (mean) latency",
                  feedback: "Averages hide the tail. Many healthy requests are slower than the mean, so you'd time out far more than 0.1% of them.",
                },
                {
                  id: "b",
                  text: "A round number like 30 seconds, to be safe",
                  feedback: "A huge timeout lets stuck requests hold threads and connections for a long time, which can exhaust the server.",
                },
                {
                  id: "c",
                  text: "The dependency's p99.9 latency",
                  feedback: "Right. A 0.1% false-timeout budget maps to the 99.9th percentile of the downstream latency: Amazon's method.",
                },
              ],
            },
            {
              id: "q-amplification",
              prompt:
                "A request passes through 4 services before reaching a database. Each service makes up to 3 attempts. The database is down. How many requests can reach it per user request?",
              correctOptionId: "b",
              options: [
                {
                  id: "a",
                  text: "12",
                  feedback: "That adds the attempts (4 × 3). Retries multiply: each attempt at one layer triggers up to 3 attempts at the next.",
                },
                {
                  id: "b",
                  text: "81",
                  feedback: "Yes: 3⁴ = 81. That's why the article recommends retrying at a single point in the stack.",
                },
                {
                  id: "c",
                  text: "3",
                  feedback: "That's the load with retries at a single layer. With independent retries at every layer, it multiplies.",
                },
              ],
            },
            {
              id: "q-idempotency",
              prompt:
                "A payment call times out. You don't know if the charge happened. What makes it safe to retry?",
              correctOptionId: "a",
              options: [
                {
                  id: "a",
                  text: "Sending the same client-generated request ID with every attempt",
                  feedback: "Correct. The service recognizes the ID and returns an equivalent response instead of charging again.",
                },
                {
                  id: "b",
                  text: "Waiting longer before the retry",
                  feedback: "Backoff reduces load, but the second request would still create a second charge.",
                },
                {
                  id: "c",
                  text: "Letting the server detect duplicates from the amount and the card",
                  feedback: "Two identical charges can be intentional (two coffees). AWS prefers an explicit caller-provided request identifier.",
                },
              ],
            },
            {
              id: "q-jitter",
              prompt:
                "Thousands of mobile clients lose connection during a short outage and all use the same exponential backoff. What problem remains?",
              correctOptionId: "c",
              options: [
                {
                  id: "a",
                  text: "None: exponential backoff already spreads the load",
                  feedback: "It spaces out each client's attempts, but all clients compute the same waits, so they still return together.",
                },
                {
                  id: "b",
                  text: "They will retry client errors",
                  feedback: "Error classification is a separate concern. The issue here is timing.",
                },
                {
                  id: "c",
                  text: "Their retries arrive in synchronized waves; add jitter",
                  feedback: "Exactly. Randomizing each wait spreads the retries out, as the simulation shows.",
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "interview",
      kind: "interview",
      title: "Interview summary",
      blocks: [
        {
          type: "interview",
          pitchTitle: "Your 30-second answer",
          pitch:
            "Every remote call gets a timeout, set from the dependency's p99.9 latency so only about 0.1% of healthy calls are cut off. I retry only failures that can succeed later, like server errors and timeouts, never the same client error, and only at one layer of the stack, because independent retries multiply: three attempts across five layers is 243 times the load. Retries use capped exponential backoff with jitter so clients don't come back in sync, plus a token-bucket retry budget. Anything with side effects must be idempotent, with a client-generated request ID reused on every attempt.",
          keyPointsTitle: "Key points",
          keyPoints: [
            "Timeouts protect your resources; choose them from a latency percentile, not a guess.",
            "Retries are selfish: great for transient errors, harmful during overload.",
            "Retry server errors and timeouts, not client errors; retry at one layer only.",
            "Amplification is multiplicative: attempts^layers (3⁵ = 243).",
            "Backoff + cap + jitter + token bucket keep retries from synchronizing into storms.",
            "Side effects need idempotency: one request ID, equivalent response on retry.",
          ],
          followUpsTitle: "Likely follow-up questions",
          followUps: [
            {
              question: "Why not just use a circuit breaker?",
              answer:
                "It can help, but the article warns that circuit breakers add modal behavior that is hard to test and can slow recovery. A local retry budget (token bucket) limits retries continuously without a separate mode.",
            },
            {
              question: "Where should retries live in a microservices stack?",
              answer:
                "At a single point, usually the top-most layer that owns the user request. Lower layers fail fast and propagate the error, so retries don't multiply through the stack.",
            },
            {
              question: "How do you make an existing payments API idempotent?",
              answer:
                "Add a client-provided request ID to the contract, store it atomically with the result, return the stored, equivalent response for repeats within a retention window, and reject a reused ID with different parameters.",
            },
            {
              question: "What do you monitor to catch a retry storm?",
              answer:
                "The ratio of retries to first attempts, timeout rates per dependency, retry-budget exhaustion, and request rate at the bottom of the stack compared with user traffic. A gap between them is amplification.",
            },
          ],
        },
      ],
    },
    {
      id: "sources",
      kind: "sources",
      title: "Sources",
      blocks: [
        {
          type: "p",
          text: "This lesson is an original explanation. Quotes are reproduced verbatim from the sources below. The restaurant analogy, the sequence scenarios, the code sketch, the 180 ms example, the amplification chart (arithmetic) and the jitter chart (seeded simulation) are our own illustrations. The full-jitter definition is confirmed by the AWS SDK reference on retry behavior.",
        },
        { type: "sources" },
      ],
    },
  ],
};
