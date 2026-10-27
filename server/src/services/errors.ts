// An error whose message is safe to show to the client.
// Anything that is not an AppError becomes a generic 500 response.
export class AppError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}
