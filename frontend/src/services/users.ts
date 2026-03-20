import { api } from "./api";

export type StaffType = "Regular" | "AllRounder" | "Trainer";

export type UserStoreDto = {
  id: string;
  name: string;
  location: string;
  status: string;
};

export type UserDto = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  staffType: StaffType;
  createdAtUtc?: string;
  stores: UserStoreDto[];
};

export type CreateUserRequest = {
  fullName: string;
  email: string;
  role: string;
  staffType: StaffType;
  storeIds: string[];
};

export type UpdateUserRequest = {
  fullName: string;
  role: string;
  staffType: StaffType;
  storeIds: string[];
};

export const getUsers = async (): Promise<UserDto[]> => {
  const response = await api.get<UserDto[]>("/api/users");
  return response.data;
};

export const createUser = async (
  request: CreateUserRequest
): Promise<UserDto> => {
  const response = await api.post<UserDto>("/api/users", request);
  return response.data;
};

export const updateUser = async (
  id: string,
  request: UpdateUserRequest
): Promise<UserDto> => {
  const response = await api.put<UserDto>(`/api/users/${id}`, request);
  return response.data;
};

export const deleteUser = async (id: string): Promise<void> => {
  await api.delete(`/api/users/${id}`);
};