import React from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "danger";
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  className = "",
  isLoading = false,
  disabled,
  ...props
}) => {
  return (
    <button 
      className={`btn btn-${variant} ${isLoading ? "btn-loading" : ""} ${className}`} 
      disabled={disabled || isLoading}
      style={{
        pointerEvents: isLoading ? "none" : undefined,
        opacity: isLoading ? 0.6 : undefined,
      }}
      {...props}
    >
      {isLoading ? (
        <Loader2 size={16} className="btn-spinner" />
      ) : (
        children
      )}
    </button>
  );
};
