/**
 * Interfaces para la comunicación con el LLM backend usando Socket.IO
 */

export interface ChatMessage {
  role: "user" | "model" | "assistant"
  text: string
  timestamp: number
}

export interface ChatRequest {
  messages: ChatMessage[]
  useContext?: boolean
  useExtendedContext?: boolean
}

export interface ChatResponse {
  response: string
}

export interface UseChatReturn {
  messages: ChatMessage[]
  isLoading: boolean
  isTyping: boolean
  error: string | null
  sendMessage: (userMessage: string) => Promise<string | null>
  clearMessages: () => void
  endSession: () => void
  isConnected?: boolean
  requestHistory?: () => void
  // Payment
  paymentData: PaymentQRGeneratedPayload | null
  paymentStatus: PaymentStatus
  paymentError: string | null
  closePaymentModal: () => void
  setOnSessionExpired: (callback: (data: SessionExpiredPayload) => void) => void
}

// Socket.IO Event Payloads
export interface ChatMessagePayload {
  sessionId: string
  message: string
  timestamp: number
}

export interface ChatResponseTokenPayload {
  sessionId: string
  token: string
  isComplete: boolean
}

export interface ChatResponseCompletePayload {
  sessionId: string
  fullText: string
  timestamp: number
}

export interface ChatHistoryPayload {
  sessionId: string
}

export interface ChatHistoryResponsePayload {
  sessionId: string
  history: Array<{
    role: string
    parts: string
  }>
}

export interface ChatClearSessionPayload {
  sessionId: string
}

export interface EndSessionPayload {
  sessionId: string
}

export interface NotificationPayload {
  type: "error" | "success" | "info" | "warning"
  message: string
}

// Payment Event Payloads
export interface PaymentQRGeneratedPayload {
  sessionId: string
  paymentId: number
  qrCode: string
  paymentUrl: string
  amount: number
  currency: string
}

export interface PaymentCompletedPayload {
  paymentId: number
  patientId: number
  amount: number
  currency: string
}

export interface PaymentFailedPayload {
  paymentId: number
  patientId: number
  error: string
}

export interface SessionExpiredPayload {
  sessionId: string
  newSessionId: string
  timestamp: number
  reason: string
}

export type PaymentStatus = "idle" | "pending" | "success" | "failed"

export interface ChatServiceCallbacks {
  onReconnect?: () => void
  onConnect?: () => void
  onDisconnect?: () => void
  onSessionCreated?: (sessionId: string) => void
  onSessionExpired?: (data: SessionExpiredPayload) => void
}

export interface ChatService {
  connect: (token?: string) => Promise<void>
  disconnect: () => void
  sendMessage: (message: string) => void
  requestNewSession: () => void
  requestHistory: () => void
  clearSession: () => void
  endSession: () => void
  removeAllListeners: () => void
  onResponseToken: (callback: (token: string, isComplete: boolean) => void) => void
  onResponseComplete: (callback: (fullText: string, sessionEnded?: boolean) => void) => void
  onNotification: (callback: (type: string, message: string) => void) => void
  onHistoryResponse: (callback: (history: ChatMessage[]) => void) => void
  onPaymentQRGenerated: (callback: (data: PaymentQRGeneratedPayload) => void) => void
  onPaymentCompleted: (callback: (data: PaymentCompletedPayload) => void) => void
  onPaymentFailed: (callback: (data: PaymentFailedPayload) => void) => void
  getSessionId: () => string
  isSocketConnected: () => boolean
  hasSessionId: () => boolean
  onSessionCreated: (callback: (sessionId: string) => void) => void
  onSessionExpired: (callback: (data: SessionExpiredPayload) => void) => void
  onReconnect: (callback: () => void) => void
  onConnect: (callback: () => void) => void
  onDisconnect: (callback: () => void) => void
}
