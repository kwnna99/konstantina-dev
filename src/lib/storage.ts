/**
 * localStorage that never throws. Safari private mode, blocked site data and
 * server rendering all make storage unavailable; callers just get `null`.
 */
export function safeGet(key: string): string | null {
  try {
    return globalThis.localStorage?.getItem(key) ?? null
  } catch {
    return null
  }
}

export function safeSet(key: string, value: string): void {
  try {
    globalThis.localStorage?.setItem(key, value)
  } catch {
    // Storage is unavailable; the value lives for this page view only.
  }
}
