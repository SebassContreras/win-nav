# 003 — qa-loop — Tasks

Status legend: `todo` · `in_progress` · `blocked` · `interrupted` · `done`
Owner: `agent` (loop-runnable) · `human` (skipped by the loop)

- [x] T001 [agent] [status:done] Define assertion schemas and types in `src/ops/qa.ts`.
      └─ Defined QAAssertionKind, QAAssertion, AssertionResult, and QAReport types.
- [x] T002 [agent] [status:done] Implement evaluation logic for visible, text, and enabled assertions.
      └─ Implemented evaluateAssertion, evaluateAssertions, assertQALoop, and findElementInSnapshot.
- [x] T003 [agent] [status:done] Add unit tests in `src/ops/qa.test.ts` for assertion outcomes.
      └─ Added 13 tests covering window title, visible/not-visible, enabled/disabled, text (string and regex), and assertQALoop failure exit code 1. All passed.
