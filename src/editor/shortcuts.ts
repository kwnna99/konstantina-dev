export type ShortcutAction = 'undo' | 'redo' | 'palette' | 'escape' | 'moveUp' | 'moveDown'

export interface KeyLike {
  key: string
  metaKey: boolean
  ctrlKey: boolean
  shiftKey: boolean
  altKey: boolean
}

export interface ShortcutContext {
  isMac: boolean
  editingText: boolean
  paletteOpen: boolean
  hasSelection: boolean
}

/**
 * True on Apple platforms, where the command modifier is ⌘ rather than Ctrl.
 * Chromium reports `userAgentData.platform` as "macOS" (lower-case m), others
 * report `navigator.platform` as "MacIntel", "iPhone" or "iPad".
 */
export function isApplePlatform(nav: { platform?: string; userAgentData?: { platform?: string } }): boolean {
  return /mac|iphone|ipad/i.test(nav.userAgentData?.platform || nav.platform || '')
}

/**
 * Maps a key event to an editor action, or null when the event is not ours.
 * While the visitor is typing (inline edit or palette input) only Escape is
 * intercepted, plus the palette shortcut when the palette is already open so
 * it can toggle closed. Everything else belongs to the text field.
 */
export function resolveShortcut(e: KeyLike, ctx: ShortcutContext): ShortcutAction | null {
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key

  if (key === 'Escape') return 'escape'

  // The platform's command modifier: Cmd on Mac, Ctrl elsewhere, never both.
  const mod = ctx.isMac ? e.metaKey && !e.ctrlKey : e.ctrlKey && !e.metaKey

  if (ctx.editingText) return null

  if (mod && !e.altKey && key === 'k') return 'palette'
  if (ctx.paletteOpen) return null

  if (mod && !e.altKey) {
    if (key === 'z') return e.shiftKey ? 'redo' : 'undo'
    if (key === 'y' && !ctx.isMac && !e.shiftKey) return 'redo'
  }

  if (e.altKey && !e.metaKey && !e.ctrlKey && !e.shiftKey && ctx.hasSelection) {
    if (key === 'ArrowUp') return 'moveUp'
    if (key === 'ArrowDown') return 'moveDown'
  }

  return null
}
