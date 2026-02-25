import { api } from "../lib/api";
import type { LoginRequest, LoginResponse, OnboardingRequest, SignupRequest, SignupResponse, VendorProfile } from "../types/auth";

export const authService = {
  login: async (data: LoginRequest) => {
    const response = await api.post<LoginResponse>('/vendor/auth/login', data);
    return response.data;
  },
  signup: async (data: SignupRequest) => {
    const response = await api.post<SignupResponse>('/vendor/auth/signup', data);
    return response.data;
  },
  getMe: async () => {
    const response = await api.get<VendorProfile>('/vendor/me');
    return response.data;
  },
  uploadOutletImage: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/vendor/me/image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // 2. Complete Onboarding
  completeOnboarding: async (data: OnboardingRequest) => {
    const response = await api.post('/vendor/me/complete', data);
    return response.data;
  }
};
