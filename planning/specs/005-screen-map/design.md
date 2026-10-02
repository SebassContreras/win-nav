# 005 — screen-map — Design

## Approach

Implement screen map models in `src/screens/screen-map.ts`. Validate with `ajv` against `schemas/screen-map.schema.json`. Implement compact view renderer in `src/screens/compact-view.ts`. Implement learning generator in `src/screens/learn.ts` to convert live UIA snapshots into validated screen maps.

## Deliverables

- `src/screens/screen-map.ts`: Schema validator and screen loader.
- `src/screens/matcher.ts`: Window title regex and form matching.
- `src/screens/compact-view.ts`: Human and LLM readable compact view generator.
- `src/screens/learn.ts`: Screen learning and merge algorithm.
