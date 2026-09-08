import { afterEach, describe, expect, it, vi } from "vitest";

import { Env } from "@/shared/infra/env/env";

/**
 * `Env` lee `process.env` en cada getter (no cachea nada), así que alcanza
 * con `vi.stubEnv` por test — sin esto un test podría dejar pisada una
 * variable y romper el que corre después.
 */
afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Env.validate — falla rápido en producción, no en el resto", () => {
  it("no valida nada fuera de producción, aunque JWT_SECRET sea el placeholder", () => {
    vi.stubEnv("NODE_ENV", "local");
    vi.stubEnv("JWT_SECRET", "change-me-to-a-long-random-string");
    vi.stubEnv("FRONTEND_URL", "");

    expect(() => Env.validate()).not.toThrow();
  });

  it("rechaza arrancar en producción si JWT_SECRET sigue siendo el valor de ejemplo", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("JWT_SECRET", "change-me-to-a-long-random-string");
    vi.stubEnv("FRONTEND_URL", "https://bioestancia-app.vercel.app");

    expect(() => Env.validate()).toThrow(/JWT_SECRET/);
  });

  it("rechaza arrancar en producción si falta FRONTEND_URL", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("JWT_SECRET", "un-secreto-generado-de-verdad-bien-largo");
    vi.stubEnv("FRONTEND_URL", "");

    expect(() => Env.validate()).toThrow(/FRONTEND_URL/);
  });

  it("no lanza en producción con JWT_SECRET real y FRONTEND_URL cargada", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("JWT_SECRET", "un-secreto-generado-de-verdad-bien-largo");
    vi.stubEnv("FRONTEND_URL", "https://bioestancia-app.vercel.app");

    expect(() => Env.validate()).not.toThrow();
  });
});

describe("Env.frontendUrl", () => {
  it("es null cuando no está cargada (caso normal en local/development/test)", () => {
    vi.stubEnv("FRONTEND_URL", "");
    expect(Env.frontendUrl).toBeNull();
  });

  it("devuelve el valor cargado", () => {
    vi.stubEnv("FRONTEND_URL", "https://bioestancia-app.vercel.app");
    expect(Env.frontendUrl).toBe("https://bioestancia-app.vercel.app");
  });
});
