import type { SpeechConfig } from "../types/speech-recognition"

export const SPEECH_CONFIG: SpeechConfig = {
  silenceDelay: 1500,
  interimResults: false,
  language: "es-ES",
  continuous: true,
  maxAlternatives: 1,
}
