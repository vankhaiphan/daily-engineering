# Authoring guide

The reader: a software engineer studying on a phone during a one-hour bus ride, preparing for backend, platform and AI engineering interviews. Reading-first; no audio.

## Required structure (enforced by `content:validate`)
| Order | `kind` | Purpose |
|---|---|---|
| first | `intro` | A concrete, curious opening (an incident, a surprising number, an interview question), what the source is, and "By the end you will be able to…" |
| | `concept` | Intuition before mechanics: an everyday analogy, the vocabulary, one distinction to remember |
| | `deep-dive` (1+) | Progressive technical sections; each one adds a single idea |
| | `explore` (optional) | A section built around a visualization; ≥ 1 `interactive` block somewhere is required |
| | `example` | Concrete engineering: pseudocode, a config, a worked calculation |
| | `tradeoffs` | Failure modes and trade-offs, ideally a table |
| | `quiz` | ≥ 3 questions (aim for 4), 3 options each, feedback on every option |
| | `interview` | 30-second pitch, ≥ 3 key points, ≥ 2 follow-ups with model answers |
| last | `sources` | One paragraph stating what is quoted vs. our own illustration, then `{ type: "sources" }` |

Length: English ≥ 1,200 words (the existing lessons are 1,800–2,300). Each section 150–300 words. Translations are checked for truncation (word ratio 0.6–2.2 vs English).

## Pedagogy
- Lead with the learner's problem, not the article's table of contents.
- One idea per paragraph. Bold the term when it is first defined.
- Every abstraction gets a number or an example within two paragraphs.
- Teach the failure mode next to the technique (how it breaks, how to notice).
- Quiz questions target misconceptions; each wrong option's feedback explains *why* it's tempting and wrong. Vary the position of the right answer.
- The interview pitch is spoken English, first person, under ~120 words.

## Originality and attribution
- Explain in your own words. At most 6 quotes, each ≤ 300 characters, verbatim, with `sourceId`. Never paste paragraphs.
- Say "the article…" when reporting the source's claims; say "our example" for your illustrations.
- Every number or fact you teach must appear in `review.ts` (see `verification.md`).

## Inline markup
`**bold**`, `*italic*`, `` `code` ``. No HTML, no links inside text (sources are listed in the sources section).

## Translation (VI, FR)
- Same section ids, block order, list lengths, quiz option ids and answer keys as English (validated).
- Translate meaning, not words. Read it aloud in your head: would a senior engineer from that country write this sentence?
- Keep technical terms engineers actually use. Vietnamese commonly keeps English terms (agent, prompt, workflow, retry, timeout, token bucket, idempotency) and explains them once in parentheses. French translates where an established term exists (reprise, journalisation, idempotence) and keeps English otherwise (prompt, backoff, jitter), sometimes in parentheses.
- Code identifiers, string literals, API names and metric names (pass@k, p99.9) stay unchanged; code comments are localized through `codeFor(locale)`.
- Quotes stay in English with a `translation` field.
- Typography: French uses non-breaking spaces before `: ; ? !` and « guillemets »; Vietnamese and French use a decimal comma in prose (0,95), but keep a dot inside code and formulas.
- Numbers in captions must match across languages.
