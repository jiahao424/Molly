import { api } from "./api";
import type {
  AuthResponse,
  CurrentUserResponse,
  LoginRequest,
} from "../types/auth";

const TOKEN_KEY = "token";
const USER_KEY = "user";

export async function login(request: LoginRequest): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>("/api/auth/login", request);
  return response.data;
}

export async function getCurrentUser(): Promise<CurrentUserResponse> {
  const response = await api.get<CurrentUserResponse>("/api/auth/me");
  return response.data;
}

export function saveAuth(auth: AuthResponse) {
  localStorage.setItem(TOKEN_KEY, auth.token);
  localStorage.setItem(USER_KEY, JSON.stringify(auth));
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthResponse | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthResponse;
  } catch {
    return null;
  }
}