"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, ease: [0.2, 0.8, 0.2, 1] as const },
  },
};

interface RevealProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  /** Tag to render. Defaults to `div`. */
  as?: "div" | "ul" | "ol" | "section";
  /** When true, wait until the element scrolls into view to animate. */
  whenInView?: boolean;
}

/**
 * Parent reveal — animates children with a tight, professional fade-up.
 * Subtle by design: 14px travel, 0.42s duration, 0.06s stagger. Wrap each
 * direct child in `<RevealItem>` to receive the animation; plain children
 * render without animation.
 */
export function Reveal({
  children,
  as = "div",
  whenInView = true,
  ...rest
}: RevealProps) {
  const Tag = motion[as] as typeof motion.div;
  const animateProp = whenInView
    ? { whileInView: "visible" as const, viewport: { once: true, margin: "-60px" } }
    : { animate: "visible" as const };

  return (
    <Tag
      variants={containerVariants}
      initial="hidden"
      {...animateProp}
      {...rest}
    >
      {children}
    </Tag>
  );
}

interface RevealItemProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  as?: "div" | "li" | "article";
}

export function RevealItem({
  children,
  as = "div",
  ...rest
}: RevealItemProps) {
  const Tag = motion[as] as typeof motion.div;
  return (
    <Tag variants={itemVariants} {...rest}>
      {children}
    </Tag>
  );
}
