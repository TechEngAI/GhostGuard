"use client";

import { useEffect, useState } from "react";
import { motion, useSpring, useTransform, animate } from "framer-motion";

interface CountUpNumberProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function CountUpNumber({ value, duration = 2, prefix = "", suffix = "", className }: CountUpNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration,
      onUpdate: (latest) => setDisplayValue(Math.floor(latest)),
      ease: "easeOut",
    });
    return () => controls.stop();
  }, [value, duration]);

  return (
    <span className={className}>
      {prefix}{displayValue.toLocaleString()}{suffix}
    </span>
  );
}
