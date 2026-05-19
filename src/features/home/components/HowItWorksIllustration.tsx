"use client";

import { motion, type Variants } from "framer-motion";

/**
 * Per-step inline SVG art for the "Cómo funciona" cards. All three
 * compositions share a 320×180 viewBox so the cards render at a uniform
 * height regardless of which step's art is loaded.
 *
 * Color tokens are taken from CSS custom properties via `currentColor`
 * + inline fills so the art automatically tints with the brand palette
 * in both light + dark themes.
 *
 * Animation strategy: every illustration uses a parent `variants` with
 * `staggerChildren` so sub-elements come alive sequentially — strokes
 * draw in (`pathLength`), shapes scale up (`scale`), sparkles fade
 * (`opacity`). The parent animates on viewport entry and is driven by
 * the same scroll cascade as the card chrome.
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

const DRAW: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { duration: 1.1, ease: [0.22, 1, 0.36, 1] },
      opacity: { duration: 0.3 },
    },
  },
};

const SPARKLE: Variants = {
  hidden: { opacity: 0, scale: 0 },
  visible: {
    opacity: [0, 1, 0.65, 1],
    scale: [0, 1.1, 0.95, 1],
    transition: { duration: 1.4, times: [0, 0.4, 0.7, 1] },
  },
};

interface IllustrationProps {
  /** Forwarded to the inner motion.svg so it shares an in-view trigger
   *  with the host card. */
  inView: boolean;
}

/**
 * Step 01 — "Hojea el catálogo". A miniature catalog mockup: top search
 * bar with filter pills, then two listing rows with avatar + name lines
 * + star rating. The first listing slides into focus + its stars pop
 * in to anchor the act of *browsing*.
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
        <rect
          x="36"
          y="38"
          width="172"
          height="20"
          rx="10"
          fill="#FBF7EC"
          stroke="rgba(31,61,46,0.12)"
        />
        <circle cx="46" cy="48" r="3.2" fill="none" stroke="rgba(31,61,46,0.55)" strokeWidth="1.4" />
        <line x1="48.5" y1="50.5" x2="51" y2="53" stroke="rgba(31,61,46,0.55)" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="55" y1="48" x2="120" y2="48" stroke="rgba(31,61,46,0.22)" strokeWidth="2" strokeLinecap="round" />
      </motion.g>

      {/* Filter pills */}
      <motion.g variants={RISE}>
        <rect x="218" y="38" width="32" height="20" rx="10" fill="#F4EFE3" stroke="rgba(31,61,46,0.12)" />
        <rect x="256" y="38" width="32" height="20" rx="10" fill="#1F3D2E" />
        <rect x="225" y="45" width="18" height="6" rx="3" fill="rgba(31,61,46,0.45)" />
        <rect x="262" y="45" width="20" height="6" rx="3" fill="#F4EFE3" />
      </motion.g>

      {/* Listing row 1 — featured. Slides in + sparkles. */}
      <motion.g variants={RISE}>
        <rect x="36" y="72" width="120" height="84" rx="10" fill="#FFFFFF" stroke="rgba(31,61,46,0.18)" />
        <rect x="46" y="82" width="40" height="50" rx="6" fill="url(#hw01-photo)" />
        <rect x="92" y="86" width="56" height="6" rx="3" fill="rgba(31,61,46,0.78)" />
        <rect x="92" y="98" width="40" height="4" rx="2" fill="rgba(31,61,46,0.35)" />
        {/* Star row */}
        <motion.g variants={POP}>
          {[0, 1, 2, 3, 4].map((i) => (
            <path
              key={i}
              d="M0 -3 L0.9 -0.9 L3 -0.9 L1.3 0.3 L1.9 2.4 L0 1.2 L-1.9 2.4 L-1.3 0.3 L-3 -0.9 L-0.9 -0.9 Z"
              transform={`translate(${96 + i * 9}, 116) scale(1)`}
              fill="#C8A676"
            />
          ))}
        </motion.g>
        <motion.circle cx="148" cy="80" r="2.4" fill="#C8A676" variants={SPARKLE} />
      </motion.g>

      {/* Listing row 2 — secondary. Drawn lighter so it reads as "and more". */}
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

/**
 * Step 02 — "Verifica antes de elegir". A profile card with an avatar
 * shield: the shield grows in and the cream check pops on top, visually
 * anchoring "this person has been verified".
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

      {/* Avatar circle */}
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

      {/* Stamp / hologram dot */}
      <motion.g variants={POP}>
        <circle cx="220" cy="48" r="6" fill="#C8A676" opacity="0.85" />
        <circle cx="220" cy="48" r="3" fill="#FBF7EC" />
      </motion.g>

      {/* Shield overlay — pops in last and the check draws inside it */}
      <motion.g variants={POP}>
        <path
          d="M220 110 c0 -6 4 -10 18 -12 c14 2 18 6 18 12 c0 22 -10 32 -18 38 c-8 -6 -18 -16 -18 -38 Z"
          fill="url(#hw02-shield)"
          stroke="#FBF7EC"
          strokeWidth="2"
        />
        <motion.path
          d="M229 132 l5 5 l11 -12"
          fill="none"
          stroke="#FBF7EC"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          variants={DRAW}
        />
      </motion.g>

      {/* Decorative sparkles */}
      <motion.circle cx="44" cy="42" r="2" fill="#C8A676" variants={SPARKLE} />
      <motion.circle cx="276" cy="84" r="2.4" fill="#C8A676" variants={SPARKLE} />
      <motion.circle cx="60" cy="148" r="1.8" fill="#C8A676" variants={SPARKLE} />
    </motion.svg>
  );
}

/**
 * Step 03 — "Contrata sin fricción". A calendar grid with one cell
 * highlighted (the chosen day) + a check ticking in. Visually closes
 * the loop: the user has reached the booking moment.
 */
export function IllustrationStep03({ inView }: Readonly<IllustrationProps>) {
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

      {/* Calendar binding rings */}
      <motion.g variants={POP}>
        <rect x="92" y="22" width="6" height="14" rx="2" fill="rgba(31,61,46,0.55)" />
        <rect x="222" y="22" width="6" height="14" rx="2" fill="rgba(31,61,46,0.55)" />
      </motion.g>

      {/* Calendar header — month label */}
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

      {/* Date grid: 4 rows × 7 columns */}
      <motion.g variants={RISE}>
        {Array.from({ length: 4 }).flatMap((_, row) =>
          Array.from({ length: 7 }).map((__, col) => {
            const i = row * 7 + col;
            const x = 60 + col * 28;
            const y = 78 + row * 22;
            const isSelected = i === 17; // mid-month highlight
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

      {/* Selected day pill — pops in + check draws inside */}
      <motion.g variants={POP}>
        <rect
          x={60 + 3 * 28}
          y={78 + 2 * 22}
          width="20"
          height="18"
          rx="6"
          fill="#1F3D2E"
        />
        <motion.path
          d={`M${60 + 3 * 28 + 4} ${78 + 2 * 22 + 9} l4 4 l8 -8`}
          fill="none"
          stroke="#FBF7EC"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          variants={DRAW}
        />
      </motion.g>

      {/* Decorative sparkles outside the calendar */}
      <motion.circle cx="32" cy="56" r="2.2" fill="#C8A676" variants={SPARKLE} />
      <motion.circle cx="290" cy="120" r="2" fill="#C8A676" variants={SPARKLE} />
      <motion.path
        d="M286 38 l2 -6 l2 6 l6 2 l-6 2 l-2 6 l-2 -6 l-6 -2 z"
        fill="#C8A676"
        opacity="0.7"
        variants={SPARKLE}
      />
    </motion.svg>
  );
}
