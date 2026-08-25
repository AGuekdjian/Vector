export const TECHNICIAN_ORDER_PROJECTION = "-internalNote";
export const TECHNICIAN_CUSTOMER_PROJECTION =
  "customerType firstName lastName companyName primaryPhone secondaryPhone subscriber";
const forbiddenCustomerFields = [
  "customerSince",
  "contractStart",
  "contractEnd",
  "paymentMethod",
  "internalNotes",
];
export function toTechnicianCustomer(customer) {
  const safe = { ...customer };
  for (const field of forbiddenCustomerFields) delete safe[field];
  return safe;
}
