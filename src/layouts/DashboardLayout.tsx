import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "react-router-dom";
import { Utensils, Search } from "lucide-react";
import { PrintManager } from "../features/print/PrintManager";
import { authService } from "../services/authService";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { data: profile } = useQuery({
    queryKey: ["vendor-profile"],
    queryFn: authService.getMe,
  });
  const navItems = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Orders", path: "/orders" },
    { name: "Menu", path: "/menu" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          
          {/* Logo & Search */}
          <div className="flex items-center gap-8 flex-1">
            <Link to="/dashboard" className="flex items-center gap-2 text-blue-600 font-bold text-lg">
              <Utensils className="w-6 h-6" />
              <span className="text-gray-900">
                {profile?.outletName || "Vendor Portal"}
              </span>
            </Link>
            
            <div className="relative w-full max-w-md hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Search orders, menu..." 
                className="w-full pl-10 pr-4 py-2 bg-gray-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg text-sm transition-all outline-none"
              />
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1 mx-6">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  location.pathname === item.path 
                    ? "text-blue-600 bg-blue-50" 
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <PrintManager />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-[1600px] mx-auto p-4 sm:p-6">
        {children}
      </main>
    </div>
  );
}
