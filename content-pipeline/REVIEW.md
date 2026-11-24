# Technical review checklist

Automated gates check structure, references and consistency. They can't judge whether the engineering is right. That's this checklist. Copy it into the PR and tick it.

## Accuracy
- [ ] Every ⚠️ `needs-review` claim in `reviews/<slug>.md` is resolved: confirmed against a primary source (then `status: "verified"` with a short quote), or rewritten/removed in **all three** languages.
- [ ] Spot-check at least 5 ✅ claims: open the source and find the quoted words.
- [ ] Numbers in the text, captions, quiz and interview answers agree with each other and with the sources (including VI and FR captions).
- [ ] Our own examples (pseudocode, configs, scenarios) are correct and clearly labelled as ours, not as the source's.
- [ ] Simulated or computed charts say how numbers were made (`method`) and don't look like measurements.
- [ ] Nothing is stated more strongly than the source does (e.g. "always", "Amazon requires").

## Teaching quality
- [ ] The intro makes you want to read on; the intuition section works without prior knowledge.
- [ ] Each visualization changes something the learner can see when they act (scenario, step, slider). No decorative visuals.
- [ ] Quiz: one defensible answer per question; wrong-option feedback explains the misconception.
- [ ] The interview pitch is something you would actually say.

## Languages
- [ ] VI and FR read naturally (not word-for-word); technical terms follow `references/authoring.md`.
- [ ] Code identifiers unchanged; comments translated.

## Phone
- [ ] Read the lesson on the PR's preview deployment on an iPhone: text size, dark mode, every visualization played with touch.

## Attribution
- [ ] Source titles, authors, dates and URLs match the pages (dates `null` where the page shows none).
- [ ] No passage longer than a short quote is copied.

When everything is ticked: `npm run content:publish -- <slug> --reviewer "<name>"`.
