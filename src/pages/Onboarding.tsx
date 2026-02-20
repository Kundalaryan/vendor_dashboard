import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Store, MapPin, Clock, ArrowRight, User, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { authService } from "../services/authService";

// 1. Validation Schema
const onboardingSchema = z.object({
  outletName: z.string().min(3, "Outlet name is required"),
  address: z.string().min(5, "Address is required"),
  openingTime: z.string().min(1, "Opening time is required"),
  closingTime: z.string().min(1, "Closing time is required"),
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

export default function Onboarding() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
  });

  const onSubmit = async (data: OnboardingFormValues) => {
    try {
      setServerError(null);
      
      // API expects HH:mm:ss. Input[type="time"] returns HH:mm (24h format).
      // We simply append ":00" for seconds.
      await authService.completeOnboarding({
        outletName: data.outletName,
        address: data.address,
        openingTime: `${data.openingTime}:00`, 
        closingTime: `${data.closingTime}:00`,
      });

      // Update local storage profile to set onboarded = true
      const updatedProfile = await authService.getMe();
      localStorage.setItem("vendor_info", JSON.stringify(updatedProfile));
      
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Onboarding Failed", error);
      setServerError(error.response?.data?.message || "Setup failed. Please try again.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("vendor_token");
    localStorage.removeItem("vendor_info");
    localStorage.removeItem("remembered_phone");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 sm:p-8">
      
      {/* Top Header with Profile/Logout Dropdown */}
      <div className="w-full flex justify-end max-w-2xl mb-4 relative z-10">
        <div className="relative">
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="w-10 h-10 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <User size={20} />
          </button>

          {/* Logout Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 origin-top-right animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-2 border-b border-gray-50">
                <p className="text-xs font-semibold text-gray-500 uppercase">Account</p>
              </div>
              <button 
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
              >
                <LogOut size={14} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden">
        
        {/* Banner Image Section */}
        <div className="h-40 bg-gray-900 relative">
          <img 
            src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=2047&auto=format&fit=crop" 
            alt="Restaurant Interior" 
            className="w-full h-full object-cover opacity-50"
          />
          <div className="absolute bottom-0 left-0 p-8 text-white">
            <h1 className="text-2xl font-bold">Finish setting up your outlet</h1>
            <p className="text-gray-200 text-sm mt-1">
              Please verify and complete your business hours to start receiving orders.
            </p>
          </div>
        </div>

        {/* Form Section */}
        <div className="p-8 sm:p-10">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {serverError && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                {serverError}
              </div>
            )}

            <Input
              label="Outlet Name"
              placeholder="GrandStand Express"
              icon={<Store size={18} />}
              {...register("outletName")}
              error={errors.outletName?.message}
            />

            <Input
              label="Address"
              placeholder="NORTH BLOCK IIT JAMMU"
              icon={<MapPin size={18} />}
              {...register("address")}
              error={errors.address?.message}
            />

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                <Clock size={16} className="inline mr-2 text-blue-600" />
                Operational Hours <span className="text-gray-400 font-normal ml-1">(24-hour format)</span>
              </label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs text-gray-500 uppercase font-bold tracking-wide">Opening Time</span>
                  <div className="relative">
                    <input 
                      type="time"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-50 focus:border-blue-500 transition-all text-sm bg-white"
                      {...register("openingTime")}
                    />
                  </div>
                  {errors.openingTime && <p className="text-xs text-red-500">{errors.openingTime.message}</p>}
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-gray-500 uppercase font-bold tracking-wide">Closing Time</span>
                  <div className="relative">
                    <input 
                      type="time"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-50 focus:border-blue-500 transition-all text-sm bg-white"
                      {...register("closingTime")}
                    />
                  </div>
                  {errors.closingTime && <p className="text-xs text-red-500">{errors.closingTime.message}</p>}
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                <span className="inline-block w-3 h-3 bg-blue-100 text-blue-600 rounded-full text-[10px] flex items-center justify-center font-bold">i</span>
                Your menu will only be visible between these hours.
              </p>
            </div>

            <div className="pt-4">
              <Button type="submit" isLoading={isSubmitting} className="w-full">
                Complete Setup <ArrowRight size={18} />
              </Button>
            </div>

          </form>
        </div>
      </div>
      
      {/* Footer */}
      <div className="mt-8 text-center text-sm text-gray-500">
        Need help with your outlet setup? <a href="#" className="text-blue-600 font-medium hover:underline">Contact Support</a>
      </div>
    </div>
  );
}