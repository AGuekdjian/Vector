import { AuditEvent } from "./audit.model";

export async function recordAudit(event, session) {
  if (event.operationId)
    return AuditEvent.findOneAndUpdate(
      { operationId: event.operationId },
      { $setOnInsert: event },
      { upsert: true, new: true, ...(session && { session }) },
    );
  const [created] = await AuditEvent.create(
    [event],
    session ? { session } : undefined,
  );
  return created;
}
