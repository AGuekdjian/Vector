import { NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongoose";
import { withApiHandler } from "@/lib/http/api-handler";
import { requireUser } from "@/lib/permissions/authorize";
import { ServiceOrder } from "@/modules/service-orders/service-order.model";
export const GET = withApiHandler(async () => {
  await requireUser(["OWNER", "ADMIN"]);
  await connectDatabase();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const month = new Date(now.getFullYear(), now.getMonth(), 1);
  const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const [todayCount, monthCount, previousCount, byStatus] = await Promise.all([
    ServiceOrder.countDocuments({
      active: true,
      scheduledDate: { $gte: today },
    }),
    ServiceOrder.countDocuments({
      active: true,
      scheduledDate: { $gte: month },
    }),
    ServiceOrder.countDocuments({
      active: true,
      scheduledDate: { $gte: previous, $lt: month },
    }),
    ServiceOrder.aggregate([
      { $match: { active: true, scheduledDate: { $gte: month } } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
  ]);
  return NextResponse.json({
    today: todayCount,
    thisMonth: monthCount,
    previousMonth: previousCount,
    byStatus: Object.fromEntries(byStatus.map((x) => [x._id, x.count])),
  });
});
