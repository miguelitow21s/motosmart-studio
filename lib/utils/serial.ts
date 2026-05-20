export function formatSerial(serial: number): string {
  return serial.toString().padStart(3, "0")
}

export function parseSerial(serial: string): number {
  return parseInt(serial, 10)
}

export function generatePublicToken(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase()
}
