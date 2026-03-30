import { api } from "./api";

export type AvailableShiftType = "None" | "Morning" | "Evening" | "HalfDay" | "FullDay";
export type PreferredShiftType = "None" | "Morning" | "Evening" | "FullDay";

export type AvailabilitySlotResponse = {
  date: string;
  availableShiftType: AvailableShiftType;
  preferredShiftType: PreferredShiftType;
  note: string | null;
};

export type AvailabilitySubmissionResponse = {
  id: string;
  rosterWeekId: string;
  storeId: string;
  userId: string;
  status: string;
  note: string | null;
  submittedAtUtc: string | null;
  updatedAtUtc: string;
  slots: AvailabilitySlotResponse[];
};

export type SubmitAvailabilityRequest = {
  note: string | null;
  slots: {
    date: string;
    availableShiftType: AvailableShiftType;
    preferredShiftType: PreferredShiftType;
    note: string | null;
  }[];
};

export const getMyAvailabilitySubmission = async (
  rosterWeekId: string
): Promise<AvailabilitySubmissionResponse> => {
  const response = await api.get<AvailabilitySubmissionResponse>(
    `/api/roster-weeks/${rosterWeekId}/availability-submission`
  );
  return response.data;
};

export const upsertMyAvailabilitySubmission = async (
  rosterWeekId: string,
  request: SubmitAvailabilityRequest
): Promise<AvailabilitySubmissionResponse> => {
  const response = await api.put<AvailabilitySubmissionResponse>(
    `/api/roster-weeks/${rosterWeekId}/availability-submission`,
    request
  );
  return response.data;
};