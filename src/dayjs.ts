import dayjs from "dayjs";
import ptBr from "dayjs/locale/pt-br";
import dayjsCustomParseFormat from "dayjs/plugin/customParseFormat";
import dayjsTimezone from "dayjs/plugin/timezone";
import dayjsUtc from "dayjs/plugin/utc";
import dayjsWeekday from "dayjs/plugin/weekday";

dayjs.locale(ptBr);
dayjs.extend(dayjsUtc);
dayjs.extend(dayjsWeekday);
dayjs.extend(dayjsTimezone);
dayjs.extend(dayjsCustomParseFormat);
