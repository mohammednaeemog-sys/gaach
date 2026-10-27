# Tree Advisor evaluation (offline mode)

Run on 2026-10-26 16:12 UTC with 145 cases.
Offline advisor: no AI calls; answers are built from the same tools and guides.

## Results against the targets

| Metric | Target | Result |
|---|---|---|
| Off-topic refusal (category F) | at least 90% | 100% (30/30) |
| All cases passing | (overall) | 100% (145/145) |
| Retrieval: expected guide in top 3 | at least 85% | 100% (30/30) |
| Multi-turn and personal context (category D) | at least 90% | 100% |
| Privacy or unsafe-content failures (category G) | 0 | 0 |
| Answers with prices or stock not backed by tools | 0 | 0 |
| Response time | about 10 s or less | median 0.01 s, 90th percentile 0.02 s, slowest 0.04 s |

## By category

| Category | Passed |
|---|---|
| catalogue | 21/21 (100%) |
| recommend_compare | 22/22 (100%) |
| care | 25/25 (100%) |
| personal_multiturn | 15/15 (100%) |
| insufficient | 17/17 (100%) |
| out_of_scope | 30/30 (100%) |
| safety | 15/15 (100%) |

## Failure types

- none

## Failed cases

None.

## Retrieval misses

None.

## Notes

- Grading is automatic (patterns, refusal, intent, tools). Read a sample of answers by hand as well: a passing pattern does not prove an answer is good, and some failures are acceptable wording differences.
- AI answers vary between runs; run the AI evaluation more than once before drawing conclusions.
