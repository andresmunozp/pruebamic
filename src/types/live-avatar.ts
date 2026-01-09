import type { LiveAvatarSession } from "@heygen/liveavatar-web-sdk"

export interface LiveAvatarSessionConfig {
  mode: "FULL" | "CUSTOM"
  avatar_id: string
  avatar_persona: {
    context_id: string
  }
}

export interface UseAvatarSessionReturn {
  isSessionActive: boolean
  isSessionActiveRef: React.RefObject<boolean>
  videoRef: React.RefObject<HTMLVideoElement>
  initializeSession: (onAvatarSpeakStarted?: () => void, onAvatarSpeakEnded?: () => void) => Promise<void>
  terminateSession: () => Promise<void>
  speak: (text: string) => Promise<void>
  error: string | null
}

export interface AvatarSessionData {
  session: LiveAvatarSession | null
}

// LiveAvatarInitOptions es alias de LiveAvatarSessionConfig
export type LiveAvatarInitOptions = LiveAvatarSessionConfig


export interface LiveAvatarSessionPort {
  start(): Promise<void>
  attach(videoEl: HTMLVideoElement): void

  // habla (no todas las versiones lo traen tipado)
  repeat?(text: string): Promise<void>

  // lifecycle
  stop?(): Promise<void>
  close?(): Promise<void>

  // events (opcional)
  on?(
    event: LiveAvatarEventName,
    handler: () => void,
  ): void
}

/**
 * Tipamos SOLO los eventos que tú usas.
 * Si mañana agregas otro, lo amplías aquí.
 */
export type LiveAvatarEventName =
  | "session.stream_ready"
  | "session.disconnected"
  | "avatar.speak_started"
  | "avatar.speak_ended"

/**
 * Si en runtime viene un LiveAvatarSession del SDK, lo tratamos como port.
 * Esto NO usa any; usa un cast controlado a través de unknown.
 */
export const asLiveAvatarPort = (s: LiveAvatarSession): LiveAvatarSessionPort =>
  s as unknown as LiveAvatarSessionPort

/**
 * Type guards para capacidades opcionales
 */
export const hasRepeat = (
  s: LiveAvatarSessionPort,
): s is LiveAvatarSessionPort & Required<Pick<LiveAvatarSessionPort, "repeat">> =>
  typeof s.repeat === "function"

export const hasStop = (
  s: LiveAvatarSessionPort,
): s is LiveAvatarSessionPort & Required<Pick<LiveAvatarSessionPort, "stop">> =>
  typeof s.stop === "function"

export const hasClose = (
  s: LiveAvatarSessionPort,
): s is LiveAvatarSessionPort & Required<Pick<LiveAvatarSessionPort, "close">> =>
  typeof s.close === "function"

export const hasOn = (
  s: LiveAvatarSessionPort,
): s is LiveAvatarSessionPort & Required<Pick<LiveAvatarSessionPort, "on">> =>
  typeof s.on === "function"
