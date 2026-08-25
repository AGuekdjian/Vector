import { z } from "zod";
const optional = (max) =>
  z.string().trim().max(max).optional().or(z.literal(""));
export const systemSchema = z.object({
  installationId: z.string().regex(/^[a-f\d]{24}$/i),
  type: z.enum(["ALARM", "CCTV", "ACCESS_CONTROL", "OTHER"]),
  brand: optional(100),
  model: optional(100),
  description: optional(2000),
  technicalNotes: optional(4000),
  installedAt: z.coerce.date().optional(),
  imei: optional(100),
  serialNumber: optional(200),
});
export const systemUpdateSchema = systemSchema
  .omit({ installationId: true })
  .partial();
