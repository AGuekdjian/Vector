import { z } from "zod";
const optionalText = (max) =>
  z.string().trim().max(max).optional().or(z.literal(""));
const customerBaseSchema = z.object({
  customerType: z.enum(["PERSON", "COMPANY"]),
  firstName: optionalText(100),
  lastName: optionalText(100),
  companyName: optionalText(160),
  primaryPhone: z.string().trim().min(3).max(40),
  secondaryPhone: optionalText(40),
  email: z.email().optional().or(z.literal("")),
  subscriber: z.boolean(),
  customerSince: z.coerce.date().optional(),
  contractStart: z.coerce.date().optional(),
  contractEnd: z.coerce.date().optional(),
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
});
export const customerUpdateSchema = customerBaseSchema.partial();
