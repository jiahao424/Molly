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

export type RosterWeekAvailabilityDayResponse = {
  date: string;
  availableShiftType: "None" | "Morning" | "Evening" | "HalfDay" | "FullDay";
  preferredShiftType: "None" | "Morning" | "Evening" | "FullDay";
  note: string | null;
};

export type RosterWeekAvailabilitySubmissionResponse = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  storeId: string;
  rosterWeekId: string;
  status: string;
  note: string | null;
  submittedAtUtc: string | null;
  updatedAtUtc: string;
  days: RosterWeekAvailabilityDayResponse[];
};

export const getRosterWeekAvailabilitySubmissions = async (
  storeId: string,
  rosterWeekId: string
): Promise<RosterWeekAvailabilitySubmissionResponse[]> => {
  const response = await api.get<RosterWeekAvailabilitySubmissionResponse[]>(
    `/api/stores/${storeId}/roster-weeks/${rosterWeekId}/availability-submissions`
  );
  return response.data;
};