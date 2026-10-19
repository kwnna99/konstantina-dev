import { content, type BlockId } from '../content'
import type { Editor } from './store'
import type { useMode } from './mode'
import type { useTheme } from './theme'

export interface Command {
  id: string
  label: string
  group: 'Jump to' | 'View' | 'Links' | 'Page'
  run(): void | Promise<void>
  /** Where focus goes once the palette has closed. Defaults to where it was before. */
  focusTarget?(): HTMLElement | null
}

export interface CommandDeps {
  editor: Editor
  mode: ReturnType<typeof useMode>
  theme: ReturnType<typeof useTheme>
  open(url: string): void
  copy(text: string): Promise<boolean>
  notify(msg: string): void
}

const labelById = new Map<BlockId, string>(content.blocks.map((b) => [b.id, b.label]))

function scrollToBlock(id: BlockId) {
  const reduce =
    typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  document.getElementById('block-' + id)?.scrollIntoView({
    behavior: reduce ? 'auto' : 'smooth',
    block: 'center',
  })
}

/** The block's frame in the editor; its heading in preview, where frames are not focusable. */
function blockFocusTarget(id: BlockId, inEditor: boolean): HTMLElement | null {
  if (inEditor) return document.getElementById('block-' + id)?.closest<HTMLElement>('.blk') ?? null
  const heading = document.getElementById('heading-' + id)
  if (heading && !heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1')
  return heading
}

export function buildCommands(deps: CommandDeps): Command[] {
  const { editor, mode, theme, open, copy, notify } = deps
  const { links } = content
  const email = links.email.replace(/^mailto:/, '')

  const jumps: Command[] = editor.order.value.map((id) => ({
    id: 'jump-' + id,
    label: 'Jump to ' + labelById.get(id),
    group: 'Jump to',
    run() {
      // Preview has no selection; there it only scrolls.
      if (mode.mode.value === 'editor') editor.select(id)
      scrollToBlock(id)
    },
    focusTarget: () => blockFocusTarget(id, mode.mode.value === 'editor'),
  }))

  const link = (id: string, label: string, url: string): Command => ({
    id,
    label,
    group: 'Links',
    run: () => open(url),
  })

  return [
    ...jumps,
    { id: 'toggle-preview', label: 'Toggle preview', group: 'View', run: () => mode.toggle() },
    { id: 'toggle-theme', label: 'Toggle theme', group: 'View', run: () => theme.toggle() },
    link('open-github', 'Open GitHub', links.github),
    link('open-linkedin', 'Open LinkedIn', links.linkedin),
    link('open-bookstagram', 'Open bookstagram', links.bookstagram),
    link('view-source', 'View source', links.source),
    link('open-role', 'See the open role on my team', links.jobPosting),
    {
      id: 'copy-email',
      label: 'Copy email',
      group: 'Links',
      async run() {
        const ok = await copy(email)
        notify(ok ? 'Email copied' : `Couldn't copy — it's ${email}`)
      },
    },
    {
      id: 'reset-page',
      label: 'Reset page',
      group: 'Page',
      run() {
        editor.reset()
        notify('Page reset')
      },
    },
  ]
}

export function filterCommands(cmds: Command[], query: string): Command[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (terms.length === 0) return cmds
  return cmds.filter((c) => {
    const hay = (c.label + ' ' + c.group).toLowerCase()
    return terms.every((t) => hay.includes(t))
  })
}
