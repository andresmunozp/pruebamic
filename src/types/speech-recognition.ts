export interface UseSpeechRecognitionReturn {
  transcript: string
  interim: string
  displayTranscript: string
  isListening: boolean
  isSupported: boolean
  error: string | null
  startListening: () => void
  stopListening: () => void
  resetTranscript: () => void
}

export interface SpeechRecognitionOptions {
  continuous?: boolean
  interimResults?: boolean
  lang?: string
  maxAlternatives?: number
}

export interface SpeechConfig {
  silenceDelay: number
  interimResults: boolean
  language: string
  continuous: boolean
  maxAlternatives: number
}

export interface ISpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  start(): void
  stop(): void
  abort(): void
  onstart: ((this: ISpeechRecognition, ev: Event) => unknown) | null
  onend: ((this: ISpeechRecognition, ev: Event) => unknown) | null
  onerror: ((this: ISpeechRecognition, ev: SpeechRecognitionErrorEvent) => unknown) | null
  onresult: ((this: ISpeechRecognition, ev: SpeechRecognitionEvent) => unknown) | null
}

export interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message: string
}

export interface SpeechRecognitionEvent extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}

export interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

export interface SpeechRecognitionResult {
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
  isFinal: boolean
}

export interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

declare global {
  interface Window {
    SpeechRecognition: {
      new (): ISpeechRecognition
    }
    webkitSpeechRecognition: {
      new (): ISpeechRecognition
    }
  }
}
