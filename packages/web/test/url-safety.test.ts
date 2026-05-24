import { describe, expect, it } from "vitest";
import { Effect, Exit } from "effect";

import { UrlSafetyService } from "../src/services/url-safety.ts";

const withUrlSafety = <A, E>(effect: Effect.Effect<A, E, UrlSafetyService>) =>
  effect.pipe(Effect.provide(UrlSafetyService.Default));

describe("UrlSafetyService", () => {
  it("allows public https URLs", async () => {
    const result = await Effect.runPromise(
      withUrlSafety(
        Effect.gen(function* () {
          const service = yield* UrlSafetyService;
          return yield* service.assertHttpUrl("https://example.com/docs");
        }),
      ),
    );
    expect(result).toBe("https://example.com/docs");
  });

  it("blocks loopback hosts", async () => {
    const exit = await Effect.runPromiseExit(
      withUrlSafety(
        Effect.gen(function* () {
          const service = yield* UrlSafetyService;
          return yield* service.assertHttpUrl("http://127.0.0.1:4788/mcp");
        }),
      ),
    );
    expect(Exit.isFailure(exit)).toBe(true);
  });
});
