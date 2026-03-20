import { api } from "./api";

export type StoreStatus = "Active" | "Needs Attention" | "Setup";

export type StoreDto = {
  id: string;
  name: string;
  location: string;
  status: StoreStatus;
  employeeCount?: number;
  pendingRequests?: number;
  updatedAtUtc?: string;
};

export type CreateStoreRequest = {
  name: string;
  location: string;
};

export const getStores = async (): Promise<StoreDto[]> => {
  const response = await api.get<StoreDto[]>("/api/stores");
  return response.data;
};

export const createStore = async (
  request: CreateStoreRequest
): Promise<StoreDto> => {
  const response = await api.post<StoreDto>("/api/stores", request);
  return response.data;
};