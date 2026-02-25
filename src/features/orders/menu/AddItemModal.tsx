import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Check, Leaf, UtensilsCrossed, Loader2 } from "lucide-react";
import { Input } from "../../../components/Input";
import { Select } from "../../../components/Select";

// 1. Validation Schema
const addItemSchema = z.object({
  name: z.string().min(3, "Item name must be at least 3 characters"),
  price: z.number().min(1, "Price must be greater than 0"),
  category: z.string().min(1, "Category is required"),
  section: z.enum(["BREAKFAST", "LUNCH", "DINNER"]),
  veg: z.boolean(),
});

type AddItemFormValues = z.infer<typeof addItemSchema>;

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AddItemFormValues) => void;
  isLoading: boolean;
}

export const AddItemModal: React.FC<AddItemModalProps> = ({ 
  isOpen, onClose, onSubmit, isLoading 
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<AddItemFormValues>({
    resolver: zodResolver(addItemSchema),
    defaultValues: {
      category: "Snacks", // Default
      section: "LUNCH",   // Default
      veg: true,          // Default
    },
  });

  // Watch veg state to style the buttons
  const isVeg = watch("veg");

  // Reset form when modal closes/opens
  React.useEffect(() => {
    if (isOpen) reset();
  }, [isOpen, reset]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Add New Menu Item</h2>
            <p className="text-sm text-gray-500 mt-0.5">Fill in the details to add a new item to your menu.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Name */}
            <Input
              label="Item Name"
              placeholder="e.g. Truffle Burger"
              {...register("name")}
              error={errors.name?.message}
            />

            {/* Price */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Price (₹)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
                <input
                  type="number"
                  step="0.01"
                  className="w-full pl-7 pr-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-50 focus:border-blue-500 transition-all text-sm"
                  placeholder="0.00"
                  {...register("price", { valueAsNumber: true })}
                />
              </div>
              {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
          </div>

          {/* Dietary Tags (Mapped to Boolean Veg) */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Dietary Type</label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setValue("veg", true)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${
                  isVeg 
                    ? "bg-green-50 border-green-500 text-green-700 ring-1 ring-green-500" 
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Leaf size={18} />
                <span className="font-medium text-sm">Vegetarian</span>
                {isVeg && <Check size={16} className="ml-1" />}
              </button>
              
              <button
                type="button"
                onClick={() => setValue("veg", false)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${
                  !isVeg 
                    ? "bg-red-50 border-red-500 text-red-700 ring-1 ring-red-500" 
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <UtensilsCrossed size={18} />
                <span className="font-medium text-sm">Non-Vegetarian</span>
                {!isVeg && <Check size={16} className="ml-1" />}
              </button>
            </div>
          </div>
          
          {/* Footer Actions */}
          <div className="pt-6 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-200 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Item
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
