import { z } from "zod";
const oid = z.string().regex(/^[a-f\d]{24}$/i);
const optionalOid = oid.nullable().optional();
export const orderCreateSchema = z.object({
  externalOrderNumber: z.string().trim().min(1).max(80),
  customerId: oid,
  installationId: oid,
  responsibleTechnicianId: optionalOid,
  companionEmployeeId: optionalOid,
  vehicleId: optionalOid,
  scheduledDate: z.coerce.date(),
  scheduledTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  sequence: z.number().int().min(0).optional(),
  workDescription: z.string().trim().min(1).max(4000),
  technicianNote: z.string().trim().max(4000).optional().or(z.literal("")),
  internalNote: z.string().trim().max(4000).optional().or(z.literal("")),
  parentServiceOrderId: optionalOid,
});
export const orderUpdateSchema = orderCreateSchema
  .omit({ externalOrderNumber: true, customerId: true, installationId: true })
  .partial();
export const completionSchema = z.discriminatedUnion("result", [
  z.object({
    result: z.literal("COMPLETED"),
    observation: z.string().trim().min(3).max(4000),
  }),
  z.object({
    result: z.literal("REQUIRES_QUOTE"),
    observation: z.string().trim().min(3).max(4000),
    quoteDetails: z.string().trim().min(3).max(4000),
  }),
  z.object({
    result: z.literal("NOT_COMPLETED"),
    observation: z.string().trim().max(4000).optional(),
    notCompletedReasonId: oid,
  }),
]);
