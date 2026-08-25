import { expect, it } from "vitest";
import { GET } from "@/app/api/health/route";

it("returns a traceable health response", async () => {
  const response = await GET(new Request("http://localhost/api/health"), {});
  const body = await response.json();
  expect(response.status).toBe(200);
  expect(body.requestId).toMatch(/^req_/);
  expect(response.headers.get("x-request-id")).toBe(body.requestId);
});
