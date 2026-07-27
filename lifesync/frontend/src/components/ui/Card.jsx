import React from "react";

export const Card = ({
  children,
  className = "",
  variant = "default",
  hoverable = true,
  onClick,
  ...props
}) => {
  const baseStyle =
    "border-2 border-black rounded-3xl p-6 bg-white dark:bg-navy-900 dark:border-white transition-all spring-transition";

  const shadowVariants = {
    default: "shadow-retro hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]",
    tasks: "shadow-retro-tasks hover:shadow-[6px_6px_0px_0px_#FF5A36]",
    goals: "shadow-retro-goals hover:shadow-[6px_6px_0px_0px_#8B5CF6]",
    habits: "shadow-retro-habits hover:shadow-[6px_6px_0px_0px_#10B981]",
    expenses: "shadow-retro-expenses hover:shadow-[6px_6px_0px_0px_#F59E0B]",
    notes: "shadow-retro-notes hover:shadow-[6px_6px_0px_0px_#14B8A6]",
    calendar: "shadow-retro-calendar hover:shadow-[6px_6px_0px_0px_#6366F1]",
  };

  const hoverStyle = hoverable
    ? "hover:-translate-y-1 cursor-pointer"
    : "";

  const selectedShadow = shadowVariants[variant] || shadowVariants.default;

  return (
    <div
      onClick={onClick}
      className={`${baseStyle} ${selectedShadow} ${hoverStyle} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
