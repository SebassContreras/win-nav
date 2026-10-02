export const VERSION = "0.1.0";
export const APP_NAME = "win-nav";

// Core exports
export * from "./core/errors.js";
export * from "./core/snapshot.js";
export * from "./core/ref-store.js";
export * from "./core/security-gate.js";
export * from "./core/actions.js";

// Native exports
export * from "./native/types.js";
export * from "./native/uia-bridge.js";

// Ops exports
export * from "./ops/qa.js";

// Screen map exports
export * from "./screens/screen-map.js";
export * from "./screens/matcher.js";
export * from "./screens/compact-view.js";
export * from "./screens/learn.js";
