import { UpTimeStatus } from "~/types/enums/up-time-status.enum";

export class GetProjectsResponse {
  name: string;
  createdAt: Date;
  upTimeStatus: UpTimeStatus;
}
