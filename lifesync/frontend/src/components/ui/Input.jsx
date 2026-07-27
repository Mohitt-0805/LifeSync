import React, { forwardRef } from "react";

export const Input = forwardRef(({
  label,
  error,
  type = "text",
  className = "",
  textarea = false,
  rows = 4,
  id,
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  const baseStyle =
    "w-full px-4 py-3 border-2 border-black rounded-2xl bg-white dark:bg-navy-950 dark:text-white dark:border-white focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand spring-transition font-body disabled:opacity-50 disabled:bg-gray-100";
  const errorStyle = error ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "";

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="font-heading font-bold text-sm text-navy-800 dark:text-gray-200 ml-1"
        >
          {label}
        </label>
      )}

      {textarea ? (
        <textarea
          id={inputId}
          ref={ref}
          rows={rows}
          className={`${baseStyle} ${errorStyle}`}
          {...props}
        />
      ) : (
        <input
          id={inputId}
          type={type}
          ref={ref}
          className={`${baseStyle} ${errorStyle}`}
          {...props}
        />
      )}

      {error && (
        <span className="text-red-500 font-heading text-xs ml-1 mt-0.5">
          {error}
        </span>
      )}
    </div>
  );
});

Input.displayName = "Input";
