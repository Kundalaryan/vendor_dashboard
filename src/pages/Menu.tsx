import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Search, Plus, Filter, 
  Leaf, UtensilsCrossed, Edit3, Trash2 
} from "lucide-react";

import { useToast } from "../context/ToastContext";
import DashboardLayout from "../layouts/DashboardLayout";
import { menuService } from "../services/menuService";
import type { MenuItem } from "../types/menu";
import { Button } from "../components/Button"; 
import { AddItemModal } from "../features/orders/menu/AddItemModal";
import { UpdateItemModal } from "../features/orders/menu/UpdateItemModal";

// Hardcoded Filters as requested
const SECTIONS = ["ALL", "BREAKFAST", "LUNCH", "DINNER"];
const CATEGORIES = ["All", "Snacks", "Beverages", "Desserts", "Mains"];

export default function Menu() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  
  // Local State for Filters
  const [selectedSection, setSelectedSection] = useState("ALL"); // Default to All Sections
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Track which item is being edited. If null, modal is closed.
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      menuService.updateMenuItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu"] });
      setEditingItem(null); // Close modal
      addToast("Item updated successfully", "success");
    },
  });

  // 1. Fetch Menu Data
  const { data: menuItems = [], isLoading } = useQuery({
    queryKey: ["menu", selectedSection, selectedCategory],
    queryFn: () => menuService.getMenu({ 
      section: selectedSection === "ALL" ? undefined : selectedSection,
      category: selectedCategory === "All" ? undefined : selectedCategory.toUpperCase()
    }),
  });

  // 2. Toggle Mutation (Optimistic Update)
  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) => 
      menuService.toggleAvailability(id, active),
    onMutate: async ({ id, active }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["menu"] });
      // Snapshot previous value
      const previousMenu = queryClient.getQueryData<MenuItem[]>(["menu", selectedSection, selectedCategory]);
      // Optimistically update
      if (previousMenu) {
        queryClient.setQueryData<MenuItem[]>(["menu", selectedSection, selectedCategory], (old) => 
          old?.map(item => item.id === id ? { ...item, active } : item)
        );
      }
      return { previousMenu };
    },
    onError: (_err, _newTodo, context) => {
      // Rollback on error
      if (context?.previousMenu) {
        queryClient.setQueryData(["menu", selectedSection, selectedCategory], context.previousMenu);
      }
    },
    onSettled: () => {
      // Refetch to sync with server
      queryClient.invalidateQueries({ queryKey: ["menu"] });
    }
  });

  // 3. Create Mutation (NEW)
  const createMutation = useMutation({
    mutationFn: menuService.addMenuItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu"] });
      setIsModalOpen(false); // Close modal on success
      // Optional: Add toast notification here
      addToast("Item added successfully", "success");
    },
  });

  // Client-side search filtering
  const filteredItems = menuItems.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <span>Home</span>
              <span>/</span>
              <span className="text-gray-900 font-medium">Menu Management</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Menu Management</h1>
            <p className="text-gray-500 text-sm">Manage your product catalog, prices, and availability.</p>
          </div>
          <Button className="w-auto px-6" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} /> Add New Item
          </Button>
        </div>

        {/* Filters Toolbar */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
          
          <div className="flex flex-col lg:flex-row justify-between gap-4">
            {/* Search & Section Filter */}
            <div className="flex flex-1 gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Search items..." 
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              {/* Section Dropdown (Required by API) */}
              <div className="relative min-w-[140px]">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                <select 
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 outline-none focus:border-blue-500 appearance-none cursor-pointer hover:bg-gray-50"
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                >
                  {SECTIONS.map(sec => (
                    <option key={sec} value={sec}>{sec === "ALL" ? "All Sections" : sec}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Category Tabs */}
            <div className="flex gap-1 overflow-x-auto pb-2 lg:pb-0">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    selectedCategory === cat 
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-200" 
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-4 font-semibold">Item Name</th>
                  <th className="px-6 py-4 font-semibold">Category</th>
                  <th className="px-6 py-4 font-semibold">Section</th>
                  <th className="px-6 py-4 font-semibold">Price</th>
                  <th className="px-6 py-4 font-semibold text-center">Available</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">Loading menu items...</td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                      No items found for {selectedSection} - {selectedCategory}
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                      {/* Name Column */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900">{item.name}</span>
                          <div className="flex items-center gap-2 mt-1">
                            {/* Veg/Non-Veg Badge */}
                            <span className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border ${
                              item.veg 
                                ? "bg-green-50 text-green-700 border-green-200" 
                                : "bg-red-50 text-red-700 border-red-200"
                            }`}>
                              {item.veg ? <Leaf size={10} /> : <UtensilsCrossed size={10} />}
                              {item.veg ? "VEG" : "NON-VEG"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 capitalize">
                          {item.category.toLowerCase()}
                        </span>
                      </td>

                       {/* Section */}
                       <td className="px-6 py-4">
                        <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded capitalize">
                          {item.section.toLowerCase()}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">
                        ₹{item.price.toFixed(2)}
                      </td>

                      {/* Available Toggle */}
                      <td className="px-6 py-4 text-center">
                        <button
                          role="switch"
                          aria-checked={item.active}
                          aria-label={`Available: ${item.name}`}
                          onClick={() => toggleMutation.mutate({ id: item.id, active: !item.active })}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 cursor-pointer ${
                            item.active ? "bg-blue-600" : "bg-gray-200"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              item.active ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
  onClick={() => setEditingItem(item)} // <--- Add this line
  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
>
                            <Edit3 size={16} />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
            <span className="text-sm text-gray-500">
              Showing <span className="font-medium">{filteredItems.length}</span> items
            </span>
            <div className="flex gap-2">
              <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50" disabled>
                Previous
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50" disabled>
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      <AddItemModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={(data) => createMutation.mutate(data)}
        isLoading={createMutation.isPending}
      />
      <UpdateItemModal 
        isOpen={!!editingItem}
        item={editingItem}
        onClose={() => setEditingItem(null)}
        onSubmit={(id, data) => updateMutation.mutate({ id, data })}
        isLoading={updateMutation.isPending}
      />
    </DashboardLayout>
  );
}
