"use client";

import { type ReactNode, useEffect } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import Link from "next/link";
import { ChevronRight, X } from "lucide-react";

export interface MobileNavItem {
  id: string;
  label: string;
  sublabel?: string;
  icon: ReactNode;
  /** Internal link. Use `onClick` for buttons (e.g. sign out). */
  href?: string;
  onClick?: () => void;
}

export interface MobileCta {
  label: string;
  icon?: ReactNode;
  href?: string;
  onClick?: () => void;
}

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  brand: string;
  items: ReadonlyArray<MobileNavItem>;
  cta?: MobileCta;
  footerBrand: string;
  footerTagline?: string;
  /** Rendered in the footer (e.g. theme + locale switchers). */
  footerControls?: ReactNode;
  closeLabel: string;
}

/* ──────────────── Animation variants (tuned — do not change) ──────────────── */

const overlayVariants: Variants = {
  closed: { clipPath: "circle(0px at 0px 0px)", transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } },
  open: { clipPath: "circle(150vh at 0px 0px)", transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] } },
};
const contentVariants: Variants = {
  closed: { opacity: 0 },
  open: { opacity: 1, transition: { delay: 0.15, duration: 0.3, staggerChildren: 0.06, delayChildren: 0.2 } },
};
const itemVariants: Variants = {
  closed: { opacity: 0, y: 24 },
  open: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120, damping: 14 } },
};
const headerVariants: Variants = {
  closed: { opacity: 0, scale: 0.8 },
  open: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 200, damping: 15, delay: 0.1 } },
};
const closeButtonVariants: Variants = {
  closed: { opacity: 0, rotate: -90, scale: 0.5 },
  open: { opacity: 1, rotate: 0, scale: 1, transition: { type: "spring", stiffness: 200, damping: 12, delay: 0.3 } },
};
const ctaVariants: Variants = {
  closed: { opacity: 0, y: 20, scale: 0.95 },
  open: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 100, damping: 14, delay: 0.65 } },
};
const footerVariants: Variants = {
  closed: { opacity: 0 },
  open: { opacity: 1, transition: { delay: 0.75, duration: 0.4 } },
};

/**
 * Full-screen mobile drawer. Reveals via a clip-path circle wipe from the
 * top-left (the hamburger corner), then staggers in its rows, CTA and footer.
 * Ported from the portable kit; re-skinned to Biringas tokens via
 * `mobile-nav.css`. Theme + locale controls are injected via `footerControls`
 * so the drawer reuses the real Biringas switchers.
 */
export function MobileMenu({
  isOpen,
  onClose,
  brand,
  items,
  cta,
  footerBrand,
  footerTagline,
  footerControls,
  closeLabel,
}: MobileMenuProps) {
  // Lock background scroll while the drawer is open.
  useEffect(() => {
    if (isOpen) document.body.setAttribute("data-mobile-menu-open", "true");
    else document.body.removeAttribute("data-mobile-menu-open");
    return () => document.body.removeAttribute("data-mobile-menu-open");
  }, [isOpen]);

  const rowInner = (item: MobileNavItem) => (
    <>
      <div className="amh-navContent">
        <span className="amh-navIcon">{item.icon}</span>
        <div className="amh-navText">
          <span className="amh-navTitle">{item.label}</span>
          {item.sublabel && <span className="amh-navDesc">{item.sublabel}</span>}
        </div>
      </div>
      <span className="amh-arrow">
        <ChevronRight className="h-4 w-4" aria-hidden />
      </span>
    </>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="amh-overlay"
          variants={overlayVariants}
          initial="closed"
          animate="open"
          exit="closed"
          onClick={onClose}
        >
          <div className="amh-orbField" aria-hidden>
            <motion.div
              className="amh-orb amh-orb1"
              animate={{ scale: [1, 1.15, 1], rotate: [0, 180, 360] }}
              transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="amh-orb amh-orb2"
              animate={{ scale: [1, 0.9, 1.1, 1], rotate: [0, -90, -180, -360] }}
              transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="amh-orb amh-orb3"
              animate={{ scale: [1, 1.2, 0.95, 1] }}
              transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>

          <motion.div
            className="amh-content"
            variants={contentVariants}
            initial="closed"
            animate="open"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.button
              type="button"
              className="amh-closeButton"
              onClick={onClose}
              aria-label={closeLabel}
              variants={closeButtonVariants}
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.85 }}
            >
              <X className="h-5 w-5" aria-hidden />
            </motion.button>

            <motion.div className="amh-headerRow" variants={headerVariants}>
              <h2 className="amh-headerTitle">{brand}</h2>
            </motion.div>

            <div className="amh-navScroll">
              <nav className="amh-nav">
                {items.map((item) => (
                  <motion.div key={item.id} className="amh-navItem" variants={itemVariants}>
                    {item.href && !item.onClick ? (
                      <Link className="amh-navLink" href={item.href} onClick={onClose}>
                        {rowInner(item)}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        className="amh-navLink amh-navLink--button"
                        onClick={() => {
                          item.onClick?.();
                          onClose();
                        }}
                      >
                        {rowInner(item)}
                      </button>
                    )}
                  </motion.div>
                ))}
              </nav>
            </div>

            <div className="amh-stickyBottom">
              {cta && (
                <motion.div className="amh-ctaSection" variants={ctaVariants}>
                  {cta.href && !cta.onClick ? (
                    <Link className="amh-ctaButton" href={cta.href} onClick={onClose}>
                      {cta.icon}
                      {cta.label}
                      <motion.span
                        className="amh-ctaShine"
                        animate={{ x: ["-100%", "250%"] }}
                        transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 4, ease: "easeInOut" }}
                        aria-hidden
                      />
                    </Link>
                  ) : (
                    <button
                      type="button"
                      className="amh-ctaButton"
                      onClick={() => {
                        cta.onClick?.();
                        onClose();
                      }}
                    >
                      {cta.icon}
                      {cta.label}
                      <motion.span
                        className="amh-ctaShine"
                        animate={{ x: ["-100%", "250%"] }}
                        transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 4, ease: "easeInOut" }}
                        aria-hidden
                      />
                    </button>
                  )}
                </motion.div>
              )}

              <motion.div className="amh-footer" variants={footerVariants}>
                <div className="amh-footerTop">
                  <p className="amh-footerBrand">
                    {footerBrand} © {new Date().getFullYear()}
                  </p>
                  {footerControls && (
                    <div className="amh-footerControls">{footerControls}</div>
                  )}
                </div>
                {footerTagline && <p className="amh-footerTagline">{footerTagline}</p>}
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
