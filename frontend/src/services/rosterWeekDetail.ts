import { api } from "./api";

export type OpenRosterWeekItem = {
  rosterWeekId: string;
  storeId: string;
  storeName: string;
  storeLocation: string;
  weekStartDate: string;
  weekEndDate: string;
  status: string;
  availabilityOpenAtUtc: string;
  availabilityCloseAtUtc: string;
  hasSubmission: boolean;
};

export const getOpenRosterWeeks = async (): Promise<OpenRosterWeekItem[]> => {
  const response = await api.get<OpenRosterWeekItem[]>("/api/my/roster-weeks/open");
  return response.data;
};

export type RosterWeekDetail = {
  id: string;
  storeId: string;
  storeName: string;
  storeLocation: string;
  weekStartDate: string;
  weekEndDate: string;
  status: string;
  availabilityOpenAtUtc: string;
  availabilityCloseAtUtc: string;
  publishedAtUtc: string | null;
  createdAtUtc: string;
  updatedAtUtc: string;
};

export const getRosterWeekDetail = async (
  storeId: string,
  rosterWeekId: string
): Promise<RosterWeekDetail> => {
  const response = await api.get<RosterWeekDetail>(
    `/api/stores/${storeId}/roster-weeks/${rosterWeekId}`
  );
  return response.data;
};