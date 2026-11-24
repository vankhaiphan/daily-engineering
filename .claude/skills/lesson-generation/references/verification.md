# Verifying claims

A lesson may only teach what a source says (quoted), what we derive (shown), or what we clearly label as our illustration. `review.ts` is the audit trail; `content:validate` and `content:publish` enforce it.

## Claim statuses
| Status | When | `evidence` | Effect |
|---|---|---|---|
| `verified` | The source says it, and you saw the words in this run | Short verbatim quote(s), ≤ 300 chars, `/`-separated | none |
| `derived` | Our math, simulation or example | How it was derived and which unit test checks it | none |
| `needs-review` | You couldn't load the source, the quote is paraphrased, numbers disagree between sources, or it relies on memory | What you know and what's missing, plus a `note` saying how to confirm | **blocks publishing**; listed in the review report |

## Protocol
1. Ask WebFetch for **verbatim** quotes of specific claims, not a summary. Summaries paraphrase; a paraphrase is not evidence.
2. If a page won't load or returns navigation only, try the canonical URL or a redirect target once. Then stop and flag. Record the access problem in `content-pipeline/sources.json`.
3. Authors and dates: exactly as shown on the page (e.g. AWS Builder Center shows only "Marc"). No date shown → `publishedOn: null`.
4. Internal or single-source results (e.g. "improved success by 10 points in internal testing"): attribute them in the text ("the team reports…") and verify the quote.
5. Before finishing, reread every paragraph and table row: each factual sentence should map to a claim. Add the missing ones or rewrite the sentence as clearly ours.

## What a human reviewer does with flags
For each `needs-review` claim: confirm it against a primary source and change it to `verified` with the quote, or rewrite/remove the sentence in all three languages. Then `npm run content:validate -- <slug> --publish` must pass.
