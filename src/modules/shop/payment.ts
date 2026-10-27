import "server-only";
import { randomBytes } from "crypto";

// Online payments go through an external gateway (FR-5.4). This build ships a
// test-mode gateway: the customer is sent to a separate payment page and Gaach
// only receives a success or failure result and a reference. Gaach never sees
// or stores card numbers (NFR-3.4). A real gateway such as SSLCommerz or bKash
// can replace this module with the same two functions.
export const gateway = {
  name: "Test gateway",
  startPayment(orderId: string) {
    return `/pay/test/${orderId}`;
  },
  newReference() {
    return "TEST-" + randomBytes(5).toString("hex").toUpperCase();
  },
};
