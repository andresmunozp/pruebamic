export type ApiResponse<T = undefined> =
  | SuccessResponse<T>
  | ErrorResponse

export type SuccessResponse<T = undefined> = {
  success: true
  message?: string
} & (T extends undefined ? object : { data: T })

export interface ErrorResponse {
  success: false
  message: string
}
