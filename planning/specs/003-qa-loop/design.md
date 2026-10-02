# 003 — qa-loop — Design

## Approach

Create QA evaluation engine in `src/ops/qa.ts`. Parse assertion list, evaluate against fresh snapshot or live UI Automation tree, and output pass/fail verdict with failure details.

## Deliverables

- `src/ops/qa.ts`: Assertion definitions and runner.
- `src/ops/qa.test.ts`: Verification of equality, regex matching, and visibility assertions.
