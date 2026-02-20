import { api } from "../lib/api";
import type { MenuItem, MenuFilterParams, AddMenuItemRequest, UpdateMenuItemRequest } from "../types/menu";

export const menuService = {
  // 1. Get Menu with filters
  getMenu: async (params?: MenuFilterParams) => {
    // Construct query string manually to handle optional params cleanly
    const searchParams = new URLSearchParams();
    if (params?.section) searchParams.append("section", params.section);
    if (params?.category && params.category !== "All") searchParams.append("category", params.category);
    
    const response = await api.get<MenuItem[]>(`/vendor/canteen/menu?${searchParams.toString()}`);
    return response.data;
  },

  // 2. Toggle Availability (PATCH)
  toggleAvailability: async (itemId: number, active: boolean) => {
    // The API expects boolean active in query param as per your prompt
    const response = await api.put(`/vendor/canteen/menu/${itemId}/availability?active=${active}`);
    return response.data;
  },
  addMenuItem: async (data: AddMenuItemRequest) => {
    const response = await api.post('/vendor/canteen/menu', data);
    return response.data;
  },
  updateMenuItem: async (id: number, data: UpdateMenuItemRequest) => {
    const response = await api.put(`/vendor/canteen/menu/${id}`, data);
    return response.data;
  }
};