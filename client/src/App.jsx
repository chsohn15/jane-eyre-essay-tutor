import { useState, useEffect } from "react"
import axios from "axios"

const API = "http://localhost:8000"

const themes = {
  midnight: {
    bg: "#0F0E17",
    surface: "#1A1928",
    border: "#2A2840",
    accent: "#4DFFC4",
    accentText: "#0F0E17",
    text: "#C9C7D4",
    textStrong: "#4DFFC4",
    subtext: "#6B6880",
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
    accent: "#C07A4F",
    accentText: "#fff",
    text: "#3D2B1F",
    textStrong: "#C07A4F",
    subtext: "#A0856E",
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
    accent: "#7C6BAE",
    accentText: "#fff",
    text: "#3B2F5E",
    textStrong: "#7C6BAE",
    subtext: "#9B8DB8",
    inputBg: "#fff",
    leftBg: "#FAF8FD",
    fontTitle: "'Playfair Display', serif",
    textureColor: "#3B2F5E",
    textureOpacity: 0.07,
  }
}

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem("je-theme") || "midnight")
  const [question, setQuestion] = useState("")
  const [passages, setPassages] = useState([])
  const [messages, setMessages] = useState([])
  const [conversation, setConversation] = useState([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [started, setStarted] = useState(false)

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

  async function handleStart() {
    if (!question.trim()) return
    setLoading(true)
    try {
      const res = await axios.post(`${API}/start`, { question })
      setPassages(res.data.passages)
      setMessages(res.data.messages)
      setConversation([{ role: "tutor", text: res.data.tutor_message }])
      setStarted(true)
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
    parchment: { outer: "#C07A4F", inner: "#FDF8F2" },
    lavender: { outer: "#7C6BAE", inner: "#F4F1F8" },
  }

  const Bird = () => (
    <svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
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
    <svg style={{ position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0, opacity: t.textureOpacity }} xmlns="http://www.w3.org/2000/svg">
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

  return (
    <div style={{ minHeight: "100vh", background: t.bg, color: t.text, fontFamily: "'Inter', sans-serif", transition: "background 0.25s", position: "relative" }}>
      <Texture />
      <div style={{ position: "relative", zIndex: 1, minHeight: "100vh", display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <div style={{ background: t.bg, borderBottom: `0.5px solid ${t.border}`, padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Bird />
            <div>
              <div style={{ fontFamily: t.fontTitle, fontSize: 20, color: t.accent }}>Jane Eyre Essay Tutor</div>
              <div style={{ fontSize: 12, color: t.subtext, marginTop: 2 }}>A thinking partner for essay writing</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11, color: t.subtext, fontWeight: 500 }}>Theme</span>
              {Object.entries(swatchColors).map(([name, colors]) => (
                <div
                  key={name}
                  onClick={() => setTheme(name)}
                  title={name.charAt(0).toUpperCase() + name.slice(1)}
                  style={{
                    width: 18, height: 18, borderRadius: "50%", cursor: "pointer",
                    background: colors.outer,
                    boxShadow: `inset 0 0 0 5px ${colors.inner}${theme === name ? `, 0 0 0 2px ${colors.outer}` : ""}`,
                    transition: "transform 0.15s, box-shadow 0.15s",
                    transform: theme === name ? "scale(1.15)" : "scale(1)"
                  }}
                />
              ))}
            </div>
            {started && (
              <span
                onClick={handleReset}
                style={{ fontSize: 12, color: t.subtext, textDecoration: "underline", cursor: "pointer" }}
              >
                Start new topic
              </span>
            )}
          </div>
        </div>

        {/* Search screen */}
        {!started && (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ maxWidth: 520, width: "100%", padding: "0 24px", textAlign: "center" }}>
              <div style={{ fontFamily: t.fontTitle, fontSize: 30, color: t.accent, marginBottom: 8 }}>
                What would you like to explore?
              </div>
              <div style={{ fontSize: 14, color: t.subtext, marginBottom: 28, lineHeight: 1.6 }}>
                Ask about a theme, character, or literary device in Jane Eyre and I'll find relevant passages to help you think through your essay.
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input
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
                >
                  {loading ? "Thinking..." : "Explore"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main layout */}
        {started && (
          <div style={{ display: "flex", flex: 1, height: "calc(100vh - 57px)" }}>

            {/* Left panel */}
            <div style={{ width: "42%", borderRight: `0.5px solid ${t.border}`, overflowY: "auto", padding: 16, background: t.leftBg }}>
              <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: t.subtext, marginBottom: 12 }}>
                Retrieved Passages
              </div>
              {passages.map((p, i) => (
                <div key={i} style={{ background: t.surface, border: `0.5px solid ${t.border}`, borderLeft: `3px solid ${t.accent}`, borderRadius: 10, padding: "12px 14px", marginBottom: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color: t.textStrong, marginBottom: 6 }}>
                    Passage {i + 1} · {p.chapter}
                  </div>
                  <div style={{ fontSize: 13, lineHeight: 1.65, color: t.text }}>
                    {p.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Right panel */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", background: t.bg }}>
              <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                {conversation.map((msg, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: msg.role === "student" ? "flex-end" : "flex-start" }}>
                    <div style={{
                      maxWidth: msg.role === "student" ? "80%" : "88%",
                      background: msg.role === "student" ? t.accent : t.surface,
                      border: msg.role === "student" ? "none" : `0.5px solid ${t.border}`,
                      borderRadius: msg.role === "student" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                      padding: "12px 14px"
                    }}>
                      {msg.role === "tutor" && (
                        <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color: t.textStrong, marginBottom: 5 }}>
                          Tutor
                        </div>
                      )}
                      <div style={{ fontSize: 13, lineHeight: 1.6, color: msg.role === "student" ? t.accentText : t.text, fontWeight: msg.role === "student" ? 500 : 400 }}>
                        {msg.text}
                      </div>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div style={{ display: "flex", justifyContent: "flex-start" }}>
                    <div style={{ background: t.surface, border: `0.5px solid ${t.border}`, borderRadius: "12px 12px 12px 2px", padding: "12px 14px", fontSize: 13, color: t.subtext }}>
                      Thinking...
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div style={{ borderTop: `0.5px solid ${t.border}`, padding: "12px 14px", display: "flex", gap: 8, background: t.leftBg }}>
                <input
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
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
