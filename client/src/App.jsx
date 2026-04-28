import { useState, useEffect } from "react"
import axios from "axios"

const API = import.meta.env.VITE_API_URL || "http://localhost:8000"

const themes = {
  midnight: {
    bg: "#0F0E17",
    surface: "#1A1928",
    border: "#2A2840",
    accent: "#4DFFC4",
    accentText: "#0F0E17",
    text: "#C9C7D4",
    textStrong: "#4DFFC4",
    subtext: "#8E8BA0",
    inputBg: "#0F0E17",
    leftBg: "#0F0E17",
    fontTitle: "'Playfair Display', serif",
    textureColor: "#ffffff",
    textureOpacity: 0.04,
  },
  parchment: {
    bg: "#FDF8F2",
    surface: "#FFF8F0",
    border: "#E8DDD0",
    accent: "#A0522D",
    accentText: "#fff",
    text: "#3D2B1F",
    textStrong: "#A0522D",
    subtext: "#7A5C48",
    inputBg: "#fff",
    leftBg: "#FFFBF7",
    fontTitle: "'DM Serif Display', serif",
    textureColor: "#3D2B1F",
    textureOpacity: 0.08,
  },
  lavender: {
    bg: "#F4F1F8",
    surface: "#fff",
    border: "#DDD6EA",
    accent: "#5A4A8A",
    accentText: "#fff",
    text: "#3B2F5E",
    textStrong: "#5A4A8A",
    subtext: "#6B5E8A",
    inputBg: "#fff",
    leftBg: "#FAF8FD",
    fontTitle: "'Playfair Display', serif",
    textureColor: "#3B2F5E",
    textureOpacity: 0.07,
  }
}

const focusStyle = (color) => ({
  outline: `2px solid ${color}`,
  outlineOffset: "2px",
})

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem("je-theme") || "midnight")
  const [question, setQuestion] = useState("")
  const [passages, setPassages] = useState([])
  const [messages, setMessages] = useState([])
  const [conversation, setConversation] = useState([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [started, setStarted] = useState(false)
  const [activeTab, setActiveTab] = useState("chat")
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640)

  const t = themes[theme]

  useEffect(() => {
    localStorage.setItem("je-theme", theme)
    document.body.style.background = themes[theme].bg
  }, [theme])

  useEffect(() => {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    if (!localStorage.getItem("je-theme")) {
      setTheme(prefersDark ? "midnight" : "lavender")
    }
  }, [])

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640)
    window.addEventListener("resize", handler)
    return () => window.removeEventListener("resize", handler)
  }, [])

  async function handleStart() {
    if (!question.trim()) return
    setLoading(true)
    try {
      const res = await axios.post(`${API}/start`, { question })
      setPassages(res.data.passages)
      setMessages(res.data.messages)
      setConversation([{ role: "tutor", text: res.data.tutor_message }])
      setStarted(true)
      setActiveTab("chat")
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  async function handleChat() {
    if (!input.trim()) return
    const studentMessage = input
    setInput("")
    setConversation(prev => [...prev, { role: "student", text: studentMessage }])
    setLoading(true)
    try {
      const res = await axios.post(`${API}/chat`, {
        student_message: studentMessage,
        messages
      })
      setMessages(res.data.messages)
      setConversation(prev => [...prev, { role: "tutor", text: res.data.tutor_message }])
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  function handleReset() {
    setQuestion("")
    setPassages([])
    setMessages([])
    setConversation([])
    setInput("")
    setStarted(false)
  }

  const swatchColors = {
    midnight: { outer: "#4DFFC4", inner: "#0F0E17" },
    parchment: { outer: "#A0522D", inner: "#FDF8F2" },
    lavender: { outer: "#5A4A8A", inner: "#F4F1F8" },
  }

  const Bird = () => (
    <svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <path d="M4 22 Q10 18 16 20 Q20 21 24 19" fill="none" stroke={t.border} strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M16 20 L15 24" fill="none" stroke={t.border} strokeWidth="1" strokeLinecap="round"/>
      <path d="M20 19 L19 23" fill="none" stroke={t.border} strokeWidth="1" strokeLinecap="round"/>
      <ellipse cx="14" cy="13" rx="5" ry="3.5" fill={t.bg} stroke={t.accent} strokeWidth="0.7"/>
      <circle cx="19" cy="11" r="3" fill={t.bg} stroke={t.accent} strokeWidth="0.7"/>
      <circle cx="20.5" cy="10.5" r="0.8" fill={t.accent}/>
      <path d="M22 11 L25 10.5 L22 12" fill={t.accent} opacity="0.8"/>
      <path d="M11 12 Q14 10 17 12" fill="none" stroke={t.accent} strokeWidth="0.5" opacity="0.6"/>
      <path d="M10 13.5 Q13 11.5 16 13.5" fill="none" stroke={t.accent} strokeWidth="0.5" opacity="0.4"/>
      <path d="M9 13 Q6 11 5 14 Q6 16 9 14.5" fill={t.bg} stroke={t.accent} strokeWidth="0.6"/>
      <path d="M13 16.5 L12 19 M13 16.5 L14 19 M13 16.5 L11.5 19.5" fill="none" stroke={t.accent} strokeWidth="0.5" opacity="0.7"/>
    </svg>
  )

  const Texture = () => (
    <svg aria-hidden="true" focusable="false" style={{ position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0, opacity: t.textureOpacity }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="damask" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M20 2 C24 8 32 8 32 14 C32 20 26 22 20 28 C14 22 8 20 8 14 C8 8 16 8 20 2Z" fill="none" stroke={t.textureColor} strokeWidth="0.5"/>
          <circle cx="20" cy="20" r="2" fill="none" stroke={t.textureColor} strokeWidth="0.5"/>
          <path d="M0 20 Q10 16 20 20 Q30 24 40 20" fill="none" stroke={t.textureColor} strokeWidth="0.3"/>
          <path d="M20 0 Q16 10 20 20 Q24 30 20 40" fill="none" stroke={t.textureColor} strokeWidth="0.3"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#damask)"/>
    </svg>
  )

  const passagesPanel = (
    <div role="region" aria-label="Retrieved passages" style={{ overflowY: "auto", padding: 16, background: t.leftBg, flex: 1 }}>
      <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: t.subtext, margin: "0 0 12px" }}>
        Retrieved Passages
      </p>
      {passages.map((p, i) => (
        <article key={i} style={{ background: t.surface, border: `0.5px solid ${t.border}`, borderLeft: `3px solid ${t.accent}`, borderRadius: 10, padding: "12px 14px", marginBottom: 10 }}>
          <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color: t.textStrong, margin: "0 0 6px" }}>
            Passage {i + 1} · {p.chapter}
          </p>
          <p style={{ fontSize: 13, lineHeight: 1.65, color: t.text, margin: 0 }}>
            {p.text}
          </p>
        </article>
      ))}
    </div>
  )

  const chatPanel = (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: t.bg, overflow: "hidden" }}>
      <div role="log" aria-live="polite" aria-label="Conversation" style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        {conversation.map((msg, i) => (
          <div key={i} style={{ display: "flex", justifyContent: msg.role === "student" ? "flex-end" : "flex-start" }}>
            <div
              aria-label={msg.role === "tutor" ? "Tutor" : "You"}
              style={{
                maxWidth: msg.role === "student" ? "80%" : "88%",
                background: msg.role === "student" ? t.accent : t.surface,
                border: msg.role === "student" ? "none" : `0.5px solid ${t.border}`,
                borderRadius: msg.role === "student" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                padding: "12px 14px"
              }}>
              {msg.role === "tutor" && (
                <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color: t.textStrong, margin: "0 0 5px" }}>
                  Tutor
                </p>
              )}
              <p style={{ fontSize: 13, lineHeight: 1.6, color: msg.role === "student" ? t.accentText : t.text, fontWeight: msg.role === "student" ? 500 : 400, margin: 0 }}>
                {msg.text}
              </p>
            </div>
          </div>
        ))}
        {loading && (
          <div aria-live="polite" style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{ background: t.surface, border: `0.5px solid ${t.border}`, borderRadius: "12px 12px 12px 2px", padding: "12px 14px", fontSize: 13, color: t.subtext }}>
              Thinking...
            </div>
          </div>
        )}
      </div>

      <div style={{ borderTop: `0.5px solid ${t.border}`, padding: "12px 14px", display: "flex", gap: 8, background: t.leftBg }}>
        <label htmlFor="chat-input" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap" }}>
          Respond to the tutor
        </label>
        <input
          id="chat-input"
          style={{ flex: 1, border: `0.5px solid ${t.border}`, borderRadius: 8, padding: "10px 14px", fontSize: 13, background: t.inputBg, color: t.text, fontFamily: "'Inter', sans-serif", outline: "none" }}
          placeholder="Respond to the tutor..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !loading && handleChat()}
          disabled={loading}
        />
        <button
          onClick={handleChat}
          disabled={loading || !input.trim()}
          style={{ background: t.accent, color: t.accentText, border: "none", borderRadius: 8, padding: "10px 16px", fontSize: 13, fontFamily: "'Inter', sans-serif", fontWeight: 500, cursor: "pointer", opacity: loading || !input.trim() ? 0.5 : 1 }}
          onFocus={e => Object.assign(e.target.style, focusStyle(t.text))}
          onBlur={e => { e.target.style.outline = "none" }}
        >
          Send
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ height: "100vh", overflow: "hidden", background: t.bg, color: t.text, fontFamily: "'Inter', sans-serif", transition: "background 0.25s", position: "relative" }}>
      <Texture />
      <div style={{ position: "relative", zIndex: 1, height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Header */}
        <header style={{ background: t.bg, borderBottom: `0.5px solid ${t.border}`, padding: isMobile ? "10px 14px" : "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <button
            onClick={handleReset}
            aria-label="Jane Eyre Essay Tutor — return to home"
            style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left" }}
            onFocus={e => Object.assign(e.target.style, focusStyle(t.accent))}
            onBlur={e => { e.target.style.outline = "none" }}
          >
            <Bird />
            <div>
              <div style={{ fontFamily: t.fontTitle, fontSize: isMobile ? 16 : 20, color: t.accent }}>Jane Eyre Essay Tutor</div>
              {!isMobile && <div style={{ fontSize: 12, color: t.subtext, marginTop: 2 }}>A thinking partner for essay writing</div>}
            </div>
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 10 : 16 }}>
            <div role="group" aria-label="Choose theme" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {!isMobile && <span aria-hidden="true" style={{ fontSize: 11, color: t.subtext, fontWeight: 500 }}>Theme</span>}
              {Object.entries(swatchColors).map(([name, colors]) => (
                <button
                  key={name}
                  onClick={() => setTheme(name)}
                  aria-label={`${name.charAt(0).toUpperCase() + name.slice(1)} theme${theme === name ? " (selected)" : ""}`}
                  aria-pressed={theme === name}
                  style={{
                    width: 16, height: 16, borderRadius: "50%", cursor: "pointer",
                    background: colors.outer, border: "none", padding: 0,
                    boxShadow: `inset 0 0 0 4px ${colors.inner}${theme === name ? `, 0 0 0 2px ${colors.outer}` : ""}`,
                    transition: "transform 0.15s, box-shadow 0.15s",
                    transform: theme === name ? "scale(1.15)" : "scale(1)"
                  }}
                  onFocus={e => Object.assign(e.target.style, focusStyle(t.accent))}
                  onBlur={e => { e.target.style.outline = "none" }}
                />
              ))}
            </div>
            {started && (
              <button
                onClick={handleReset}
                style={{ fontSize: 12, color: t.subtext, background: "none", border: "none", textDecoration: "underline", cursor: "pointer", whiteSpace: "nowrap", fontFamily: "'Inter', sans-serif", padding: 0 }}
                onFocus={e => Object.assign(e.target.style, focusStyle(t.accent))}
                onBlur={e => { e.target.style.outline = "none" }}
              >
                {isMobile ? "Reset" : "Start new topic"}
              </button>
            )}
          </div>
        </header>

        {/* Search screen */}
        {!started && (
          <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", overflow: "auto" }}>
            <div style={{ maxWidth: 520, width: "100%", padding: "0 24px", textAlign: "center" }}>
              <h1 style={{ fontFamily: t.fontTitle, fontSize: isMobile ? 24 : 30, color: t.accent, margin: "0 0 8px" }}>
                What would you like to explore?
              </h1>
              <p style={{ fontSize: 14, color: t.subtext, margin: "0 0 28px", lineHeight: 1.6 }}>
                Ask about a theme, character, or literary device in Jane Eyre and I'll find relevant passages to help you think through your essay.
              </p>
              <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 8 }}>
                <label htmlFor="question-input" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap" }}>
                  Ask a question about Jane Eyre
                </label>
                <input
                  id="question-input"
                  style={{ flex: 1, border: `0.5px solid ${t.border}`, borderRadius: 8, padding: "12px 16px", fontSize: 14, background: t.inputBg, color: t.text, fontFamily: "'Inter', sans-serif", outline: "none" }}
                  placeholder="e.g. how does Brontë use weather and nature imagery"
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleStart()}
                />
                <button
                  onClick={handleStart}
                  disabled={loading}
                  style={{ background: t.accent, color: t.accentText, border: "none", borderRadius: 8, padding: "12px 20px", fontSize: 14, fontFamily: "'Inter', sans-serif", fontWeight: 500, cursor: "pointer", opacity: loading ? 0.6 : 1 }}
                  onFocus={e => Object.assign(e.target.style, focusStyle(t.text))}
                  onBlur={e => { e.target.style.outline = "none" }}
                >
                  {loading ? "Thinking..." : "Explore"}
                </button>
              </div>
            </div>
          </main>
        )}

        {/* Main layout */}
        {started && (
          isMobile ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div role="tablist" aria-label="View" style={{ display: "flex", borderBottom: `0.5px solid ${t.border}`, flexShrink: 0 }}>
                {["chat", "passages"].map(tab => (
                  <button
                    key={tab}
                    role="tab"
                    aria-selected={activeTab === tab}
                    aria-controls={`tabpanel-${tab}`}
                    id={`tab-${tab}`}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      flex: 1, padding: "10px", fontSize: 13, fontFamily: "'Inter', sans-serif", fontWeight: 500,
                      border: "none", borderBottom: activeTab === tab ? `2px solid ${t.accent}` : "2px solid transparent",
                      background: "transparent", color: activeTab === tab ? t.accent : t.subtext, cursor: "pointer",
                      textTransform: "capitalize"
                    }}
                    onFocus={e => Object.assign(e.target.style, focusStyle(t.accent))}
                    onBlur={e => { e.target.style.outline = "none" }}
                  >
                    {tab === "passages" ? `Passages (${passages.length})` : "Chat"}
                  </button>
                ))}
              </div>
              <div role="tabpanel" id={`tabpanel-${activeTab}`} aria-labelledby={`tab-${activeTab}`} style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                {activeTab === "chat" ? chatPanel : passagesPanel}
              </div>
            </div>
          ) : (
            <main style={{ display: "flex", flex: 1, overflow: "hidden" }}>
              <div style={{ width: "42%", borderRight: `0.5px solid ${t.border}`, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                {passagesPanel}
              </div>
              {chatPanel}
            </main>
          )
        )}
      </div>
    </div>
  )
}
