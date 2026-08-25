import { expect, it } from "vitest";
import { toTechnicianCustomer } from "@/modules/service-orders/order.visibility";
it("removes every administrative customer field from technician payloads", () => {
  const result = toTechnicianCustomer({
    firstName: "Ana",
    subscriber: true,
    customerSince: "x",
    contractStart: "x",
    contractEnd: "x",
    paymentMethod: "card",
    internalNotes: "secret",
  });
  expect(result).toEqual({ firstName: "Ana", subscriber: true });
});
