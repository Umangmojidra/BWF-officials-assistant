import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gavel, BookOpen, Mic, Send, Plus, ChevronLeft, ChevronRight,
  Zap, Shield, AlertTriangle, MessageSquare, FileText,
  Users, LayoutGrid, Clock, Wifi, Paperclip, Volume2,
  Scale, Megaphone, BookMarked, HelpCircle, Activity
} from "lucide-react";

// ─── FONT INJECTION ───────────────────────────────────────────────────────────
const fontLink = document.createElement("link");
fontLink.href = "https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=DM+Mono:ital,wght@0,300;0,400;1,300&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap";
fontLink.rel = "stylesheet";
document.head.appendChild(fontLink);

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const SECTION_CONFIG = [
  { tag: "ruling",            label: "Ruling",            icon: Scale,      color: "cyan"   },
  { tag: "umpire_call",       label: "Umpire Call",       icon: Megaphone,  color: "blue"   },
  { tag: "rule_reference",    label: "Rule Reference",    icon: BookMarked, color: "indigo" },
  { tag: "explanation",       label: "Explanation",       icon: FileText,   color: "slate"  },
  { tag: "player_management", label: "Player Management", icon: Users,      color: "violet" },
  { tag: "edge_case",         label: "Edge Case",         icon: HelpCircle, color: "amber"  },
];

const COLOR_MAP = {
  cyan:   { border: "#22d3ee28", bg: "rgba(8,28,40,0.7)",    head: "#67e8f9", dot: "#22d3ee", text: "#cffafe", headBg: "rgba(34,211,238,0.08)", accent: "#22d3ee" },
  blue:   { border: "#3b82f628", bg: "rgba(8,15,40,0.7)",    head: "#93c5fd", dot: "#3b82f6", text: "#dbeafe", headBg: "rgba(59,130,246,0.08)", accent: "#3b82f6" },
  indigo: { border: "#818cf828", bg: "rgba(12,8,40,0.7)",    head: "#a5b4fc", dot: "#818cf8", text: "#e0e7ff", headBg: "rgba(129,140,248,0.08)", accent: "#818cf8" },
  slate:  { border: "#64748b28", bg: "rgba(8,12,20,0.7)",    head: "#94a3b8", dot: "#64748b", text: "#e2e8f0", headBg: "rgba(100,116,139,0.08)", accent: "#94a3b8" },
  violet: { border: "#a78bfa28", bg: "rgba(18,8,40,0.7)",    head: "#c4b5fd", dot: "#a78bfa", text: "#ede9fe", headBg: "rgba(167,139,250,0.08)", accent: "#a78bfa" },
  amber:  { border: "#f59e0b28", bg: "rgba(30,18,4,0.7)",    head: "#fcd34d", dot: "#f59e0b", text: "#fef3c7", headBg: "rgba(245,158,11,0.08)", accent: "#f59e0b" },
};

const EXAMPLE_QUERIES = [
  "Player touches the net mid-rally — fault?",
  "Shuttle hits ceiling during play",
  "Double hit on a return shot",
  "Service fault conditions in doubles",
  "Player clothing color regulations",
  "What is deliberate delay in service?",
];

// ─── XML PARSER ───────────────────────────────────────────────────────────────
function parseRuling(text) {
  const sections = [];
  for (const cfg of SECTION_CONFIG) {
    const rx = new RegExp(`<${cfg.tag}>[\\s\\S]*?<\\/${cfg.tag}>`, "i");
    const m = text.match(rx);
    if (m) {
      const content = m[0].replace(new RegExp(`</?${cfg.tag}>`, "gi"), "").trim();
      if (content) sections.push({ ...cfg, content });
    }
  }
  if (!sections.length) {
    sections.push({ tag: "explanation", label: "Response", icon: FileText, color: "slate", content: text });
  }
  return sections;
}

// ─── GRID BACKGROUND ──────────────────────────────────────────────────────────
function GridBackground() {
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
      {/* Dot grid */}
      <svg width="100%" height="100%" style={{ opacity: 0.12 }} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="dots" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.8" fill="#3b82f6"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dots)"/>
      </svg>
      {/* Corner glow top-right */}
      <div style={{
        position: "absolute", top: -120, right: -120,
        width: 480, height: 480,
        background: "radial-gradient(ellipse, rgba(59,130,246,0.12) 0%, transparent 70%)",
      }}/>
      {/* Corner glow bottom-left */}
      <div style={{
        position: "absolute", bottom: -100, left: -100,
        width: 380, height: 380,
        background: "radial-gradient(ellipse, rgba(34,211,238,0.07) 0%, transparent 70%)",
      }}/>
      {/* Scanline overlay */}
      <div style={{
        position: "absolute", inset: 0,
        background: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.04) 3px, rgba(0,0,0,0.04) 4px)",
        pointerEvents: "none"
      }}/>
    </div>
  );
}

// ─── TYPING INDICATOR ─────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "4px 0" }}
    >
      <div style={{
        width: 34, height: 34, borderRadius: 8, flexShrink: 0,
        background: "linear-gradient(135deg,#0a1628,#0c2d55)",
        border: "1px solid rgba(59,130,246,0.35)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Scale size={16} color="#3b82f6" strokeWidth={1.5}/>
      </div>
      <div style={{
        background: "rgba(8,15,35,0.8)", border: "1px solid rgba(59,130,246,0.2)",
        borderRadius: "4px 12px 12px 12px", padding: "14px 18px",
        backdropFilter: "blur(16px)", display: "flex", gap: 6, alignItems: "center"
      }}>
        {[0, 0.2, 0.4].map((delay, i) => (
          <motion.div key={i}
            animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 0.9, repeat: Infinity, delay, ease: "easeInOut" }}
            style={{ width: 5, height: 5, borderRadius: "50%", background: "#3b82f6" }}
          />
        ))}
        <span style={{ fontSize: 11, color: "rgba(147,197,253,0.5)", marginLeft: 6, letterSpacing: "1.5px", fontFamily: "'DM Mono',monospace" }}>PROCESSING</span>
      </div>
    </motion.div>
  );
}

// ─── RULING SECTION CARD ──────────────────────────────────────────────────────
function RulingSection({ section, index }) {
  const c = COLOR_MAP[section.color] || COLOR_MAP.slate;
  const Icon = section.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, x: -4 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      transition={{ delay: index * 0.09, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      style={{
        borderRadius: 8, overflow: "hidden",
        border: `1px solid ${c.border}`,
        background: c.bg,
        marginBottom: 8,
        boxShadow: `0 0 0 0 ${c.accent}`,
        position: "relative",
      }}
    >
      {/* Left accent bar */}
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0,
        width: 3, background: `linear-gradient(180deg, ${c.accent}cc, ${c.accent}22)`,
        borderRadius: "8px 0 0 8px"
      }}/>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "8px 14px 8px 18px", background: c.headBg,
        borderBottom: `1px solid ${c.border}`
      }}>
        <Icon size={11} color={c.head} strokeWidth={2}/>
        <span style={{
          fontSize: 9.5, letterSpacing: "2.8px", textTransform: "uppercase",
          fontWeight: 600, color: c.head, fontFamily: "'Rajdhani',sans-serif"
        }}>{section.label}</span>
        <div style={{ marginLeft: "auto", width: 5, height: 5, borderRadius: "50%", background: c.dot, opacity: 0.7 }}/>
      </div>
      {/* Content */}
      <div
        style={{
          padding: "12px 14px 14px 18px",
          fontSize: 13.5, lineHeight: 1.82, fontWeight: 300,
          color: c.text, fontFamily: "'DM Sans',sans-serif",
          letterSpacing: "0.01em"
        }}
        dangerouslySetInnerHTML={{ __html: section.content }}
      />
    </motion.div>
  );
}

// ─── AI MESSAGE ───────────────────────────────────────────────────────────────
function AiMessage({ message }) {
  const sections = parseRuling(message.ruling);
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "4px 0", maxWidth: "90%" }}
    >
      {/* Avatar */}
      <div style={{
        width: 34, height: 34, borderRadius: 8, flexShrink: 0,
        background: "linear-gradient(135deg,#0a1628,#0c2d55)",
        border: "1px solid rgba(59,130,246,0.35)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Scale size={16} color="#60a5fa" strokeWidth={1.5}/>
      </div>

      <div style={{ flex: 1 }}>
        <div style={{
          background: "rgba(8,14,32,0.75)",
          border: "1px solid rgba(59,130,246,0.16)",
          borderRadius: "4px 14px 14px 14px",
          backdropFilter: "blur(20px)",
          overflow: "hidden"
        }}>
          {/* Message header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "10px 16px",
            background: "rgba(59,130,246,0.06)",
            borderBottom: "1px solid rgba(59,130,246,0.12)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#22d3ee", boxShadow: "0 0 6px #22d3ee" }}/>
              </div>
              <span style={{
                fontFamily: "'Rajdhani',sans-serif", fontSize: 13,
                letterSpacing: "3px", color: "#93c5fd", fontWeight: 600
              }}>OFFICIAL RULING</span>
            </div>
            <span style={{
              fontSize: 10, color: "rgba(148,163,184,0.45)",
              letterSpacing: "1px", fontFamily: "'DM Mono',monospace"
            }}>{message.time}</span>
          </div>

          {/* Query echo */}
          <div style={{
            margin: "12px 16px 10px",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 6,
            padding: "8px 12px",
            fontSize: 11.5, color: "rgba(148,163,184,0.5)",
            fontStyle: "italic", fontFamily: "'DM Sans',sans-serif",
            lineHeight: 1.55,
            display: "flex", alignItems: "flex-start", gap: 8
          }}>
            <MessageSquare size={12} color="rgba(148,163,184,0.3)" style={{ marginTop: 2, flexShrink: 0 }}/>
            {message.query}
          </div>

          {/* Section cards */}
          <div style={{ padding: "4px 12px 12px" }}>
            {sections.map((s, i) => <RulingSection key={s.tag} section={s} index={i}/>)}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── USER MESSAGE ─────────────────────────────────────────────────────────────
function UserMessage({ message }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      style={{ display: "flex", justifyContent: "flex-end", padding: "4px 0" }}
    >
      <div style={{
        background: "rgba(30,58,138,0.35)",
        border: "1px solid rgba(59,130,246,0.28)",
        borderRadius: "14px 4px 14px 14px",
        padding: "11px 16px",
        maxWidth: "70%",
        backdropFilter: "blur(12px)"
      }}>
        <p style={{
          fontSize: 13.5, fontWeight: 400, lineHeight: 1.65,
          color: "#dbeafe", fontFamily: "'DM Sans',sans-serif", margin: 0
        }}>{message.text}</p>
        <p style={{
          fontSize: 10, color: "rgba(148,163,184,0.35)", margin: "6px 0 0",
          textAlign: "right", letterSpacing: "0.5px", fontFamily: "'DM Mono',monospace"
        }}>{message.time}</p>
      </div>
    </motion.div>
  );
}

// ─── WELCOME SCREEN ───────────────────────────────────────────────────────────
function WelcomeScreen({ onExample }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      style={{ textAlign: "center", padding: "56px 24px 40px", maxWidth: 640, margin: "0 auto" }}
    >
      {/* Icon */}
      <div style={{
        width: 68, height: 68, borderRadius: 16, margin: "0 auto 24px",
        background: "linear-gradient(135deg,#0a1628,#0c2d55)",
        border: "1px solid rgba(59,130,246,0.35)",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 0 32px rgba(59,130,246,0.15)"
      }}>
        <Scale size={28} color="#60a5fa" strokeWidth={1.5}/>
      </div>

      {/* Badge */}
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 7,
        fontSize: 9.5, letterSpacing: "3px", textTransform: "uppercase",
        color: "#67e8f9", marginBottom: 18,
        padding: "5px 16px",
        border: "1px solid rgba(34,211,238,0.2)",
        borderRadius: 100,
        background: "rgba(34,211,238,0.05)",
        fontFamily: "'DM Mono',monospace"
      }}>
        <Activity size={9}/> BWF · Claude AI · Live System
      </div>

      {/* Title */}
      <h1 style={{
        fontFamily: "'Rajdhani',sans-serif",
        fontSize: "clamp(52px,10vw,78px)", letterSpacing: 5,
        lineHeight: 0.92, marginBottom: 18, fontWeight: 700,
        color: "#f1f5f9"
      }}>
        BWF<br/><span style={{ color: "#3b82f6" }}>RULING</span><br/>ENGINE
      </h1>

      {/* Subtitle */}
      <p style={{
        fontSize: 13.5, color: "rgba(148,163,184,0.65)", fontWeight: 300,
        lineHeight: 1.8, maxWidth: 440, margin: "0 auto 36px",
        fontFamily: "'DM Sans',sans-serif"
      }}>
        Your AI-powered officiating assistant. Describe any match situation and receive an authoritative ruling grounded in official BWF Laws.
      </p>

      {/* Example chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
        {EXAMPLE_QUERIES.map((q) => (
          <motion.button
            key={q} whileHover={{ scale: 1.03, borderColor: "rgba(59,130,246,0.45)" }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onExample(q)}
            style={{
              background: "rgba(59,130,246,0.06)",
              border: "1px solid rgba(59,130,246,0.2)",
              borderRadius: 100, padding: "7px 16px",
              fontSize: 12, color: "rgba(147,197,253,0.75)",
              cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontWeight: 300,
              transition: "all 0.2s ease"
            }}
          >{q}</motion.button>
        ))}
      </div>
    </motion.div>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
function Sidebar({ open, history, onHistoryClick, onNew }) {
  return (
    <motion.aside
      initial={false}
      animate={{ width: open ? 255 : 0, opacity: open ? 1 : 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      style={{
        height: "100vh", flexShrink: 0, overflow: "hidden",
        background: "rgba(4,8,20,0.95)",
        borderRight: "1px solid rgba(59,130,246,0.1)",
        backdropFilter: "blur(24px)",
        display: "flex", flexDirection: "column",
        position: "relative", zIndex: 10
      }}
    >
      <div style={{ width: 255, height: "100%", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid rgba(59,130,246,0.1)" }}>
          <div style={{
            fontFamily: "'Rajdhani',sans-serif", fontSize: 17,
            letterSpacing: "4px", color: "#dbeafe", marginBottom: 14, fontWeight: 700
          }}>AI ASSISTANT</div>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={onNew}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 8,
              background: "rgba(59,130,246,0.12)",
              border: "1px solid rgba(59,130,246,0.28)",
              borderRadius: 9, padding: "9px 14px",
              color: "#93c5fd",
              cursor: "pointer", fontSize: 12.5,
              fontFamily: "'DM Sans',sans-serif", fontWeight: 400,
              letterSpacing: "0.3px"
            }}
          >
            <Plus size={14}/> New Conversation
          </motion.button>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div style={{ padding: "12px 8px", flex: 1, overflowY: "auto" }}>
            <p style={{
              fontSize: 9, letterSpacing: "2.5px", textTransform: "uppercase",
              color: "rgba(148,163,184,0.3)", padding: "4px 8px 10px",
              fontFamily: "'DM Mono',monospace"
            }}>Recent</p>
            {history.slice(0, 14).map((q, i) => (
              <div key={i} onClick={() => onHistoryClick(q)}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 8,
                  padding: "8px 10px", borderRadius: 8, marginBottom: 2,
                  cursor: "pointer", border: "1px solid transparent",
                  transition: "all 0.18s ease"
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = "rgba(59,130,246,0.07)";
                  e.currentTarget.style.borderColor = "rgba(59,130,246,0.15)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.borderColor = "transparent";
                }}
              >
                <Clock size={10} color="rgba(148,163,184,0.25)" style={{ marginTop: 3, flexShrink: 0 }} strokeWidth={1.5}/>
                <span style={{
                  fontSize: 11.5, fontFamily: "'DM Sans',sans-serif", fontWeight: 300,
                  color: "rgba(148,163,184,0.5)", lineHeight: 1.45,
                  overflow: "hidden", textOverflow: "ellipsis",
                  display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical"
                }}>{q}</span>
              </div>
            ))}
          </div>
        )}

        {history.length === 0 && <div style={{ flex: 1 }}/>}

        {/* Footer status */}
        <div style={{
          padding: "12px 16px", borderTop: "1px solid rgba(59,130,246,0.1)",
          display: "flex", alignItems: "center", justifyContent: "space-between"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 7, height: 7, borderRadius: "50%", background: "#3b82f6",
              boxShadow: "0 0 8px #3b82f6", animation: "blink 2.5s ease-in-out infinite"
            }}/>
            <span style={{
              fontSize: 9.5, letterSpacing: "1.5px", textTransform: "uppercase",
              color: "rgba(148,163,184,0.3)", fontFamily: "'DM Mono',monospace"
            }}>Online</span>
          </div>
          <span style={{
            fontSize: 9, color: "rgba(148,163,184,0.2)", fontFamily: "'DM Mono',monospace",
            letterSpacing: "0.5px"
          }}>v2.0</span>
        </div>
      </div>
    </motion.aside>
  );
}

// ─── INPUT DOCK ───────────────────────────────────────────────────────────────
function InputDock({ onSend, loading, defaultValue, onDefaultConsumed }) {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const taRef = useRef(null);

  useEffect(() => {
    if (defaultValue) {
      setValue(defaultValue);
      onDefaultConsumed();
      taRef.current?.focus();
    }
  }, [defaultValue]);

  const handleSend = () => {
    const q = value.trim();
    if (!q || loading) return;
    onSend(q);
    setValue("");
    if (taRef.current) taRef.current.style.height = "auto";
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const autoResize = () => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 140) + "px";
  };

  const canSend = value.trim() && !loading;

  return (
    <div style={{
      padding: "14px 20px 18px",
      background: "rgba(4,8,20,0.88)",
      borderTop: "1px solid rgba(59,130,246,0.1)",
      backdropFilter: "blur(20px)"
    }}>
      <motion.div
        animate={{
          boxShadow: focused
            ? "0 0 0 1.5px rgba(59,130,246,0.45), 0 0 40px rgba(59,130,246,0.1)"
            : "0 0 0 1px rgba(59,130,246,0.15)"
        }}
        transition={{ duration: 0.22 }}
        style={{
          background: "rgba(8,15,35,0.7)",
          border: "1px solid rgba(59,130,246,0.2)",
          borderRadius: 14, padding: "11px 13px",
          backdropFilter: "blur(20px)",
          display: "flex", alignItems: "flex-end", gap: 10,
          maxWidth: 820, margin: "0 auto"
        }}
      >
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          style={{
            background: "transparent", border: "none", cursor: "pointer",
            color: "rgba(148,163,184,0.3)", padding: 6, flexShrink: 0,
            display: "flex", alignItems: "center", marginBottom: 1
          }}
        ><Paperclip size={16} strokeWidth={1.5}/></motion.button>

        <textarea
          ref={taRef} value={value}
          onChange={e => { setValue(e.target.value); autoResize(); }}
          onKeyDown={handleKey}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Describe the match situation... (Enter to send, Shift+Enter for new line)"
          rows={1} maxLength={600}
          style={{
            flex: 1, background: "transparent", border: "none", outline: "none",
            color: "#e2e8f0", fontFamily: "'DM Sans',sans-serif",
            fontSize: 13.5, fontWeight: 300, lineHeight: 1.65,
            resize: "none", minHeight: 24, maxHeight: 140,
            caretColor: "#3b82f6", overflowY: "auto", scrollbarWidth: "none"
          }}
        />

        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          style={{
            background: "transparent", border: "none", cursor: "pointer",
            color: "rgba(148,163,184,0.3)", padding: 6, flexShrink: 0,
            display: "flex", alignItems: "center", marginBottom: 1
          }}
        ><Mic size={16} strokeWidth={1.5}/></motion.button>

        <motion.button
          whileHover={{ scale: canSend ? 1.05 : 1 }}
          whileTap={{ scale: canSend ? 0.95 : 1 }}
          onClick={handleSend} disabled={!canSend}
          style={{
            background: canSend ? "rgba(59,130,246,0.85)" : "rgba(59,130,246,0.12)",
            border: `1px solid ${canSend ? "rgba(59,130,246,0.7)" : "rgba(59,130,246,0.15)"}`,
            borderRadius: 9, width: 36, height: 36, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: canSend ? "pointer" : "not-allowed",
            transition: "all 0.2s ease",
            boxShadow: canSend ? "0 0 16px rgba(59,130,246,0.3)" : "none"
          }}
        >
          <Send size={14} color={canSend ? "#fff" : "rgba(148,163,184,0.25)"} strokeWidth={2}/>
        </motion.button>
      </motion.div>

      <p style={{
        textAlign: "center", fontSize: 9.5, color: "rgba(148,163,184,0.18)",
        marginTop: 10, fontFamily: "'DM Mono',monospace", letterSpacing: "0.8px"
      }}>
        BWF RULING ENGINE · CLAUDE AI · OFFICIAL USE ONLY
      </p>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function BwfAssistant() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inputDefault, setInputDefault] = useState("");
  const [queryHistory, setQueryHistory] = useState([]);
  const bottomRef = useRef(null);

  const now = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, []);

  const handleSend = useCallback(async (query) => {
    setMessages(prev => [...prev, { type: "user", text: query, time: now() }]);
    setQueryHistory(prev => [query, ...prev.filter(q => q !== query)]);
    setLoading(true);

    try {
      const res = await fetch("/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMessages(prev => [...prev, { type: "ai", ruling: data.ruling, query, time: now() }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        type: "ai",
        ruling: `<explanation>⚠ ${err.message || "Connection failed. Please check your Flask server is running on port 5000."}</explanation>`,
        query, time: now()
      }]);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div style={{
      display: "flex", height: "100vh", overflow: "hidden",
      background: "#030810", fontFamily: "'DM Sans',sans-serif", position: "relative"
    }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(59,130,246,0.25); border-radius: 2px; }
        textarea::-webkit-scrollbar { display: none; }
        @keyframes blink {
          0%,100%{opacity:1;box-shadow:0 0 8px #3b82f6}
          50%{opacity:.5;box-shadow:0 0 18px #60a5fa}
        }
      `}</style>

      <GridBackground/>

      <Sidebar
        open={sidebarOpen}
        history={queryHistory}
        onHistoryClick={(q) => setInputDefault(q)}
        onNew={() => setMessages([])}
      />

      {/* Main column */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative", zIndex: 1 }}>

        {/* Topbar */}
        <div style={{
          display: "flex", alignItems: "center", gap: 14,
          padding: "13px 20px",
          borderBottom: "1px solid rgba(59,130,246,0.1)",
          background: "rgba(3,8,16,0.75)",
          backdropFilter: "blur(16px)", flexShrink: 0
        }}>
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => setSidebarOpen(p => !p)}
            style={{
              background: "rgba(59,130,246,0.08)",
              border: "1px solid rgba(59,130,246,0.2)",
              borderRadius: 8, width: 34, height: 34,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "#60a5fa", flexShrink: 0
            }}
          >
            {sidebarOpen ? <ChevronLeft size={15} strokeWidth={2}/> : <ChevronRight size={15} strokeWidth={2}/>}
          </motion.button>

          <div>
            <div style={{
              fontFamily: "'Rajdhani',sans-serif", fontSize: 16,
              letterSpacing: "3.5px", color: "#f1f5f9", lineHeight: 1, fontWeight: 700
            }}>UMPIRE TECHNICAL ASSISTANT </div>
            <div style={{
              fontSize: 9.5, letterSpacing: "2px", textTransform: "uppercase",
              color: "rgba(96,165,250,0.7)", fontWeight: 400, marginTop: 2,
              fontFamily: "'DM Mono',monospace"
            }}>For GBA Officials </div>
          </div>

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
            <Wifi size={12} color="rgba(59,130,246,0.7)" strokeWidth={2}/>
            <span style={{
              fontSize: 9.5, letterSpacing: "1.5px", textTransform: "uppercase",
              color: "rgba(148,163,184,0.35)", fontFamily: "'DM Mono',monospace"
            }}>Live</span>
          </div>
        </div>

        {/* Chat stream */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
          <div style={{ maxWidth: 820, margin: "0 auto" }}>
            <AnimatePresence>
              {messages.length === 0 && !loading && (
                <WelcomeScreen key="welcome" onExample={(q) => setInputDefault(q)}/>
              )}
            </AnimatePresence>

            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {messages.map((msg, i) =>
                msg.type === "user"
                  ? <UserMessage key={i} message={msg}/>
                  : <AiMessage key={i} message={msg}/>
              )}
              <AnimatePresence>
                {loading && <TypingIndicator key="typing"/>}
              </AnimatePresence>
            </div>
            <div ref={bottomRef}/>
          </div>
        </div>

        <InputDock
          onSend={handleSend}
          loading={loading}
          defaultValue={inputDefault}
          onDefaultConsumed={() => setInputDefault("")}
        />
      </div>
    </div>
  );
}