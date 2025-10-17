import dayjs from "dayjs";
import { FilterPeriods } from "~/types/enums/filter-periods.enum";

export function getPeriodByFilterEnum(
  filter: FilterPeriods,
): [Date | null, Date | null] {
  const now = dayjs();
  let startDate = null as Date | null;
  let endDate = null as Date | null;

  switch (filter) {
    case FilterPeriods.last7Days:
      startDate = now.subtract(7, "day").startOf("day").toDate();
      endDate = now.toDate();
      break;
    case FilterPeriods.last30Days:
      startDate = now.subtract(30, "day").startOf("day").toDate();
      endDate = now.toDate();
      break;
    case FilterPeriods.last90Days:
      startDate = now.subtract(90, "day").startOf("day").toDate();
      endDate = now.toDate();
      break;
    default:
      break;
  }

  return [startDate, endDate];
}
