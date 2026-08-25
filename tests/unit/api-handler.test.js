import { describe, expect, it } from "vitest";
import { isAllowedRequestOrigin } from "@/lib/http/api-handler";

const request = (headers) =>
  new Request("http://0.0.0.0:3000/api/auth/login", {
    method: "POST",
    headers,
  });

describe("request origin validation", () => {
  it("accepts the browser origin exposed by Docker instead of the internal bind address", () => {
    expect(
      isAllowedRequestOrigin(
        request({ host: "localhost:3000", origin: "http://localhost:3000" }),
      ),
    ).toBe(true);
  });

  it("uses trusted proxy host and protocol when present", () => {
    expect(
      isAllowedRequestOrigin(
        request({
          host: "vector-app:3000",
          origin: "https://vector.example.com",
          "x-forwarded-host": "vector.example.com",
          "x-forwarded-proto": "https",
        }),
      ),
    ).toBe(true);
  });

  it("rejects cross-origin state changes", () => {
    expect(
      isAllowedRequestOrigin(
        request({ host: "localhost:3000", origin: "https://evil.example" }),
      ),
    ).toBe(false);
  });
});
