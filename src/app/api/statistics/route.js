import { NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongoose";
import { withApiHandler } from "@/lib/http/api-handler";
import { requireUser } from "@/lib/permissions/authorize";
import { ServiceOrder } from "@/modules/service-orders/service-order.model";
import { getUruguayCalendarBoundaries } from "@/shared/date";
export const GET = withApiHandler(async () => {
  await requireUser(["OWNER", "ADMIN"]);
  await connectDatabase();
  const {
    today,
    tomorrow,
    month,
    nextMonth,
    previousMonth: previous,
  } = getUruguayCalendarBoundaries();
  const [result] = await ServiceOrder.aggregate([
    {
      $match: {
        active: true,
        scheduledDate: { $gte: previous, $lt: nextMonth },
      },
    },
    {
      $facet: {
        today: [
          { $match: { scheduledDate: { $gte: today, $lt: tomorrow } } },
          { $count: "value" },
        ],
        thisMonth: [
          { $match: { scheduledDate: { $gte: month, $lt: nextMonth } } },
          { $count: "value" },
        ],
        previousMonth: [
          { $match: { scheduledDate: { $gte: previous, $lt: month } } },
          { $count: "value" },
        ],
        byStatus: [
          { $match: { scheduledDate: { $gte: month, $lt: nextMonth } } },
          { $group: { _id: "$status", count: { $sum: 1 } } },
        ],
      },
    },
  ]);
  return NextResponse.json({
    today: result.today[0]?.value || 0,
    thisMonth: result.thisMonth[0]?.value || 0,
    previousMonth: result.previousMonth[0]?.value || 0,
    byStatus: Object.fromEntries(result.byStatus.map((x) => [x._id, x.count])),
  });
});
