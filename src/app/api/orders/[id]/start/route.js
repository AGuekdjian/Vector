import { NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongoose";
import { withApiHandler } from "@/lib/http/api-handler";
import { requireUser } from "@/lib/permissions/authorize";
import { objectId } from "@/lib/validation/request";
import { startOrder } from "@/modules/service-orders/order.service";
export const POST = withApiHandler(
  async (_request, { params }, { requestId }) => {
    const actor = await requireUser();
    const { id } = await params;
    objectId(id);
    await connectDatabase();
    return NextResponse.json({
      item: await startOrder({ orderId: id, actor, requestId }),
    });
  },
);
