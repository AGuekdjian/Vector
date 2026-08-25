import { z } from "zod";
export const installationSchema = z.object({
  customerId: z.string().regex(/^[a-f\d]{24}$/i),
  name: z.string().trim().min(1).max(120),
  address: z.string().trim().min(3).max(300),
  department: z.string().trim().max(100).optional().or(z.literal("")),
});
export const installationUpdateSchema = installationSchema
  .omit({ customerId: true })
  .partial();
