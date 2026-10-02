# 008 — desktop-dialogs — Design

## Approach

Implement dialog handler in `src/native/dialogs.ts`. Query dialog controls using standard Windows dialog IDs (`Edit: 1148` or `1001`, `Button: 1` [OK/Open], `Button: 2` [Cancel]).

## Deliverables

- `src/native/dialogs.ts`: File dialog and MessageBox interaction helpers.
- Tests verifying dialog detection and input.
