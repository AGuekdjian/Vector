import { ServiceOrder } from "./service-order.model";

export async function appendOrderTimeline({
  orderId,
  actorUserId,
  action,
  operationId,
  metadata,
  session,
}) {
  const filter = { _id: orderId, active: true };
  if (operationId) filter["timeline.operationId"] = { $ne: operationId };
  return ServiceOrder.updateOne(
    filter,
    {
      $push: {
        timeline: {
          action,
          actorUserId,
          operationId,
          metadata,
          createdAt: new Date(),
        },
      },
    },
    session ? { session } : undefined,
  );
}
