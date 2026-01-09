import { useEffect, useRef, useState } from "react"
// ✅ ajusta este import a tu ruta real
import { useSpeechRecognition } from "./hooks/use-speech-recognition"

type LogItem = { t: number; msg: string }

export function SpeechHookTester() {
  const [logs, setLogs] = useState<LogItem[]>([])
  const pushLog = (msg: string) => {
    setLogs((prev) => [...prev, { t: Date.now(), msg }].slice(-200))
  }

  // Usa tu hook
  const {
    transcript,
    interim,
    displayTranscript,
    isListening,
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition({
    continuous: true,
    interimResults: true,
    lang: "es-ES",
    maxAlternatives: 1,
  })

  // Log en pantalla cuando cambian valores clave
  const lastDisplayRef = useRef<string>("")
  const lastTranscriptRef = useRef<string>("")
  const lastInterimRef = useRef<string>("")

  useEffect(() => {
    if (displayTranscript !== lastDisplayRef.current) {
      pushLog(`UI: ${displayTranscript}`)
      lastDisplayRef.current = displayTranscript
    }
  }, [displayTranscript])

  useEffect(() => {
    if (transcript !== lastTranscriptRef.current) {
      pushLog(`FINAL_ACC: ${transcript}`)
      lastTranscriptRef.current = transcript
    }
  }, [transcript])

  useEffect(() => {
    if (interim !== lastInterimRef.current) {
      pushLog(`INTERIM: ${interim}`)
      lastInterimRef.current = interim
    }
  }, [interim])

  useEffect(() => {
    pushLog(`STATE: supported=${isSupported} listening=${isListening}`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSupported, isListening])

  useEffect(() => {
    if (error) pushLog(`ERROR: ${error}`)
  }, [error])

  const handleStart = async () => {
    pushLog("ACTION: startListening()")
    startListening()
  }

  const handleStop = () => {
    pushLog("ACTION: stopListening()")
    stopListening()
  }

  const handleReset = () => {
    pushLog("ACTION: resetTranscript()")
    resetTranscript()
    setLogs([])
  }

  const copyLogs = async () => {
    const text = logs
      .map((l) => `${new Date(l.t).toISOString()} ${l.msg}`)
      .join("\n")
    await navigator.clipboard.writeText(text)
    pushLog("ACTION: logs copied to clipboard")
  }

  return (
    <div style={{ padding: 16, fontFamily: "system-ui, sans-serif", maxWidth: 900, margin: "0 auto" }}>
      <h2>Speech Recognition Hook Tester</h2>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <button onClick={handleStart} disabled={!isSupported}>
          Start
        </button>
        <button onClick={handleStop}>
          Stop
        </button>
        <button onClick={handleReset}>
          Reset
        </button>
        <button onClick={copyLogs} disabled={logs.length === 0}>
          Copy logs
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8 }}>
          <h3 style={{ marginTop: 0 }}>Status</h3>
          <div><b>Supported:</b> {String(isSupported)}</div>
          <div><b>Listening:</b> {String(isListening)}</div>
          <div><b>Error:</b> {error ?? "-"}</div>
        </div>

        <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8 }}>
          <h3 style={{ marginTop: 0 }}>Current Text</h3>
          <div style={{ marginBottom: 6 }}><b>displayTranscript</b></div>
          <div style={{ whiteSpace: "pre-wrap" }}>{displayTranscript || "-"}</div>
        </div>
      </div>

      <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8, marginBottom: 12 }}>
        <h3 style={{ marginTop: 0 }}>Raw (debug)</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <div><b>transcript (FINAL acumulado)</b></div>
            <div style={{ whiteSpace: "pre-wrap" }}>{transcript || "-"}</div>
          </div>
          <div>
            <div><b>interim</b></div>
            <div style={{ whiteSpace: "pre-wrap" }}>{interim || "-"}</div>
          </div>
        </div>
      </div>

      <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8 }}>
        <h3 style={{ marginTop: 0 }}>Logs</h3>
        <div
          style={{
            height: 260,
            overflow: "auto",
            background: "#000",
            padding: 10,
            borderRadius: 6,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: 12,
            whiteSpace: "pre-wrap",
          }}
        >
          {logs.length === 0
            ? "No logs yet. Press Start and speak."
            : logs.map((l) => {
                const time = new Date(l.t).toLocaleTimeString()
                return `${time}  ${l.msg}\n`
              })}
        </div>

        <p style={{ marginTop: 10, color: "#666" }}>
          Tip: habla frases cortas y espera 1–2s entre frases para ver claramente los eventos y si hay replays.
        </p>
      </div>
    </div>
  )
}
