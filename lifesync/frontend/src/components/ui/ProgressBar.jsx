import React from "react";
import { motion } from "framer-motion";

export const ProgressBar = ({
  progress, // 0 to 100
  color = "bg-brand",
  height = "h-4",
  className = "",
}) => {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className={`w-full bg-cream-dark dark:bg-navy-800 border-2 border-black rounded-full overflow-hidden ${className}`}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${clampedProgress}%` }}
        transition={{ type: "spring", stiffness: 70, damping: 12 }}
        className={`${height} ${color} rounded-full`}
      />
    </div>
  );
};
