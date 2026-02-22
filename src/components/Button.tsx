import React from "react";
import { Loader2 } from "lucide-react"; // Icon for loading state

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  variant?: "primary" | "outline";
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  isLoading, 
  variant = "primary", 
  className = "", 
  ...props 
}) => {
  const baseStyles = "w-full py-2.5 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-200",
    outline: "border border-gray-300 text-gray-700 hover:bg-gray-50 bg-white"
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={isLoading}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
};