---
title: "The AI Pilot That Should Never Reach Production"
date: "2026-07-29"
slug: "ai-pilot-should-never-reach-production"
author: "Pablo Magaz"
excerpt: "A demo that impresses the board is not evidence of anything yet. The three things a pilot has to produce before it earns a promotion — and why killing one is a success, not a failure."
category: "ai"
keywords: ["ai pilot to production", "ai proof of concept", "llm in production", "ai project failure rate", "applied ai strategy", "how to evaluate an ai pilot", "ai production readiness checklist"]
---

## Table of Contents
- [What the Demo Hides](#what-the-demo-hides)
- [Three Things That Earn a Promotion](#three-things-that-earn-a-promotion)
- [Killing It Is the Pilot Working](#killing-it-is-the-pilot-working)

A demo that impresses the board is not evidence of anything yet. It is evidence that the happy path works on curated inputs, which is the least interesting thing you can learn about a system.

## What the Demo Hides

Pilots are optimised for persuasion. Production is optimised for the tenth-percentile day — the malformed input, the timeout, the customer who phrases the question in a way nobody anticipated, the request that arrives while the vendor is having an incident.

Between those two sits most of the engineering, most of the cost, and all of the risk.

> The question is not "did it work?" but "what did we learn about the cases where it will not?"

A pilot that cannot answer the second question has not finished, no matter how good the recording looks.

## Three Things That Earn a Promotion

Before anything I own goes from pilot to production, it has to produce three artefacts:

1. **A measurable definition of a wrong answer.** Not "it sometimes hallucinates" — a specific, countable failure mode with a rate attached to it.
2. **A path for a human to intervene that is faster than the model.** If the escape hatch is slower than the thing it is rescuing, nobody will use it under load.
3. **An owner accountable for the output, not the launch.** Launch owners disappear at go-live. Output owners are still there in month six when the distribution shifts.

None of these are technical problems, which is exactly why they get skipped in a technical review.

## Killing It Is the Pilot Working

The hardest part is organisational. By the time a pilot has been demoed to the board, it has sponsors, and sponsors do not like the word "no".

But a pilot exists to produce a decision, and "we are not shipping this" is a perfectly good decision. Killing a pilot that cannot produce those three artefacts is not a failed project. It is a cheap answer to an expensive question, which is the entire point of running a pilot in the first place.

The failure mode is not killing pilots. It is promoting them because stopping would be awkward.

*Next up: buy, build, or wait — and why the third option almost never makes the slide.*
