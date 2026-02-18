import { api } from "../lib/api";
import type { LoginRequest, LoginResponse, SignupRequest, SignupResponse } from "../types/auth";

export const authService = {
  login: async (data: LoginRequest) => {
    const response = await api.post<LoginResponse>('/vendor/auth/login', data);
    return response.data;
  },
  signup: async (data: SignupRequest) => {
    const response = await api.post<SignupResponse>('/vendor/auth/signup', data);
    return response.data;
  }
};
