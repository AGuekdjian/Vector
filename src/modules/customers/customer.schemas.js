import { z } from "zod";
const optionalText = (max) =>
  z.string().trim().max(max).optional().or(z.literal(""));
const optionalDate = z.preprocess(
  (value) => (value === "" || value == null ? undefined : value),
  z.coerce.date().optional(),
);
const customerBaseSchema = z.object({
  customerType: z.enum(["PERSON", "COMPANY"]),
  firstName: optionalText(100),
  lastName: optionalText(100),
  companyName: optionalText(160),
  customerNumber: z.string().trim().min(1).max(80),
  subscriberNumber: optionalText(80),
  primaryPhone: z.string().trim().min(3).max(40),
  secondaryPhone: optionalText(40),
  email: z.email().optional().or(z.literal("")),
  address: z.string().trim().min(3).max(300),
  department: optionalText(100),
  subscriber: z.boolean(),
  customerSince: optionalDate,
  contractStart: optionalDate,
  contractEnd: optionalDate,
  paymentMethod: optionalText(100),
  internalNotes: optionalText(4000),
});
export const customerSchema = customerBaseSchema.superRefine((data, ctx) => {
  if (data.customerType === "PERSON" && (!data.firstName || !data.lastName))
    ctx.addIssue({
      code: "custom",
      message: "Nombre y apellido son obligatorios.",
    });
  if (data.customerType === "COMPANY" && !data.companyName)
    ctx.addIssue({
      code: "custom",
      message: "La razón social es obligatoria.",
    });
  if (data.subscriber && !data.subscriberNumber)
    ctx.addIssue({
      code: "custom",
      path: ["subscriberNumber"],
      message: "El número de abonado es obligatorio para abonados.",
    });
});
export const customerUpdateSchema = customerBaseSchema.partial();
