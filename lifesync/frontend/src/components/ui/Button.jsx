import React from "react";

export const Button = ({
  children,
  onClick,
  type = "button",
  variant = "primary",
  className = "",
  disabled = false,
  loading = false,
  ...props
}) => {
  const baseStyle =
    "font-heading font-bold border-2 border-black rounded-2xl px-5 py-2.5 spring-transition active-press focus:outline-none flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-retro-sm";

  const variants = {
    primary:
      "bg-brand text-white shadow-retro hover:bg-brand-light hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-retro-sm",
    secondary:
      "bg-white text-black shadow-retro hover:bg-cream-dark hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-retro-sm",
    danger:
      "bg-red-500 text-white shadow-retro hover:bg-red-400 hover:-translate-y-0.5 hover:-translate-x-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-retro-sm",
    success:
      "bg-candy-habits text-white shadow-retro hover:bg-emerald-400 hover:-translate-y-0.5 hover:-translate-x-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-retro-sm",
    goal:
      "bg-candy-goals text-white shadow-retro hover:bg-violet-400 hover:-translate-y-0.5 hover:-translate-x-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-retro-sm",
    outline:
      "bg-transparent text-black border-2 border-black hover:bg-cream-dark dark:text-white dark:border-white dark:hover:bg-navy-800",
  };

  const selectedVariant = variants[variant] || variants.primary;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyle} ${selectedVariant} ${className}`}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
};
