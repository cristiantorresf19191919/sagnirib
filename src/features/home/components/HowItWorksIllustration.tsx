"use client";

import { motion, type Variants } from "framer-motion";

/**
 * Per-step inline SVG art for the "Cómo funciona" cards.
 *
 * Animation architecture:
 *  1. ENTRANCE — every illustration uses a parent variant with
 *     `staggerChildren` so sub-elements come alive sequentially the
 *     first time the card enters the viewport. Strokes draw in via
 *     `pathLength`, shapes scale up, sparkles fade.
 *
 *  2. CONTINUOUS — once revealed, several elements switch to looping
 *     `animate={[ ... ]}` keyframe arrays so the cards stay alive: stars
 *     twinkle in a sequence, a cursor highlight slides through the
 *     catalog, a glow ring pulses behind the shield, sparkles orbit, the
 *     selected day in the calendar breathes with a halo ring.
 *
 * Colors come from CSS custom properties or fixed brand hex so the art
 * tints automatically in both light + dark themes via the parent card
 * surface.
 */

const PARENT: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const RISE: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

const POP: Variants = {
  hidden: { opacity: 0, scale: 0.7 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 280, damping: 18 },
  },
};

interface IllustrationProps {
  /** Forwarded by the host card so the SVG enters in lockstep with the
   *  card chrome. Once true, continuous loops also start running. */
  inView: boolean;
}

/* -------------------------------------------------------------------- */
/* Step 01 — "Hojea el catálogo"                                        */
/* -------------------------------------------------------------------- */
/**
 * Continuous motion:
 *  - Cursor highlight bar slides L→R through the listing pair on a 4s
 *    loop, then fades and restarts — feels like a finger scanning rows.
 *  - Five stars twinkle in a staggered sequence (40% scale + opacity).
 *  - The "selected" gold filter pill breathes (subtle scale).
 *  - A sparkle orbits the lead listing's avatar.
 */
export function IllustrationStep01({ inView }: Readonly<IllustrationProps>) {
  return (
    <motion.svg
      viewBox="0 0 320 180"
      role="img"
      aria-label="Catálogo con perfiles verificados"
      className="h-full w-full"
      variants={PARENT}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
    >
      <defs>
        <linearGradient id="hw01-card" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#F4EFE3" />
        </linearGradient>
        <linearGradient id="hw01-photo" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#A9C2B2" />
          <stop offset="1" stopColor="#5C6E51" />
        </linearGradient>
        <linearGradient id="hw01-scan" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#1F3D2E" stopOpacity="0" />
          <stop offset="0.5" stopColor="#1F3D2E" stopOpacity="0.12" />
          <stop offset="1" stopColor="#1F3D2E" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Browser card */}
      <motion.rect
        x="22"
        y="22"
        width="276"
        height="148"
        rx="14"
        fill="url(#hw01-card)"
        stroke="rgba(31,61,46,0.18)"
        strokeWidth="1"
        variants={RISE}
      />

      {/* Search bar */}
      <motion.g variants={RISE}>
        <rect x="36" y="38" width="172" height="20" rx="10" fill="#FBF7EC" stroke="rgba(31,61,46,0.12)" />
        <circle cx="46" cy="48" r="3.2" fill="none" stroke="rgba(31,61,46,0.55)" strokeWidth="1.4" />
        <line x1="48.5" y1="50.5" x2="51" y2="53" stroke="rgba(31,61,46,0.55)" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="55" y1="48" x2="120" y2="48" stroke="rgba(31,61,46,0.22)" strokeWidth="2" strokeLinecap="round" />
      </motion.g>

      {/* Filter pills — the gold filled pill breathes on a continuous loop */}
      <motion.g variants={RISE}>
        <rect x="218" y="38" width="32" height="20" rx="10" fill="#F4EFE3" stroke="rgba(31,61,46,0.12)" />
        <motion.rect
          x="256"
          y="38"
          width="32"
          height="20"
          rx="10"
          fill="#1F3D2E"
          initial={{ opacity: 1 }}
          animate={
            inView
              ? { opacity: [1, 0.78, 1] }
              : { opacity: 1 }
          }
          transition={{
            duration: 2.4,
            ease: "easeInOut",
            repeat: Number.POSITIVE_INFINITY,
          }}
        />
        <rect x="225" y="45" width="18" height="6" rx="3" fill="rgba(31,61,46,0.45)" />
        <rect x="262" y="45" width="20" height="6" rx="3" fill="#F4EFE3" />
      </motion.g>

      {/* Continuous scanning highlight bar — slides L→R across both
          listings on a 4s loop, hinting at the act of browsing. Sits at
          z below the card content via document order — rendered before
          the listing rows so they paint on top. */}
      <motion.rect
        x="36"
        y="68"
        width="80"
        height="92"
        rx="10"
        fill="url(#hw01-scan)"
        initial={{ x: -80 }}
        animate={
          inView
            ? { x: [-80, 230, 230, -80] }
            : { x: -80 }
        }
        transition={{
          duration: 4,
          times: [0, 0.45, 0.55, 1],
          ease: "easeInOut",
          repeat: Number.POSITIVE_INFINITY,
          repeatDelay: 0.6,
        }}
      />

      {/* Listing row 1 — featured. */}
      <motion.g variants={RISE}>
        <rect x="36" y="72" width="120" height="84" rx="10" fill="#FFFFFF" stroke="rgba(31,61,46,0.18)" />
        <rect x="46" y="82" width="40" height="50" rx="6" fill="url(#hw01-photo)" />
        <rect x="92" y="86" width="56" height="6" rx="3" fill="rgba(31,61,46,0.78)" />
        <rect x="92" y="98" width="40" height="4" rx="2" fill="rgba(31,61,46,0.35)" />
        {/* Star row — each star twinkles in a staggered loop. */}
        <g>
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.path
              key={i}
              d="M0 -3 L0.9 -0.9 L3 -0.9 L1.3 0.3 L1.9 2.4 L0 1.2 L-1.9 2.4 L-1.3 0.3 L-3 -0.9 L-0.9 -0.9 Z"
              transform={`translate(${96 + i * 9}, 116)`}
              fill="#C8A676"
              initial={{ scale: 1, opacity: 0.85 }}
              animate={
                inView
                  ? { scale: [1, 1.45, 1], opacity: [0.85, 1, 0.85] }
                  : { scale: 1, opacity: 0.85 }
              }
              style={{ transformOrigin: `${96 + i * 9}px 116px` }}
              transition={{
                duration: 1.6,
                ease: "easeInOut",
                repeat: Number.POSITIVE_INFINITY,
                delay: i * 0.18,
              }}
            />
          ))}
        </g>
        {/* Orbiting sparkle around the lead avatar — small circular path
            traced via translate keyframes. */}
        <motion.circle
          r="2.2"
          fill="#C8A676"
          initial={{ cx: 66, cy: 76, opacity: 0 }}
          animate={
            inView
              ? {
                  cx: [66, 92, 66, 40, 66],
                  cy: [76, 107, 138, 107, 76],
                  opacity: [0, 1, 1, 1, 0],
                }
              : { cx: 66, cy: 76, opacity: 0 }
          }
          transition={{
            duration: 5,
            ease: "easeInOut",
            repeat: Number.POSITIVE_INFINITY,
            repeatDelay: 1.2,
          }}
        />
      </motion.g>

      {/* Listing row 2 — secondary. */}
      <motion.g variants={RISE}>
        <rect x="164" y="72" width="120" height="84" rx="10" fill="rgba(255,255,255,0.7)" stroke="rgba(31,61,46,0.1)" />
        <rect x="174" y="82" width="40" height="50" rx="6" fill="rgba(31,61,46,0.18)" />
        <rect x="220" y="86" width="48" height="6" rx="3" fill="rgba(31,61,46,0.35)" />
        <rect x="220" y="98" width="32" height="4" rx="2" fill="rgba(31,61,46,0.2)" />
        <rect x="220" y="118" width="44" height="4" rx="2" fill="rgba(31,61,46,0.15)" />
      </motion.g>
    </motion.svg>
  );
}

/* -------------------------------------------------------------------- */
/* Step 02 — "Verifica antes de elegir"                                 */
/* -------------------------------------------------------------------- */
/**
 * Continuous motion:
 *  - Shield emits a slow pulse ring outward + a soft inner glow that
 *    breathes — reads as "active verification".
 *  - The check inside the shield draws repeatedly on a 4s loop with a
 *    short pause between cycles, so the verification action feels live.
 *  - Three sparkles float on independent timelines (different period +
 *    amplitude so they never sync).
 *  - The hologram dot on the ID card rotates slowly.
 */
export function IllustrationStep02({ inView }: Readonly<IllustrationProps>) {
  return (
    <motion.svg
      viewBox="0 0 320 180"
      role="img"
      aria-label="Documento verificado con escudo"
      className="h-full w-full"
      variants={PARENT}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
    >
      <defs>
        <linearGradient id="hw02-card" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#F4EFE3" />
        </linearGradient>
        <linearGradient id="hw02-shield" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#3A7152" />
          <stop offset="1" stopColor="#1F3D2E" />
        </linearGradient>
        <radialGradient id="hw02-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#3A7152" stopOpacity="0.4" />
          <stop offset="1" stopColor="#3A7152" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* ID card */}
      <motion.rect
        x="40"
        y="36"
        width="200"
        height="118"
        rx="14"
        fill="url(#hw02-card)"
        stroke="rgba(31,61,46,0.18)"
        strokeWidth="1"
        variants={RISE}
      />

      {/* Avatar circle + minimal portrait */}
      <motion.circle cx="86" cy="80" r="22" fill="#E5D5B6" stroke="rgba(31,61,46,0.22)" variants={POP} />
      <motion.path
        d="M86 78 a8 8 0 1 0 0.001 0 Z M70 102 c4 -10 28 -10 32 0"
        fill="#1F3D2E"
        opacity="0.55"
        variants={RISE}
      />

      {/* Name + lines */}
      <motion.g variants={RISE}>
        <rect x="118" y="62" width="98" height="6" rx="3" fill="rgba(31,61,46,0.78)" />
        <rect x="118" y="76" width="74" height="4" rx="2" fill="rgba(31,61,46,0.4)" />
        <rect x="118" y="88" width="84" height="4" rx="2" fill="rgba(31,61,46,0.4)" />
        <rect x="118" y="100" width="60" height="4" rx="2" fill="rgba(31,61,46,0.3)" />
      </motion.g>

      {/* Hologram dot — slow continuous rotation, infinite. The inner
          circle stays static so it reads as a gold disc with a spinning
          outer ring of holographic facets. */}
      <motion.g variants={POP} style={{ transformOrigin: "220px 48px" }}>
        <motion.g
          initial={{ rotate: 0 }}
          animate={inView ? { rotate: 360 } : { rotate: 0 }}
          transition={{
            duration: 14,
            ease: "linear",
            repeat: Number.POSITIVE_INFINITY,
          }}
          style={{ transformOrigin: "220px 48px" }}
        >
          <circle cx="220" cy="48" r="6" fill="#C8A676" opacity="0.85" />
          <circle cx="220" cy="42" r="0.8" fill="#FBF7EC" />
          <circle cx="226" cy="48" r="0.8" fill="#FBF7EC" />
          <circle cx="220" cy="54" r="0.8" fill="#FBF7EC" />
          <circle cx="214" cy="48" r="0.8" fill="#FBF7EC" />
        </motion.g>
        <circle cx="220" cy="48" r="3" fill="#FBF7EC" />
      </motion.g>

      {/* Pulse ring expanding outward from the shield — anchors the
          shield as the "active verification" focal element. */}
      <motion.circle
        cx="238"
        cy="128"
        r="22"
        fill="none"
        stroke="#3A7152"
        strokeWidth="1.5"
        initial={{ r: 22, opacity: 0 }}
        animate={
          inView
            ? { r: [22, 42], opacity: [0.6, 0] }
            : { r: 22, opacity: 0 }
        }
        transition={{
          duration: 2.2,
          ease: "easeOut",
          repeat: Number.POSITIVE_INFINITY,
          repeatDelay: 0.4,
        }}
      />
      {/* Soft inner breathing glow behind the shield */}
      <motion.circle
        cx="238"
        cy="128"
        r="28"
        fill="url(#hw02-glow)"
        initial={{ scale: 1, opacity: 0 }}
        animate={
          inView
            ? { scale: [0.85, 1.1, 0.85], opacity: [0.5, 0.9, 0.5] }
            : { scale: 1, opacity: 0 }
        }
        style={{ transformOrigin: "238px 128px" }}
        transition={{
          duration: 3.2,
          ease: "easeInOut",
          repeat: Number.POSITIVE_INFINITY,
        }}
      />

      {/* Shield + repeating check */}
      <motion.g variants={POP}>
        <path
          d="M220 110 c0 -6 4 -10 18 -12 c14 2 18 6 18 12 c0 22 -10 32 -18 38 c-8 -6 -18 -16 -18 -38 Z"
          fill="url(#hw02-shield)"
          stroke="#FBF7EC"
          strokeWidth="2"
        />
        {/* Check redraws on a 4s loop — pathLength 0→1, hold, fade pause */}
        <motion.path
          d="M229 132 l5 5 l11 -12"
          fill="none"
          stroke="#FBF7EC"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={
            inView
              ? { pathLength: [0, 1, 1, 0], opacity: [0, 1, 1, 0] }
              : { pathLength: 1, opacity: 1 }
          }
          transition={{
            duration: 4,
            times: [0, 0.35, 0.85, 1],
            ease: "easeInOut",
            repeat: Number.POSITIVE_INFINITY,
          }}
        />
      </motion.g>

      {/* Three floating sparkles, independent timelines so they never sync */}
      <motion.circle
        cx="44"
        cy="42"
        r="2"
        fill="#C8A676"
        initial={{ opacity: 0, y: 0 }}
        animate={
          inView
            ? { opacity: [0, 1, 0], y: [0, -8, 0] }
            : { opacity: 0 }
        }
        transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
      />
      <motion.circle
        cx="276"
        cy="84"
        r="2.4"
        fill="#C8A676"
        initial={{ opacity: 0, y: 0 }}
        animate={
          inView
            ? { opacity: [0, 1, 0], y: [0, -10, 0] }
            : { opacity: 0 }
        }
        transition={{ duration: 3.6, repeat: Number.POSITIVE_INFINITY, delay: 0.8 }}
      />
      <motion.circle
        cx="60"
        cy="148"
        r="1.8"
        fill="#C8A676"
        initial={{ opacity: 0, y: 0 }}
        animate={
          inView
            ? { opacity: [0, 1, 0], y: [0, -6, 0] }
            : { opacity: 0 }
        }
        transition={{ duration: 2.6, repeat: Number.POSITIVE_INFINITY, delay: 1.5 }}
      />
    </motion.svg>
  );
}

/* -------------------------------------------------------------------- */
/* Step 03 — "Contrata sin fricción"                                    */
/* -------------------------------------------------------------------- */
/**
 * Continuous motion:
 *  - Selected day breathes (scale loop) + emits a pulse halo outward.
 *  - The check inside it redraws on a 4s cycle with a short pause.
 *  - Two sparkles bob on different periods + a 4-pointed star sparkle
 *    pulses + rotates near the calendar corner.
 *  - The two binding rings on top do a tiny "wobble" — like the
 *    calendar is gently swaying.
 */
export function IllustrationStep03({ inView }: Readonly<IllustrationProps>) {
  const selectedX = 60 + 3 * 28;
  const selectedY = 78 + 2 * 22;
  const selectedCenterX = selectedX + 10;
  const selectedCenterY = selectedY + 9;

  return (
    <motion.svg
      viewBox="0 0 320 180"
      role="img"
      aria-label="Reserva agendada"
      className="h-full w-full"
      variants={PARENT}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
    >
      <defs>
        <linearGradient id="hw03-card" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#F4EFE3" />
        </linearGradient>
        <radialGradient id="hw03-halo" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#1F3D2E" stopOpacity="0.35" />
          <stop offset="1" stopColor="#1F3D2E" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Calendar body */}
      <motion.rect
        x="46"
        y="28"
        width="228"
        height="134"
        rx="14"
        fill="url(#hw03-card)"
        stroke="rgba(31,61,46,0.18)"
        strokeWidth="1"
        variants={RISE}
      />

      {/* Binding rings — sway gently */}
      <motion.g
        initial={{ y: 0, opacity: 0, scale: 0.7 }}
        animate={
          inView
            ? { y: [0, -1.2, 0], opacity: 1, scale: 1 }
            : { y: 0, opacity: 0, scale: 0.7 }
        }
        transition={{
          y: { duration: 2.4, ease: "easeInOut", repeat: Number.POSITIVE_INFINITY },
          opacity: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
          scale: { type: "spring", stiffness: 280, damping: 18 },
        }}
      >
        <rect x="92" y="22" width="6" height="14" rx="2" fill="rgba(31,61,46,0.55)" />
        <rect x="222" y="22" width="6" height="14" rx="2" fill="rgba(31,61,46,0.55)" />
      </motion.g>

      {/* Header */}
      <motion.g variants={RISE}>
        <rect x="60" y="44" width="56" height="8" rx="4" fill="rgba(31,61,46,0.7)" />
        <rect x="124" y="46" width="40" height="6" rx="3" fill="rgba(31,61,46,0.3)" />
      </motion.g>

      {/* Day-of-week row */}
      <motion.g variants={RISE}>
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <rect
            key={i}
            x={60 + i * 28}
            y="64"
            width="20"
            height="3"
            rx="1.5"
            fill="rgba(31,61,46,0.32)"
          />
        ))}
      </motion.g>

      {/* Date grid */}
      <motion.g variants={RISE}>
        {Array.from({ length: 4 }).flatMap((_, row) =>
          Array.from({ length: 7 }).map((__, col) => {
            const i = row * 7 + col;
            const x = 60 + col * 28;
            const y = 78 + row * 22;
            const isSelected = i === 17;
            return (
              <rect
                key={i}
                x={x}
                y={y}
                width="20"
                height="18"
                rx="5"
                fill={isSelected ? "transparent" : "#FBF7EC"}
                stroke={isSelected ? "transparent" : "rgba(31,61,46,0.1)"}
              />
            );
          }),
        )}
      </motion.g>

      {/* Pulse halo behind the selected day — expanding ring */}
      <motion.circle
        cx={selectedCenterX}
        cy={selectedCenterY}
        r="10"
        fill="none"
        stroke="#1F3D2E"
        strokeWidth="1.4"
        initial={{ r: 10, opacity: 0 }}
        animate={
          inView
            ? { r: [10, 24], opacity: [0.55, 0] }
            : { r: 10, opacity: 0 }
        }
        transition={{
          duration: 2,
          ease: "easeOut",
          repeat: Number.POSITIVE_INFINITY,
          repeatDelay: 0.4,
        }}
      />
      {/* Inner radial halo — breathes */}
      <motion.circle
        cx={selectedCenterX}
        cy={selectedCenterY}
        r="18"
        fill="url(#hw03-halo)"
        initial={{ scale: 1, opacity: 0 }}
        animate={
          inView
            ? { scale: [0.8, 1.05, 0.8], opacity: [0.5, 0.85, 0.5] }
            : { scale: 1, opacity: 0 }
        }
        style={{ transformOrigin: `${selectedCenterX}px ${selectedCenterY}px` }}
        transition={{ duration: 3, ease: "easeInOut", repeat: Number.POSITIVE_INFINITY }}
      />

      {/* Selected day pill — breathes subtly */}
      <motion.g variants={POP}>
        <motion.rect
          x={selectedX}
          y={selectedY}
          width="20"
          height="18"
          rx="6"
          fill="#1F3D2E"
          initial={{ scale: 1 }}
          animate={
            inView
              ? { scale: [1, 1.06, 1] }
              : { scale: 1 }
          }
          style={{ transformOrigin: `${selectedCenterX}px ${selectedCenterY}px` }}
          transition={{ duration: 2.6, ease: "easeInOut", repeat: Number.POSITIVE_INFINITY }}
        />
        {/* Check redraws every 4s, pathLength 0→1 + opacity in/out */}
        <motion.path
          d={`M${selectedX + 4} ${selectedY + 9} l4 4 l8 -8`}
          fill="none"
          stroke="#FBF7EC"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={
            inView
              ? { pathLength: [0, 1, 1, 0], opacity: [0, 1, 1, 0] }
              : { pathLength: 1, opacity: 1 }
          }
          transition={{
            duration: 4,
            times: [0, 0.35, 0.85, 1],
            ease: "easeInOut",
            repeat: Number.POSITIVE_INFINITY,
          }}
        />
      </motion.g>

      {/* Floating sparkles — different periods */}
      <motion.circle
        cx="32"
        cy="56"
        r="2.2"
        fill="#C8A676"
        initial={{ opacity: 0, y: 0 }}
        animate={
          inView
            ? { opacity: [0, 1, 0], y: [0, -6, 0] }
            : { opacity: 0 }
        }
        transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
      />
      <motion.circle
        cx="290"
        cy="120"
        r="2"
        fill="#C8A676"
        initial={{ opacity: 0, y: 0 }}
        animate={
          inView
            ? { opacity: [0, 1, 0], y: [0, -8, 0] }
            : { opacity: 0 }
        }
        transition={{ duration: 3.6, repeat: Number.POSITIVE_INFINITY, delay: 0.8 }}
      />
      {/* 4-pointed sparkle — pulses + rotates */}
      <motion.path
        d="M286 38 l2 -6 l2 6 l6 2 l-6 2 l-2 6 l-2 -6 l-6 -2 z"
        fill="#C8A676"
        initial={{ opacity: 0.7, scale: 1, rotate: 0 }}
        animate={
          inView
            ? { opacity: [0.4, 0.95, 0.4], scale: [0.85, 1.15, 0.85], rotate: [0, 90, 180] }
            : { opacity: 0.7 }
        }
        style={{ transformOrigin: "288px 40px" }}
        transition={{ duration: 4, ease: "easeInOut", repeat: Number.POSITIVE_INFINITY }}
      />
    </motion.svg>
  );
}
