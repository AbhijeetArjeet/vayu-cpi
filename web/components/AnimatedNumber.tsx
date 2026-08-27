"use client";

import React, { useEffect, useState, useRef } from "react";

interface AnimatedNumberProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

export default function AnimatedNumber({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  className = "",
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isUpdating, setIsUpdating] = useState(false);
  const prevValueRef = useRef(value);

  useEffect(() => {
    if (prevValueRef.current !== value) {
      setIsUpdating(true);
      const startValue = prevValueRef.current;
      const endValue = value;
      const startTime = performance.now();
      const duration = 500; // ms

      const updateStep = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease-out quad formula
        const easeProgress = 1 - (1 - progress) * (1 - progress);
        const current = startValue + (endValue - startValue) * easeProgress;
        setDisplayValue(current);

        if (progress < 1) {
          requestAnimationFrame(updateStep);
        } else {
          setDisplayValue(endValue);
          prevValueRef.current = endValue;
          setTimeout(() => setIsUpdating(false), 300);
        }
      };

      requestAnimationFrame(updateStep);
    }
  }, [value]);

  const formatted = `${prefix}${displayValue.toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}${suffix}`;

  return (
    <span
      className={`inline-block transition-all duration-300 ${
        isUpdating ? "animate-value-flash text-blue-400 font-extrabold" : ""
      } ${className}`}
    >
      {formatted}
    </span>
  );
}
