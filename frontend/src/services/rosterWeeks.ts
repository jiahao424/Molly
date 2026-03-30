import { api } from "./api";

export type RosterWeek = {
  id: string;
  storeId: string;
  weekStartDate: string;
  weekEndDate: string;
  status: string;
  availabilityOpenAtUtc: string;
  availabilityCloseAtUtc: string;
  publishedAtUtc: string | null;
  createdAtUtc: string;
  updatedAtUtc: string;
};

export type CreateNextRosterWeekRequest = {
  availabilityCloseAtUtc?: string;
};

export async function getRosterWeeks(storeId: string): Promise<RosterWeek[]> {
  const response = await api.get<RosterWeek[]>(
    `/api/stores/${storeId}/roster-weeks`
  );
  return response.data;
}

export async function createNextRosterWeek(
  storeId: string,
  request?: CreateNextRosterWeekRequest
): Promise<RosterWeek> {
  const response = await api.post<RosterWeek>(
    `/api/stores/${storeId}/roster-weeks/next`,
    request ?? {}
  );
  return response.data;
}