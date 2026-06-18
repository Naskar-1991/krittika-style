import { useRef, useEffect, useState, useCallback } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  AnimatePresence,
} from "motion/react";
import SEOHead from "../components/SEOHead";

/* ─────────────────────────────────────────────────────────────
   Color tokens — extracted verbatim from src/index.css :root
   Zero new colors introduced.
───────────────────────────────────────────────────────────── */
const C = {
  white:         "#ffffff",
  cream:         "#f7f6ff",
  bone:          "#eeecfc",
  ghost:         "#f5f4ff",
  bgTertiary:    "#eeedf8",
  border:        "#e2e0f5",
  borderLight:   "#e6e4f5",
  textLight:     "#9490b8",
  warmGray:      "#8a86b8",
  textSecondary: "#5a567a",
  textPrimary:   "#1a1a2e",
  charcoal:      "#2d2b55",
  primary:       "#667eea",
  primaryDark:   "#5568d3",
  primaryLight:  "#8a9ef7",
  secondary:     "#764ba2",
  goldLight:     "#9B90F5",
};

/* ─────────────────────────────────────────────────────────────
   Font stacks — already loaded via @import in index.css
───────────────────────────────────────────────────────────── */
const F = {
  serif: "'Cormorant Garamond', Georgia, serif",
  sans:  "'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif",
};

/* ─────────────────────────────────────────────────────────────
   Shared spring presets
───────────────────────────────────────────────────────────── */
const SPRING_GENTLE  = { type: "spring", stiffness: 120, damping: 20 };
const SPRING_SNAPPY  = { type: "spring", stiffness: 300, damping: 25 };
const EASE_EXPO      = [0.16, 1, 0.3, 1];

/* ─────────────────────────────────────────────────────────────
   Scroll-reveal hook
───────────────────────────────────────────────────────────── */
function useInView(threshold = 0.15) {
  const ref   = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true); },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

/* ─────────────────────────────────────────────────────────────
   Animated counter
───────────────────────────────────────────────────────────── */
function AnimatedCounter({ target, suffix = "", duration = 2 }) {
  const [val, setVal] = useState(0);
  const [ref, inView] = useInView(0.5);
  useEffect(() => {
    if (!inView) return;
    let v = 0;
    const step = target / (duration * 60);
    const id = setInterval(() => {
      v += step;
      if (v >= target) { setVal(target); clearInterval(id); }
      else setVal(Math.floor(v));
    }, 1000 / 60);
    return () => clearInterval(id);
  }, [inView, target, duration]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

/* ─────────────────────────────────────────────────────────────
   Outline button — 1px border, solid fill on hover
───────────────────────────────────────────────────────────── */
function OutlineBtn({ children, dark = false, onClick }) {
  const [hover, setHover] = useState(false);
  const base   = dark ? C.white      : C.textPrimary;
  const bgFill = dark ? C.white      : C.textPrimary;
  const txtFill= dark ? C.textPrimary: C.white;
  return (
    <button
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
      style={{
        fontFamily:    F.sans,
        fontSize:      "clamp(11px, 1.1vw, 13px)",
        fontWeight:    500,
        letterSpacing: "0.09em",
        textTransform: "uppercase",
        color:         hover ? txtFill : base,
        background:    hover ? bgFill  : "transparent",
        border:        `1px solid ${base}`,
        borderRadius:  0,
        padding:       "14px clamp(28px, 3vw, 48px)",
        cursor:        "pointer",
        transition:    "background 0.28s ease, color 0.28s ease",
        minHeight:     44,
        display:       "inline-block",
      }}
    >
      {children}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────
   Underline-sweep link
───────────────────────────────────────────────────────────── */
function SweepLink({ children, color, hoverColor, style: s, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <span
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
      style={{
        position:  "relative",
        display:   "inline-block",
        cursor:    "pointer",
        color:     hover ? (hoverColor || color) : color,
        transition:"color 0.22s ease",
        ...s,
      }}
    >
      {children}
      <span style={{
        position:   "absolute",
        bottom:     0,
        left:       0,
        right:      hover ? 0 : "100%",
        height:     1,
        background: hoverColor || color,
        transition: "right 0.28s ease",
      }} />
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════
   1. HERO
═══════════════════════════════════════════════════════════ */
function Hero() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const sx = useSpring(mouseX, { stiffness: 80, damping: 20 });
  const sy = useSpring(mouseY, { stiffness: 80, damping: 20 });
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const h = (e) => setReduced(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);

  const onMouseMove = useCallback((e) => {
    if (reduced) return;
    mouseX.set((e.clientX / window.innerWidth  - 0.5) * 22);
    mouseY.set((e.clientY / window.innerHeight - 0.5) * 22);
  }, [reduced, mouseX, mouseY]);

  const stagger = (delay) => ({
    initial:    { opacity: 0, y: 28 },
    animate:    { opacity: 1, y: 0 },
    transition: { duration: 0.55, delay, ease: EASE_EXPO },
  });

  return (
    <section
      onMouseMove={onMouseMove}
      style={{
        minHeight:      "100svh",
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        justifyContent: "center",
        background:     C.white,
        position:       "relative",
        overflow:       "hidden",
        padding:        "0 clamp(24px, 6vw, 80px)",
      }}
    >
      {/* Ambient glow follows mouse */}
      <motion.div
        style={{
          position:     "absolute",
          width:        "55vw",
          height:       "55vw",
          maxWidth:     720,
          maxHeight:    720,
          borderRadius: "50%",
          background:   C.primary,
          opacity:      0.05,
          filter:       "blur(110px)",
          top:          "50%",
          left:         "50%",
          x:            sx,
          y:            sy,
          translateX:   "-50%",
          translateY:   "-50%",
          pointerEvents:"none",
        }}
      />

      {/* Eyebrow */}
      <motion.p {...stagger(0)} style={{
        fontFamily:    F.sans,
        fontSize:      "clamp(9px, 1.1vw, 11px)",
        fontWeight:    500,
        letterSpacing: "0.24em",
        textTransform: "uppercase",
        color:         C.textLight,
        margin:        "0 0 clamp(20px, 3.5vw, 40px)",
        textAlign:     "center",
      }}>
        Krittika Style — New Collection
      </motion.p>

      {/* Giant headline */}
      <motion.h1 {...stagger(0.1)} style={{
        fontFamily:  F.serif,
        fontSize:    "clamp(54px, 10vw, 120px)",
        fontWeight:  600,
        letterSpacing: "-0.03em",
        lineHeight:  0.95,
        color:       C.textPrimary,
        textAlign:   "center",
        margin:      0,
        maxWidth:    "12ch",
      }}>
        Woven for{" "}
        <span style={{ color: C.primary }}>Eternity.</span>
      </motion.h1>

      {/* Subtitle */}
      <motion.p {...stagger(0.32)} style={{
        fontFamily: F.sans,
        fontSize:   "clamp(15px, 1.8vw, 19px)",
        fontWeight: 300,
        color:      C.textSecondary,
        margin:     "clamp(20px, 3vw, 32px) 0 0",
        textAlign:  "center",
        maxWidth:   "44ch",
        lineHeight: 1.68,
      }}>
        Premium handwoven silk and cotton sarees — sourced directly from master
        weavers across Bengal, Varanasi, and Kanchipuram.
      </motion.p>

      {/* CTA */}
      <motion.div {...stagger(0.52)} style={{ marginTop: "clamp(28px, 4.5vw, 52px)" }}>
        <OutlineBtn>Explore the Collection</OutlineBtn>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1, duration: 0.6 }}
        style={{
          position:       "absolute",
          bottom:         "clamp(24px, 4vh, 44px)",
          left:           "50%",
          transform:      "translateX(-50%)",
          display:        "flex",
          flexDirection:  "column",
          alignItems:     "center",
          gap:            10,
          pointerEvents:  "none",
        }}
      >
        <span style={{
          fontFamily:    F.sans,
          fontSize:      9,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color:         C.textLight,
        }}>
          Scroll
        </span>
        <div style={{ width: 1, height: 36, background: C.border, position: "relative", overflow: "hidden" }}>
          <motion.div
            animate={{ y: ["-100%", "100%"] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            style={{ position: "absolute", inset: 0, background: C.primary }}
          />
        </div>
      </motion.div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   2. FEATURE STRIP — 01 / 02 / 03
═══════════════════════════════════════════════════════════ */
const FEATURES = [
  { num: "01", stat: "3,000+", label: "Weavers partnered across six states. No middlemen. No compromise." },
  { num: "02", stat: "48 hrs", label: "From loom to doorstep. Handcrafted certificates of authenticity." },
  { num: "03", stat: "100%",   label: "Natural fibres only. Zero synthetic blends. Zero exceptions." },
];

function FeatureStrip() {
  const [ref, inView] = useInView(0.18);
  return (
    <section ref={ref} style={{
      background: C.cream,
      padding:    "clamp(72px, 11vh, 130px) clamp(24px, 7vw, 120px)",
    }}>
      <div style={{
        maxWidth:             1240,
        margin:               "0 auto",
        display:              "grid",
        gridTemplateColumns:  "repeat(auto-fit, minmax(260px, 1fr))",
        gap:                  "clamp(44px, 5vw, 88px)",
      }}>
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.num}
            initial={{ opacity: 0, y: 44 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ ...SPRING_GENTLE, delay: i * 0.08 }}
          >
            <p style={{
              fontFamily:    F.sans,
              fontSize:      "clamp(9px, 0.9vw, 11px)",
              fontWeight:    600,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color:         C.primary,
              margin:        "0 0 18px",
            }}>{f.num}</p>
            <h3 style={{
              fontFamily:    F.serif,
              fontSize:      "clamp(52px, 6.5vw, 88px)",
              fontWeight:    600,
              letterSpacing: "-0.03em",
              lineHeight:    0.92,
              color:         C.textPrimary,
              margin:        "0 0 22px",
            }}>{f.stat}</h3>
            <p style={{
              fontFamily: F.sans,
              fontSize:   "clamp(14px, 1.4vw, 16px)",
              fontWeight: 300,
              color:      C.textSecondary,
              lineHeight: 1.68,
              maxWidth:   "30ch",
              margin:     0,
            }}>{f.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   3. CINEMATIC PRODUCT SHOWCASE
═══════════════════════════════════════════════════════════ */
const PRODUCTS = [
  {
    id: 1,
    name:  "Kanjivaram Crimson",
    price: "₹24,500",
    label: "Collection 01",
    desc:  "Pure mulberry silk, woven by master craftsmen in Kanchipuram. The zari border is 24-karat gold thread fired at 1,000°C. Each saree takes eleven days to complete.",
    image: "https://images.unsplash.com/photo-1583391733956-6c78276477e1?w=960&auto=format&fit=crop&q=80",
  },
  {
    id: 2,
    name:  "Banarasi Ivory",
    price: "₹18,200",
    label: "Collection 02",
    desc:  "Six yards of Mughal motifs in opaque brocade. The kadwa weaving technique produces every motif individually — three weeks, one saree, never replicated.",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=960&auto=format&fit=crop&q=80",
  },
  {
    id: 3,
    name:  "Tant Bengal Night",
    price: "₹8,900",
    label: "Collection 03",
    desc:  "Breathable handloom cotton from Shantipur, woven on pit looms passed down through four generations. Cool against the skin. Warm in every memory.",
    image: "https://images.unsplash.com/photo-1617019114583-affb34d1b3cd?w=960&auto=format&fit=crop&q=80",
  },
];

function ShowcaseItem({ product, reversed, index }) {
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target:  sectionRef,
    offset:  ["start end", "end start"],
  });
  const imgScale = useTransform(scrollYProgress, [0.05, 0.55], [0.92, 1.0]);
  const textY    = useTransform(scrollYProgress, [0.05, 0.45],  [36,   0]);
  const textOp   = useTransform(scrollYProgress, [0.05, 0.35],  [0,    1]);

  const [textRef, inView] = useInView(0.22);
  const bg = index % 2 === 0 ? C.white : C.cream;

  return (
    <section ref={sectionRef} style={{
      background: bg,
      padding:    "clamp(64px, 10vh, 130px) clamp(24px, 6vw, 80px)",
      overflow:   "hidden",
    }}>
      <div
        ref={textRef}
        style={{
          maxWidth:            1320,
          margin:              "0 auto",
          display:             "grid",
          gridTemplateColumns: "1fr 1fr",
          gap:                 "clamp(36px, 6vw, 100px)",
          alignItems:          "center",
        }}
        className={`showcase-row${reversed ? " reversed" : ""}`}
      >
        {/* Image */}
        <motion.div
          style={{
            scale:        imgScale,
            overflow:     "hidden",
            aspectRatio:  "3/4",
            background:   C.bone,
            order:        reversed ? 2 : 1,
          }}
        >
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        </motion.div>

        {/* Text */}
        <motion.div
          style={{
            y:     textY,
            opacity: textOp,
            order: reversed ? 1 : 2,
            paddingLeft:  reversed ? 0 : "clamp(0px, 2vw, 40px)",
            paddingRight: reversed ? "clamp(0px, 2vw, 40px)" : 0,
          }}
        >
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.48, ease: EASE_EXPO }}
            style={{
              fontFamily:    F.sans,
              fontSize:      "clamp(9px, 0.9vw, 11px)",
              fontWeight:    600,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color:         C.primary,
              margin:        "0 0 22px",
            }}
          >— {product.label}</motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.06, duration: 0.52, ease: EASE_EXPO }}
            style={{
              fontFamily:    F.serif,
              fontSize:      "clamp(36px, 5.5vw, 76px)",
              fontWeight:    600,
              letterSpacing: "-0.025em",
              lineHeight:    1,
              color:         C.textPrimary,
              margin:        "0 0 clamp(16px, 2.5vw, 28px)",
            }}
          >{product.name}</motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.12, duration: 0.5, ease: EASE_EXPO }}
            style={{
              fontFamily: F.sans,
              fontSize:   "clamp(15px, 1.5vw, 18px)",
              fontWeight: 300,
              color:      C.textSecondary,
              lineHeight: 1.72,
              maxWidth:   "40ch",
              margin:     "0 0 clamp(22px, 3vw, 40px)",
            }}
          >{product.desc}</motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.18, duration: 0.48, ease: EASE_EXPO }}
            style={{ display: "flex", alignItems: "center", gap: "clamp(20px, 3vw, 36px)", flexWrap: "wrap" }}
          >
            <span style={{
              fontFamily:    F.serif,
              fontSize:      "clamp(22px, 3vw, 34px)",
              fontWeight:    600,
              color:         C.textPrimary,
              letterSpacing: "-0.02em",
            }}>{product.price}</span>
            <OutlineBtn>View Details</OutlineBtn>
          </motion.div>
        </motion.div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .showcase-row { grid-template-columns: 1fr !important; }
          .showcase-row > * { order: unset !important; }
          .showcase-row.reversed { }
        }
      `}</style>
    </section>
  );
}

function ProductShowcase() {
  return (
    <>
      {PRODUCTS.map((p, i) => (
        <ShowcaseItem key={p.id} product={p} reversed={i % 2 !== 0} index={i} />
      ))}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   4. DARK SECTION — THE FABRIC
═══════════════════════════════════════════════════════════ */
const FABRIC_STATS = [
  { value: 500,  suffix: "+",   label: "Years of continuous weaving heritage" },
  { value: 72,   suffix: " hrs", label: "Average time to weave a single silk saree" },
  { value: 40,   suffix: "k+",  label: "Thread crossings per square inch of zari" },
];

function FabricSection() {
  const [ref, inView] = useInView(0.18);
  return (
    <section ref={ref} style={{
      background: C.textPrimary,
      padding:    "clamp(88px, 13vh, 170px) clamp(24px, 7vw, 120px)",
      position:   "relative",
      overflow:   "hidden",
    }}>
      {/* Ambient glows — primary and secondary, low opacity */}
      <div style={{
        position: "absolute", top: "40%", left: "8%",
        width: 500, height: 500, borderRadius: "50%",
        background: C.primary, opacity: 0.07,
        filter: "blur(130px)", transform: "translateY(-50%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", top: "30%", right: "5%",
        width: 360, height: 360, borderRadius: "50%",
        background: C.secondary, opacity: 0.06,
        filter: "blur(110px)", pointerEvents: "none",
      }} />

      <div style={{ maxWidth: 1240, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <motion.h2
          initial={{ opacity: 0, y: 44 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: EASE_EXPO }}
          style={{
            fontFamily:    F.serif,
            fontSize:      "clamp(36px, 6.5vw, 88px)",
            fontWeight:    600,
            letterSpacing: "-0.025em",
            lineHeight:    1.08,
            color:         C.white,
            margin:        "0 0 clamp(56px, 8vh, 104px)",
            maxWidth:      "18ch",
          }}
        >
          Woven by hand.{" "}
          <em style={{ fontStyle: "italic", color: C.goldLight }}>
            Worn for generations.
          </em>
        </motion.h2>

        <div style={{
          display:             "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap:                 "clamp(40px, 5vw, 64px)",
          borderTop:           `1px solid rgba(255,255,255,0.09)`,
          paddingTop:          "clamp(40px, 6vh, 68px)",
        }}>
          {FABRIC_STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 32 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ ...SPRING_GENTLE, delay: i * 0.08 }}
            >
              <div style={{
                fontFamily:    F.serif,
                fontSize:      "clamp(44px, 5.5vw, 72px)",
                fontWeight:    600,
                letterSpacing: "-0.03em",
                color:         C.white,
                lineHeight:    1,
                marginBottom:  14,
              }}>
                {inView
                  ? <AnimatedCounter target={s.value} suffix={s.suffix} />
                  : `0${s.suffix}`}
              </div>
              <p style={{
                fontFamily: F.sans,
                fontSize:   "clamp(13px, 1.3vw, 15px)",
                fontWeight: 300,
                color:      "rgba(255,255,255,0.40)",
                lineHeight: 1.65,
                margin:     0,
                maxWidth:   "26ch",
              }}>{s.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   5. COLLECTION GRID
═══════════════════════════════════════════════════════════ */
const COLLECTION = [
  { id: 1, name: "Kanjivaram Crimson",  price: "₹24,500", image: "https://images.unsplash.com/photo-1583391733956-6c78276477e1?w=640&auto=format&fit=crop&q=80" },
  { id: 2, name: "Banarasi Ivory",      price: "₹18,200", image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=640&auto=format&fit=crop&q=80" },
  { id: 3, name: "Tant Bengal Night",   price: "₹8,900",  image: "https://images.unsplash.com/photo-1617019114583-affb34d1b3cd?w=640&auto=format&fit=crop&q=80" },
  { id: 4, name: "Paithani Sunrise",    price: "₹32,000", image: "https://images.unsplash.com/photo-1583744946564-b52ac1c389c8?w=640&auto=format&fit=crop&q=80" },
  { id: 5, name: "Chanderi Mist",       price: "₹12,400", image: "https://images.unsplash.com/photo-1583391733981-8f2f9b98b248?w=640&auto=format&fit=crop&q=80" },
  { id: 6, name: "Pochampally Indigo",  price: "₹9,800",  image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=640&auto=format&fit=crop&q=80&sat=-30" },
];

function CollectionCard({ product, index }) {
  const [hover, setHover] = useState(false);
  const [ref, inView]    = useInView(0.08);

  return (
    <motion.article
      ref={ref}
      initial={{ opacity: 0, y: 36 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ ...SPRING_GENTLE, delay: (index % 3) * 0.08 }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ cursor: "pointer" }}
    >
      <div style={{ overflow: "hidden", aspectRatio: "3/4", background: C.bone, marginBottom: "clamp(14px, 2vw, 20px)" }}>
        <motion.img
          src={product.image}
          alt={product.name}
          loading="lazy"
          animate={hover ? { scale: 1.06 } : { scale: 1 }}
          transition={SPRING_SNAPPY}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </div>
      <p style={{
        fontFamily:    F.sans,
        fontSize:      "clamp(13px, 1.3vw, 15px)",
        fontWeight:    500,
        color:         C.textPrimary,
        margin:        "0 0 6px",
        letterSpacing: "-0.01em",
      }}>{product.name}</p>
      <p style={{
        fontFamily: F.serif,
        fontSize:   "clamp(15px, 1.6vw, 19px)",
        fontWeight: 400,
        color:      C.textSecondary,
        margin:     0,
      }}>{product.price}</p>
    </motion.article>
  );
}

function CollectionGrid() {
  const [ref, inView] = useInView(0.1);
  return (
    <section style={{
      background: C.white,
      padding:    "clamp(80px, 12vh, 148px) clamp(24px, 6vw, 80px)",
    }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <div ref={ref} style={{ marginBottom: "clamp(48px, 7vh, 84px)" }}>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.48, ease: EASE_EXPO }}
            style={{
              fontFamily:    F.sans,
              fontSize:      "clamp(9px, 0.9vw, 11px)",
              fontWeight:    600,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color:         C.primary,
              margin:        "0 0 16px",
            }}
          >The Edit</motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 22 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.06, duration: 0.52, ease: EASE_EXPO }}
            style={{
              fontFamily:    F.serif,
              fontSize:      "clamp(36px, 5.5vw, 76px)",
              fontWeight:    600,
              letterSpacing: "-0.025em",
              lineHeight:    1,
              color:         C.textPrimary,
              margin:        0,
            }}
          >Current Collection</motion.h2>
        </div>

        <div className="collection-grid" style={{
          display:             "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap:                 "clamp(24px, 3.5vw, 52px)",
        }}>
          {COLLECTION.map((p, i) => (
            <CollectionCard key={p.id} product={p} index={i} />
          ))}
        </div>

        <style>{`
          @media (max-width: 768px)  { .collection-grid { grid-template-columns: repeat(2, 1fr) !important; } }
          @media (max-width: 480px)  { .collection-grid { grid-template-columns: 1fr !important; } }
        `}</style>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   6. FULL-BLEED QUOTE
═══════════════════════════════════════════════════════════ */
function QuoteSection() {
  const [ref, inView] = useInView(0.3);
  return (
    <section ref={ref} style={{
      background: C.cream,
      padding:    "clamp(88px, 14vh, 190px) clamp(24px, 10vw, 160px)",
      textAlign:  "center",
    }}>
      <motion.blockquote
        initial={{ opacity: 0, y: 36 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.72, ease: EASE_EXPO }}
        style={{
          fontFamily:    F.serif,
          fontSize:      "clamp(28px, 5.5vw, 72px)",
          fontWeight:    400,
          fontStyle:     "italic",
          letterSpacing: "-0.02em",
          lineHeight:    1.16,
          color:         C.textPrimary,
          maxWidth:      "22ch",
          margin:        "0 auto",
        }}
      >
        "A saree is not worn.
        <br />It is inherited."
      </motion.blockquote>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   7. FOOTER
═══════════════════════════════════════════════════════════ */
const FOOTER_COLS = [
  { title: "Shop",     links: ["Silk Sarees", "Cotton Sarees", "Bridal Collection", "New Arrivals", "Sale"] },
  { title: "Heritage", links: ["Our Story", "The Weavers", "Craftsmanship", "Sustainability"] },
  { title: "Support",  links: ["Shipping & Returns", "Size Guide", "Care Instructions", "Contact Us"] },
  { title: "Account",  links: ["Sign In", "Create Account", "Wishlist", "Orders"] },
];

function FooterSection() {
  return (
    <footer style={{
      background: C.textPrimary,
      padding:    "clamp(64px, 9vh, 108px) clamp(24px, 6vw, 80px) clamp(32px, 4vh, 52px)",
    }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        {/* Main grid */}
        <div
          className="footer-cols"
          style={{
            display:             "grid",
            gridTemplateColumns: "2fr repeat(4, 1fr)",
            gap:                 "clamp(32px, 4vw, 68px)",
            paddingBottom:       "clamp(48px, 6vh, 72px)",
            borderBottom:        "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {/* Brand column */}
          <div>
            <h3 style={{
              fontFamily:    F.serif,
              fontSize:      "clamp(22px, 2.5vw, 34px)",
              fontWeight:    600,
              letterSpacing: "-0.02em",
              color:         C.white,
              margin:        "0 0 16px",
            }}>Krittika Style</h3>
            <p style={{
              fontFamily: F.sans,
              fontSize:   "clamp(12px, 1.1vw, 13px)",
              fontWeight: 300,
              color:      "rgba(255,255,255,0.38)",
              lineHeight: 1.72,
              maxWidth:   "28ch",
              margin:     "0 0 28px",
            }}>
              A curated house of Indian handwoven sarees — sourced directly from
              weavers across Bengal, Varanasi, and Kanchipuram.
            </p>
            <OutlineBtn dark>Shop Now</OutlineBtn>
          </div>

          {/* Link columns */}
          {FOOTER_COLS.map((col) => (
            <div key={col.title}>
              <p style={{
                fontFamily:    F.sans,
                fontSize:      "clamp(9px, 0.85vw, 10px)",
                fontWeight:    600,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color:         "rgba(255,255,255,0.30)",
                margin:        "0 0 22px",
              }}>{col.title}</p>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 13 }}>
                {col.links.map((link) => (
                  <li key={link}>
                    <SweepLink color="rgba(255,255,255,0.38)" hoverColor="rgba(255,255,255,0.82)" style={{
                      fontFamily: F.sans,
                      fontSize:   "clamp(12px, 1.1vw, 13px)",
                      fontWeight: 300,
                    }}>{link}</SweepLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div style={{
          paddingTop:     "clamp(22px, 3vh, 36px)",
          display:        "flex",
          justifyContent: "space-between",
          alignItems:     "center",
          flexWrap:       "wrap",
          gap:            16,
        }}>
          <p style={{
            fontFamily: F.sans,
            fontSize:   "clamp(10px, 1vw, 12px)",
            color:      "rgba(255,255,255,0.22)",
            margin:     0,
          }}>
            © {new Date().getFullYear()} Krittika Style. All rights reserved.
          </p>
          <div style={{ display: "flex", gap: "clamp(16px, 2.5vw, 28px)", flexWrap: "wrap" }}>
            {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((t) => (
              <SweepLink key={t} color="rgba(255,255,255,0.22)" hoverColor="rgba(255,255,255,0.55)" style={{
                fontFamily: F.sans,
                fontSize:   "clamp(10px, 1vw, 11px)",
                fontWeight: 300,
              }}>{t}</SweepLink>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1100px) { .footer-cols { grid-template-columns: 1fr 1fr 1fr !important; } }
        @media (max-width: 768px)  { .footer-cols { grid-template-columns: 1fr 1fr !important; } }
        @media (max-width: 480px)  { .footer-cols { grid-template-columns: 1fr !important; } }
      `}</style>
    </footer>
  );
}

/* ═══════════════════════════════════════════════════════════
   ROOT EXPORT
═══════════════════════════════════════════════════════════ */
export default function LandingPage() {
  return (
    <AnimatePresence>
      <SEOHead
        title="Handwoven Indian Sarees"
        description="Discover Krittika Style — handwoven Banarasi silk, Kanjivaram, Handloom sarees crafted by master artisans. Shop with free delivery across India."
        canonical="https://www.krittikasarees.com/landing"
      />
      <div style={{
        background: C.white,
        color:      C.textPrimary,
        overflowX:  "hidden",
        WebkitFontSmoothing: "antialiased",
      }}>
        <Hero />
        <FeatureStrip />
        <ProductShowcase />
        <FabricSection />
        <CollectionGrid />
        <QuoteSection />
        <FooterSection />
      </div>
    </AnimatePresence>
  );
}
