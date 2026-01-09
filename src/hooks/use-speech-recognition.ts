import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { SPEECH_CONFIG } from "../configs/speech.config"
import type {
  UseSpeechRecognitionReturn,
  SpeechRecognitionOptions,
  ISpeechRecognition,
  SpeechRecognitionEvent,
  SpeechRecognitionErrorEvent,
} from "../types/speech-recognition"

function mergeFinalTranscript(prev: string, incomingFinal: string): string {
  const prevClean = prev.trim().replace(/\s+/g, " ")
  const nextClean = incomingFinal.trim().replace(/\s+/g, " ")

  if (!nextClean) return prevClean
  if (!prevClean) return nextClean

  if (prevClean === nextClean) return prevClean
  if (prevClean.endsWith(nextClean)) return prevClean
  if (nextClean.startsWith(prevClean)) return nextClean
  const maxOverlap = Math.min(prevClean.length, nextClean.length)
  for (let k = maxOverlap; k >= 1; k--) {
    const suffix = prevClean.slice(-k)
    const prefix = nextClean.slice(0, k)
    if (suffix === prefix) {
      const merged = (prevClean + nextClean.slice(k)).trim()
      return merged.replace(/\s+/g, " ")
    }
  }
  return (prevClean + " " + nextClean).trim().replace(/\s+/g, " ")
}

export const useSpeechRecognition = ({
  continuous = SPEECH_CONFIG.continuous,
  interimResults = SPEECH_CONFIG.interimResults,
  lang = SPEECH_CONFIG.language,
  maxAlternatives = SPEECH_CONFIG.maxAlternatives,
}: SpeechRecognitionOptions): UseSpeechRecognitionReturn => {
  // Estado público
  const [transcript, setTranscript] = useState("")
  const [interim, setInterim] = useState("")
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSupported] = useState(() => {
    if (typeof window === "undefined") return false
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  })

  const recognitionRef = useRef<ISpeechRecognition | null>(null)
  const isActiveRef = useRef(false)        // Motor físicamente activo
  const shouldListenRef = useRef(false)    // Intención de escuchar (para auto-restart)
  const isPageVisibleRef = useRef(true)

  // === PROTECCIONES ANTI-DUPLICADO PARA ANDROID ===
  const recognitionStartingRef = useRef(false)  // Evita doble start()
  const lastRestartTimeRef = useRef(0)          // Evita restarts muy rápidos
  const lastStartTimeRef = useRef(0)            // Cuándo empezó la sesión actual
  const immediateClosesCountRef = useRef(0)     // Cuenta cierres inmediatos consecutivos

  // Constantes de timing
  const MIN_RESTART_INTERVAL = 800              // ms mínimo entre restarts
  const IMMEDIATE_CLOSE_THRESHOLD = 500         // Si cierra antes de esto, es "inmediato"
  const BASE_RESTART_DELAY = 300                // Delay base para restart

  // Inicializar SpeechRecognition
  useEffect(() => {
    if (typeof window === "undefined") return

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.continuous = continuous
    recognition.interimResults = interimResults
    recognition.lang = lang
    recognition.maxAlternatives = maxAlternatives

    recognition.onstart = () => {
      console.log("🎤 [Speech] Reconocimiento iniciado")
      isActiveRef.current = true
      recognitionStartingRef.current = false  // Ya no está "iniciando"
      lastStartTimeRef.current = Date.now()   // Marcar tiempo de inicio
      setIsListening(true)
      setError(null)
    }

    recognition.onend = () => {
      console.log("🔚 [Speech] Reconocimiento terminado")
      isActiveRef.current = false
      recognitionStartingRef.current = false
      setIsListening(false)

      // Detectar si fue cierre inmediato (Android hace esto frecuentemente)
      const sessionDuration = Date.now() - lastStartTimeRef.current
      if (sessionDuration < IMMEDIATE_CLOSE_THRESHOLD) {
        immediateClosesCountRef.current++
        console.log(`⚠️ [Speech] Cierre inmediato #${immediateClosesCountRef.current} (${sessionDuration}ms)`)
      } else {
        // Sesión normal, resetear contador
        immediateClosesCountRef.current = 0
      }

      // Auto-restart si debe seguir escuchando y página visible
      if (shouldListenRef.current && isPageVisibleRef.current) {
        const now = Date.now()
        const timeSinceLastRestart = now - lastRestartTimeRef.current

        // Evitar restart muy rápido
        if (timeSinceLastRestart < MIN_RESTART_INTERVAL) {
          console.log(`⏳ [Speech] Esperando... (último restart hace ${timeSinceLastRestart}ms)`)
          const waitTime = MIN_RESTART_INTERVAL - timeSinceLastRestart
          setTimeout(() => {
            if (shouldListenRef.current && !isActiveRef.current && !recognitionStartingRef.current) {
              safeRestart()
            }
          }, waitTime)
          return
        }

        // Delay progresivo basado en cierres inmediatos
        const progressiveDelay = BASE_RESTART_DELAY + (immediateClosesCountRef.current * 500)
        const finalDelay = Math.min(progressiveDelay, 2000) // Máximo 2s

        console.log(`🔁 [Speech] Auto-reiniciando en ${finalDelay}ms...`)
        setTimeout(() => {
          if (shouldListenRef.current && !isActiveRef.current && !recognitionStartingRef.current) {
            safeRestart()
          }
        }, finalDelay)
      }
    }

    // Función segura de restart
    const safeRestart = () => {
      if (!recognitionRef.current || isActiveRef.current || recognitionStartingRef.current) {
        return
      }

      try {
        recognitionStartingRef.current = true
        lastRestartTimeRef.current = Date.now()
        recognitionRef.current.start()
      } catch (err) {
        console.error("[Speech] Error en auto-restart:", err)
        recognitionStartingRef.current = false
        // Si hay InvalidStateError, esperar y reintentar
        if (err instanceof Error && err.name === "InvalidStateError") {
          setTimeout(() => {
            if (shouldListenRef.current && !isActiveRef.current) {
              safeRestart()
            }
          }, 500)
        }
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error(`❌ [Speech] Error: ${event.error}`)

      // Errores ignorables (no fatales)
      if (event.error === "no-speech" || event.error === "aborted") {
        return
      }

      // Error de red en móviles - permitir retry
      if (event.error === "network") {
        console.log("[Speech] Error de red - se reintentará")
        return
      }

      // Errores fatales
      const errorMessages: Record<string, string> = {
        "audio-capture": "No se puede capturar audio (verifica el micrófono)",
        "not-allowed": "Permiso de micrófono denegado",
        "service-not-allowed": "Servicio de reconocimiento no permitido",
      }
      setError(errorMessages[event.error] || `Error: ${event.error}`)
      shouldListenRef.current = false
      setIsListening(false)
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalText = ""
      let interimText = ""

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finalText += result[0].transcript + " "
        } else {
          interimText += result[0].transcript
        }
      }

      if (finalText) {
        const finalClean = finalText.trim()
        setTranscript((prev) => mergeFinalTranscript(prev, finalClean))
        setInterim("")
      } else if (interimText) {
        setInterim(interimText.trim())
      }
    }

    recognitionRef.current = recognition

    return () => {
      recognition.onstart = null
      recognition.onend = null
      recognition.onerror = null
      recognition.onresult = null
      try { recognition.stop() } catch { /* ignore */ }
    }
  }, [continuous, interimResults, lang, maxAlternatives])

  // Manejar visibilidad (móviles)
  useEffect(() => {
    const handleVisibility = () => {
      isPageVisibleRef.current = !document.hidden

      if (document.hidden && isActiveRef.current) {
        try { recognitionRef.current?.stop() } catch { /* ignore */ }
      } else if (!document.hidden && shouldListenRef.current && !isActiveRef.current && !recognitionStartingRef.current) {
        // Delay mayor para reanudo por visibilidad
        setTimeout(() => {
          if (shouldListenRef.current && !isActiveRef.current && !recognitionStartingRef.current) {
            try {
              recognitionStartingRef.current = true
              recognitionRef.current?.start()
            } catch {
              recognitionStartingRef.current = false
            }
          }
        }, 500)
      }
    }

    document.addEventListener("visibilitychange", handleVisibility)
    return () => document.removeEventListener("visibilitychange", handleVisibility)
  }, [])

  // Texto combinado para UI
  const displayTranscript = useMemo(() =>
    `${transcript} ${interim}`.trim(),
    [transcript, interim]
  )

  /**
   * Iniciar escucha - activa intención y motor
   */
  const startListening = useCallback(() => {
    if (!isSupported || !recognitionRef.current) {
      setError("Reconocimiento de voz no disponible")
      return
    }

    shouldListenRef.current = true

    if (isActiveRef.current || recognitionStartingRef.current) {
      console.log("ℹ️ [Speech] Ya está escuchando o iniciando")
      return
    }

    try {
      recognitionStartingRef.current = true
      lastRestartTimeRef.current = Date.now()
      immediateClosesCountRef.current = 0  // Reset al iniciar manualmente
      recognitionRef.current.start()
      console.log("🎤 [Speech] Iniciando...")
    } catch (err) {
      console.error("[Speech] Error al iniciar:", err)
      recognitionStartingRef.current = false
      setError("No se pudo iniciar el reconocimiento")
    }
  }, [isSupported])

  /**
   * Detener completamente - apaga motor e intención
   */
  const stopListening = useCallback(() => {
    shouldListenRef.current = false
    recognitionStartingRef.current = false
    immediateClosesCountRef.current = 0
    setIsListening(false)

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
        console.log("🛑 [Speech] Detenido completamente")
      } catch { /* ignore */ }
    }
  }, [])

  /**
   * Limpiar transcript
   */
  const resetTranscript = useCallback(() => {
    setTranscript("")
    setInterim("")
    setError(null)
    immediateClosesCountRef.current = 0
  }, [])

  return {
    transcript,
    interim,
    displayTranscript,
    isListening,
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript,
  }
}
