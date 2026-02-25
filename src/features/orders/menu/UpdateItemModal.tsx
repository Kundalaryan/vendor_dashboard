import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Check, Loader2 } from "lucide-react";
import { Input } from "../../../components/Input";
import { Select } from "../../../components/Select";
import type { MenuItem, UpdateMenuItemRequest } from "../../../types/menu";

// Validation Schema (Same as Add, but we use it to validate inputs)
const updateItemSchema = z.object({
  name: z.string().min(3, "Item name must be at least 3 characters"),
  price: z.number().min(1, "Price must be greater than 0"),
  category: z.string().min(1, "Category is required"),
  section: z.enum(["BREAKFAST", "LUNCH", "DINNER"]),
  veg: z.boolean(),
});

type UpdateItemFormValues = z.infer<typeof updateItemSchema>;

interface UpdateItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: MenuItem | null; // The item being edited
  onSubmit: (id: number, data: UpdateMenuItemRequest) => void;
  isLoading: boolean;
}

export const UpdateItemModal: React.FC<UpdateItemModalProps> = ({ 
  isOpen, onClose, item, onSubmit, isLoading 
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<UpdateItemFormValues>({
    resolver: zodResolver(updateItemSchema),
  });

  // Watch veg state for UI toggles
  const isVeg = watch("veg");

  // 1. Populate form when item changes
  useEffect(() => {
    if (item && isOpen) {
      reset({
        name: item.name,
        price: item.price,
        category: item.category, // Ensure casing matches your dropdown options
        section: item.section,
        veg: item.veg,
      });
    }
  }, [item, isOpen, reset]);

  // 2. Calculate Diff on Submit
  const handleFormSubmit = (data: UpdateItemFormValues) => {
    if (!item) return;

    const payload: UpdateMenuItemRequest = {};
    let hasChanges = false;

    // Strict comparison to only send changed fields
    if (data.name !== item.name) { payload.name = data.name; hasChanges = true; }
    if (data.price !== item.price) { payload.price = data.price; hasChanges = true; }
    // Normalize case for comparison if needed, assuming backend sends/receives same case
    if (data.category !== item.category) { payload.category = data.category; hasChanges = true; }
    if (data.section !== item.section) { payload.section = data.section; hasChanges = true; }
    if (data.veg !== item.veg) { payload.veg = data.veg; hasChanges = true; }

    if (hasChanges) {
      onSubmit(item.id, payload);
    } else {
      onClose(); // No changes, just close
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Update Menu Item</h2>
            <p className="text-sm text-gray-500 mt-0.5">Modify details for the selected menu item.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-6">
          
          {/* Name */}
          <Input
            label="Item Name"
            {...register("name")}
            error={errors.name?.message}
          />

          <div className="grid grid-cols-2 gap-5">
            {/* Price */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Price (₹)</label>
              <input
                type="number"
                step="0.01"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-50 focus:border-blue-500 transition-all text-sm"
                {...register("price", { valueAsNumber: true })}
              />
              {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price.message}</p>}
            </div>

            {/* Category */}
            <Select
              label="Category"
              options={[
                { label: "Snacks", value: "Snacks" },
                { label: "Beverages", value: "Beverages" },
                { label: "Mains", value: "Mains" },
                { label: "Desserts", value: "Desserts" },
              ]}
              {...register("category")}
              error={errors.category?.message}
            />
          </div>

          {/* Section */}
          <Select
            label="Menu Section"
            options={[
              { label: "Lunch", value: "LUNCH" },
              { label: "Breakfast", value: "BREAKFAST" },
              { label: "Dinner", value: "DINNER" },
            ]}
            {...register("section")}
            error={errors.section?.message}
          />

          {/* Dietary Tags */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Dietary Tags</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setValue("veg", true)}
                className={`px-4 py-2 rounded-full text-sm font-medium border flex items-center gap-2 transition-colors ${
                  isVeg 
                    ? "bg-blue-600 border-blue-600 text-white" 
                    : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              >
                Vegetarian {isVeg && <Check size={14} />}
              </button>
              
              <button
                type="button"
                onClick={() => setValue("veg", false)}
                className={`px-4 py-2 rounded-full text-sm font-medium border flex items-center gap-2 transition-colors ${
                  !isVeg 
                    ? "bg-blue-600 border-blue-600 text-white" 
                    : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              >
                Non-Vegetarian {!isVeg && <Check size={14} />}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Suggestions: <span className="text-blue-500 cursor-pointer">Vegan</span> <span className="text-blue-500 cursor-pointer">Gluten-Free</span>
            </p>
          </div>
          
          {/* Footer */}
          <div className="pt-6 mt-2 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-200 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Update Item
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
