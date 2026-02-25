// src/types/auth.ts
export interface LoginRequest {
  phone: string;
  password: string;
}

export interface LoginResponse {
  vendorId: number;
  name: string;
  serviceType: "GROCERY" | "RESTAURANT" | "CANTEEN"; // Add other types if needed
  token: string;
}
// Add this to the existing file
export interface SignupRequest {
  name: string;        // Matches "Business Name"
  phone: string;       // Matches "Phone Number"
  password: string;    // Required by API
  serviceType: "GROCERY" | "CANTEEN"; 
}

export interface SignupResponse {
  vendorId: number;
  message: string;
  // Add other fields if your API returns a token immediately on signup
}
// ... existing types ...

export interface VendorProfile {
  vendorId: number;
  name: string;
  phone: string;
  serviceType: string;
  outletName: string | null;
  outletImageUrl?: string | null;
  outletImage?: string | null;
  imageUrl?: string | null;
  address: string | null;
  openingTime: string | null;
  closingTime: string | null;
  onboarded: boolean;
  onboardedAt: string | null;
}

export interface OnboardingRequest {
  outletName: string;
  address: string;
  openingTime: string; // Format HH:mm:ss
  closingTime: string; // Format HH:mm:ss
}
