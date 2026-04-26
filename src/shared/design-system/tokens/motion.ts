export const motion = {
  duration: {
    instant: "80ms",
    fast: "160ms",
    base: "240ms",
    slow: "400ms",
  },
  easing: {
    standard: "cubic-bezier(0.2, 0.8, 0.2, 1)",
    enter: "cubic-bezier(0, 0, 0.2, 1)",
    exit: "cubic-bezier(0.4, 0, 1, 1)",
  },
} as const;
