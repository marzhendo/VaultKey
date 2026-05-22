import React from "react";

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  className = "",
  ...props
}) => {
  return (
    <button className={`icon-btn ${className}`} {...props}>
      {icon}
    </button>
  );
};
