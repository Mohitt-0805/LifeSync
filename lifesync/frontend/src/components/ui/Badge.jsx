import React from "react";

export const Badge = ({
  children,
  variant = "primary",
  className = "",
  ...props
}) => {
  const baseStyle =
    "inline-flex items-center px-3 py-1 text-xs font-heading font-bold border-2 border-black dark:border-white rounded-full shadow-retro-sm";

  const variants = {
    primary: "bg-brand text-white",
    secondary: "bg-white text-black dark:bg-navy-800 dark:text-white",
    danger: "bg-red-400 text-white",
    warning: "bg-yellow-300 text-black",
    info: "bg-blue-300 text-black",
    success: "bg-candy-habits text-white",
    // Modules candy colors
    tasks: "bg-candy-tasks text-white",
    goals: "bg-candy-goals text-white",
    habits: "bg-candy-habits text-white",
    expenses: "bg-candy-expenses text-black",
    notes: "bg-candy-notes text-white",
    calendar: "bg-candy-calendar text-white",
    // Task categories
    work: "bg-blue-400 text-black",
    personal: "bg-purple-300 text-black",
    health: "bg-emerald-300 text-black",
    finance: "bg-amber-300 text-black",
    other: "bg-gray-300 text-black dark:bg-navy-800 dark:text-white",
  };

  const selectedVariant = variants[variant] || variants.primary;

  return (
    <span className={`${baseStyle} ${selectedVariant} ${className}`} {...props}>
      {children}
    </span>
  );
};
