export interface MenuItem {
  id: number;
  name: string;
  category: string; // e.g., "SNACKS", "BEVERAGES"
  price: number;
  veg: boolean;
  section: "BREAKFAST" | "LUNCH" | "DINNER";
  active: boolean;
}

export interface MenuFilterParams {
  category?: string;
  section?: string;
}
export interface AddMenuItemRequest {
  name: string;
  category: string;
  price: number;
  veg: boolean;
  section: "BREAKFAST" | "LUNCH" | "DINNER";
}
export interface UpdateMenuItemRequest {
  name?: string;
  category?: string;
  price?: number;
  veg?: boolean;
  section?: "BREAKFAST" | "LUNCH" | "DINNER";
}