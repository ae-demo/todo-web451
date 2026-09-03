// Typed, synchronous read of the platform-mounted /env-config.js. Every key
// here is set at request time by the platform — never at build time — so
// this module must never fall back to a default for a key this app depends
// on: a silent `?? ""` would hide a missing OIDC issuer until deploy.
type Env = {
  // OIDC config for the `thunder` platform-resource auth dependency.
  THUNDER_CLIENT_ID: string;
  THUNDER_ISSUER: string;
  THUNDER_JWKS_URL: string;
  THUNDER_SCOPES: string;
};

declare global {
  interface Window {
    _env_: Env;
  }
}

if (!window._env_) {
  throw new Error(
    "window._env_ not set — /env-config.js failed to load. " +
      "The platform mounts this file; if you see this locally, host " +
      "/env-config.js from your dev server.",
  );
}

export const env: Env = window._env_;
