export type UserRole = "Manager" | "Employee";

export type LoginRequest = {
  email: string;
  password: string;
};

export type AuthResponse = {
  token: string;
  email: string;
  fullName: string;
  role: UserRole;
};

export type CurrentUserResponse = {
  email: string;
  fullName: string;
  role: UserRole;
};