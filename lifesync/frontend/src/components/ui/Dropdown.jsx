import React from "react";

export const Dropdown = ({
  label,
  options = [],
  value,
  onChange,
  className = "",
  error,
  id,
  ...props
}) => {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

  const baseStyle =
    "w-full px-4 py-3 border-2 border-black rounded-2xl bg-white dark:bg-navy-950 dark:text-white dark:border-white focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand spring-transition font-body appearance-none cursor-pointer";
  const errorStyle = error ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "";

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="font-heading font-bold text-sm text-navy-800 dark:text-gray-200 ml-1"
        >
          {label}
        </label>
      )}

      <div className="relative">
        <select
          id={selectId}
          value={value}
          onChange={onChange}
          className={`${baseStyle} ${errorStyle}`}
          {...props}
        >
          {options.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              className="bg-white dark:bg-navy-900 text-black dark:text-white"
            >
              {opt.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-black dark:text-white">
          <svg
            className="fill-current h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
          >
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
          </svg>
        </div>
      </div>

      {error && (
        <span className="text-red-500 font-heading text-xs ml-1 mt-0.5">
          {error}
        </span>
      )}
    </div>
  );
};
