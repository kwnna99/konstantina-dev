import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { buildCommands, filterCommands, type CommandDeps } from '../../src/editor/commands'
import { createEditor } from '../../src/editor/store'

function fakeDeps(over: Partial<CommandDeps> = {}): CommandDeps {
  return {
    editor: createEditor(),
    mode: { mode: ref('editor'), isNarrow: ref(false), setMode: vi.fn(), toggle: vi.fn() },
    theme: { theme: ref('light'), toggle: vi.fn() },
    open: vi.fn(),
    copy: vi.fn(async () => true),
    notify: vi.fn(),
    ...over,
  } as CommandDeps
}

describe('commands', () => {
  it('filters by all terms, case-insensitive', () => {
    const c = buildCommands(fakeDeps())
    expect(filterCommands(c, 'jump CAR').map((x) => x.label)).toEqual(['Jump to Career'])
    expect(filterCommands(c, '').length).toBe(c.length)
    expect(filterCommands(c, 'zzz')).toEqual([])
  })

  it('jump commands follow current order', () => {
    const deps = fakeDeps()
    deps.editor.move('contact', 0)
    const jumps = buildCommands(deps).filter((c) => c.group === 'Jump to')
    expect(jumps[0]!.label).toBe('Jump to Contact')
  })

  it('jump selects in editor mode but not in preview', () => {
    const deps = fakeDeps()
    buildCommands(deps).find((c) => c.label === 'Jump to Contact')!.run()
    expect(deps.editor.selected.value).toBe('contact')
    const pv = fakeDeps({ mode: { mode: ref('preview'), isNarrow: ref(false), setMode: vi.fn(), toggle: vi.fn() } })
    buildCommands(pv).find((c) => c.label === 'Jump to Contact')!.run()
    expect(pv.editor.selected.value).toBeNull()
  })

  it('copy email copies the bare address and confirms', async () => {
    const deps = fakeDeps()
    await buildCommands(deps).find((c) => c.label === 'Copy email')!.run()
    expect(deps.copy).toHaveBeenCalledWith('konstantinaroumelioti@gmail.com')
    expect(deps.notify).toHaveBeenCalledWith('Email copied')
  })

  it('copy email reports failure with the address', async () => {
    const deps = fakeDeps({ copy: vi.fn(async () => false) })
    await buildCommands(deps).find((c) => c.label === 'Copy email')!.run()
    expect(vi.mocked(deps.notify).mock.calls[0]![0]).toContain('konstantinaroumelioti@gmail.com')
  })

  it('reset page resets the editor and notifies', () => {
    const deps = fakeDeps()
    deps.editor.move('contact', 0)
    buildCommands(deps).find((c) => c.label === 'Reset page')!.run()
    expect(deps.editor.isDirty.value).toBe(false)
    expect(deps.notify).toHaveBeenCalledWith('Page reset')
  })

  it('link commands open the right urls; toggles delegate', () => {
    const deps = fakeDeps()
    const c = buildCommands(deps)
    c.find((x) => x.label === 'Open GitHub')!.run()
    expect(deps.open).toHaveBeenCalledWith('https://github.com/kwnna99')
    c.find((x) => x.label === 'Toggle theme')!.run()
    expect(deps.theme.toggle).toHaveBeenCalled()
    c.find((x) => x.label === 'Toggle preview')!.run()
    expect(deps.mode.toggle).toHaveBeenCalled()
  })
})
