import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Store, Eye, EyeOff, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { Input } from "../components/Input";
import { Select } from "../components/Select";
import { Button } from "../components/Button";
import { authService } from "../services/authService";

// 1. Validation Schema: EXACTLY 10 digits
const signupSchema = z.object({
  name: z.string().min(3, "Business name must be at least 3 characters"),
  phone: z
    .string()
    .length(10, "Phone number must be exactly 10 digits") // Strict length
    .regex(/^\d+$/, "Phone number must contain only numbers"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  serviceType: z.enum(["CANTEEN"]),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function Signup() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      serviceType: "CANTEEN",
    },
  });

  const onSubmit = async (data: SignupFormValues) => {
    try {
      setServerError(null);
      await authService.signup(data);
      navigate("/login");
    } catch (error: any) {
      console.error("Signup Failed", error);
      setServerError(error.response?.data?.message || "Signup failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[480px] bg-white rounded-2xl shadow-xl p-8 sm:p-10">
        
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-4 text-blue-600">
            <Store size={24} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Join as a Partner</h1>
          <p className="text-gray-500 text-sm mt-2">
            Register your canteen to start managing operations.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {serverError && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center">
              {serverError}
            </div>
          )}

          <Input
            label="Name"
            placeholder="Owner Name"
            {...register("name")}
            error={errors.name?.message}
          />

          {/* STRICT PHONE INPUT */}
          <Input
            label="Phone Number"
            type="tel"
            placeholder="0987654321"
            error={errors.phone?.message}
            {...register("phone", {
              onChange: (e) => {
                const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                setValue("phone", value);
                e.target.value = value;
              },
            })}
          />

          <Select
            label="Business Category"
            options={[
              { label: "Canteen", value: "CANTEEN" },
            ]}
            {...register("serviceType")}
            error={errors.serviceType?.message}
          />

          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            placeholder="Create a strong password"
            {...register("password")}
            error={errors.password?.message}
            icon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
          />

          <Button type="submit" isLoading={isSubmitting}>
            Create Account <ArrowRight size={18} />
          </Button>

        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-500">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}