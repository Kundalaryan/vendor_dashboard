import { useState, useEffect } from "react"; // 1. Import useEffect
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Store, Eye, EyeOff, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { authService } from "../services/authService";

const loginSchema = z.object({
  phone: z
    .string()
    .length(10, "Phone number must be exactly 10 digits")
    .regex(/^\d+$/, "Phone number must contain only numbers"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue, // Used to set field values programmatically
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  // 2. Load Saved Phone Number on Page Load
  useEffect(() => {
    const savedPhone = localStorage.getItem("remembered_phone");
    if (savedPhone) {
      setValue("phone", savedPhone);
      setValue("rememberMe", true); // Check the box visually
    }
  }, [setValue]);

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setServerError(null);

      // Handle "Remember Me" logic
      if (data.rememberMe) {
        localStorage.setItem("remembered_phone", data.phone);
      } else {
        localStorage.removeItem("remembered_phone");
      }

      // 1. Perform Login
      const loginResponse = await authService.login({
        phone: data.phone,
        password: data.password,
      });

      // 2. Save Token
      localStorage.setItem("vendor_token", loginResponse.token);

      // 3. Fetch profile to check status
      const profile = await authService.getMe();

      // 4. Save basic info
      localStorage.setItem("vendor_info", JSON.stringify(profile));

      // 5. Decide where to go
      if (profile.onboarded) {
        navigate("/dashboard");
      } else {
        navigate("/onboarding");
      }
    } catch (error: any) {
      console.error("Login Failed", error);
      setServerError(error.response?.data?.message || "Invalid credentials.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-xl p-8 sm:p-10">
        
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-4 text-blue-600">
            <Store size={24} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
          <p className="text-gray-500 text-sm mt-2">
            Sign in to manage your canteen operations.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {serverError && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center">
              {serverError}
            </div>
          )}

          <Input
            label="Phone Number"
            type="tel" 
            placeholder="Enter your phone number"
            error={errors.phone?.message}
            {...register("phone", {
              onChange: (e) => {
                const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                setValue("phone", value);
                e.target.value = value;
              },
            })}
          />

          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            {...register("password")}
            error={errors.password?.message}
            icon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="focus:outline-none"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
          />

          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input 
                type="checkbox" 
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                {...register("rememberMe")}
              />
              <span className="text-sm text-gray-600">Remember me</span>
            </label>
            <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-500">
              Forgot Password?
            </a>
          </div>

          <Button type="submit" isLoading={isSubmitting}>
            Sign In <ArrowRight size={18} />
          </Button>

        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <Link to="/signup" className="font-semibold text-blue-600 hover:text-blue-500">
              Apply here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
