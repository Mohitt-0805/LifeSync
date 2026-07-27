import React from "react";

export const Skeleton = ({
  className = "",
  variant = "card",
  ...props
}) => {
  if (variant === "card") {
    return (
      <div
        className={`animate-pulse border-2 border-dashed border-gray-300 dark:border-navy-700 rounded-3xl p-6 bg-gray-50 dark:bg-navy-900/50 min-h-[150px] flex flex-col justify-between ${className}`}
        {...props}
      >
        <div className="h-6 w-1/3 bg-gray-200 dark:bg-navy-800 rounded-lg mb-4" />
        <div className="space-y-2">
          <div className="h-4 w-full bg-gray-200 dark:bg-navy-800 rounded-lg" />
          <div className="h-4 w-5/6 bg-gray-200 dark:bg-navy-800 rounded-lg" />
        </div>
        <div className="h-8 w-1/4 bg-gray-200 dark:bg-navy-800 rounded-xl mt-4 self-end" />
      </div>
    );
  }

  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-navy-800 rounded-xl ${className}`}
      {...props}
    />
  );
};
