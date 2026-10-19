import { describe, expect, it } from 'vitest'
import { dropIndex, useDragReorder } from '../../src/editor/dnd'

describe('dropIndex', () => {
  it('maps a pointer position to an insert index', () => {
    expect(dropIndex([10, 30, 50], 0)).toBe(0)
    expect(dropIndex([10, 30, 50], 20)).toBe(1)
    expect(dropIndex([10, 30, 50], 999)).toBe(3)
  })
})

function rect(top: number, height: number): DOMRect {
  return { top, bottom: top + height, height } as DOMRect
}

function dragEvent(clientY: number): DragEvent {
  const e = new Event('drag', { cancelable: true }) as unknown as DragEvent
  Object.defineProperty(e, 'clientY', { value: clientY })
  Object.defineProperty(e, 'dataTransfer', { value: null })
  return e
}

describe('useDragReorder', () => {
  const rects = [rect(0, 20), rect(20, 20), rect(40, 20)]
  function setup() {
    const drops: Array<[string, number]> = []
    const dnd = useDragReorder({
      getRects: () => rects,
      indexOf: (id) => ['hero', 'now', 'stack'].indexOf(id),
      onDrop: (id, to) => drops.push([id, to]),
    })
    return { dnd, drops }
  }

  it('converts the insert index to a final index when moving down', () => {
    const { dnd, drops } = setup()
    dnd.onDragStart('hero', dragEvent(5))
    dnd.onDragOver(dragEvent(55))
    expect(dnd.indicatorIndex.value).toBe(3)
    dnd.onDrop(dragEvent(55))
    expect(drops).toEqual([['hero', 2]])
    expect(dnd.indicatorIndex.value).toBeNull()
  })

  it('keeps the insert index when moving up', () => {
    const { dnd, drops } = setup()
    dnd.onDragStart('stack', dragEvent(45))
    dnd.onDrop(dragEvent(2))
    expect(drops).toEqual([['stack', 0]])
  })

  it('dragend without a drop does nothing', () => {
    const { dnd, drops } = setup()
    dnd.onDragStart('now', dragEvent(25))
    dnd.onDragOver(dragEvent(5))
    dnd.onDragEnd()
    expect(drops).toEqual([])
    expect(dnd.indicatorIndex.value).toBeNull()
  })

  it('dropping on itself yields the same final index', () => {
    const { dnd, drops } = setup()
    // Upper half of the dragged item inserts at 1, lower half at 2; both mean "stay".
    dnd.onDragStart('now', dragEvent(25))
    dnd.onDrop(dragEvent(22))
    dnd.onDragStart('now', dragEvent(25))
    dnd.onDrop(dragEvent(38))
    expect(drops).toEqual([
      ['now', 1],
      ['now', 1],
    ])
  })

  it('dropping past the end yields the last index', () => {
    const { dnd, drops } = setup()
    dnd.onDragStart('hero', dragEvent(5))
    dnd.onDrop(dragEvent(999))
    expect(drops).toEqual([['hero', 2]])
  })
})
