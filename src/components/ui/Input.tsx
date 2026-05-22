import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, className = "", ...props }, ref) => {
    return (
      <div className="input-container">
        {label && <label className="input-label">{label}</label>}
        <input ref={ref} className={`input-field ${className}`} {...props} />
      </div>
    );
  }
);

Input.displayName = "Input";
