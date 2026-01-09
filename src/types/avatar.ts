import type StreamingAvatar from "@heygen/streaming-avatar"

export interface AvatarSessionConfig {
  quality: "low" | "medium" | "high"
  avatarName: string
  voiceId?: string
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
  avatar: StreamingAvatar | null
  sessionData: unknown | null
}
