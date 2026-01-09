import type { AvatarSessionConfig } from "../types/avatar"
import type { LiveAvatarSessionConfig } from "..//types/live-avatar"
export const AVATAR_CONFIG: AvatarSessionConfig = {
  quality: "high",
  avatarName: "Ann_Therapist_public",
  // Para cambiar el idioma, necesitas un voiceId válido de HeyGen (ej. para español)
  // voiceId: "2d5b0e6cf36f460aa7fc47e3eee4b096", // Ejemplo de ID (verificar validez)
}

export const DEFAULT_AVATAR_CONFIG: LiveAvatarSessionConfig = {
  mode: "FULL" as const,
  avatar_id: "513fd1b7-7ef9-466d-9af2-344e51eeb833",
  avatar_persona: {
    context_id: "95b5fd10-057a-478b-9759-33685d61d412",
  }
}