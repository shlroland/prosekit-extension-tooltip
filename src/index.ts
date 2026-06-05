import {
  addMark,
  defineCommands,
  defineMarkSpec,
  union,
  type Extension,
} from '@prosekit/core'
import type { Mark, Node } from '@prosekit/pm/model'
import type { Command } from '@prosekit/pm/state'

export interface TooltipAttrs {
  id: string
  text: string
}

export interface AddTooltipOptions {
  id: string
  text: string
}

export interface UpdateTooltipOptions {
  id: string
  text: string
}

type TooltipRange = {
  from: number
  to: number
  mark: Mark
}

export function defineTooltipSpec(): Extension<{
  Marks: { tooltip: TooltipAttrs }
}> {
  return defineMarkSpec<'tooltip', TooltipAttrs>({
    name: 'tooltip',
    inclusive: false,
    attrs: {
      id: { validate: 'string' },
      text: { validate: 'string' },
    },
    parseDOM: [
      {
        tag: 'span[data-tooltip-id]',
        getAttrs: (element) => ({
          id: element.getAttribute('data-tooltip-id') || '',
          text: element.getAttribute('data-tooltip-text') || '',
        }),
      },
    ],
    toDOM(mark) {
      const attrs = mark.attrs as TooltipAttrs
      return [
        'span',
        {
          'data-tooltip-id': attrs.id,
          'data-tooltip-text': attrs.text,
        },
        0,
      ]
    },
  })
}

export function defineTooltipCommands(): Extension<{
  Commands: {
    addTooltip: [options: AddTooltipOptions]
    updateTooltip: [options: UpdateTooltipOptions]
    removeTooltip: [id: string]
  }
}> {
  return defineCommands({
    addTooltip: (options: AddTooltipOptions) => addTooltipMark(options),
    updateTooltip: (options: UpdateTooltipOptions) => updateTooltipMark(options),
    removeTooltip: (id: string) => removeTooltipMark(id),
  })
}

export function defineTooltip() {
  return union(defineTooltipSpec(), defineTooltipCommands())
}

function addTooltipMark(options: AddTooltipOptions): Command {
  return (state, dispatch, view) => {
    const text = options.text.trim()
    if (state.selection.empty || !text) return false

    return addMark({
      type: 'tooltip',
      attrs: { id: options.id, text },
    })(state, dispatch, view)
  }
}

function updateTooltipMark(options: UpdateTooltipOptions): Command {
  return (state, dispatch) => {
    const text = options.text.trim()
    const range = findTooltipRange(state.doc, options.id)
    if (!range) return false

    if (!text) {
      dispatch?.(state.tr.removeMark(range.from, range.to, range.mark))
      return true
    }

    const markType = state.schema.marks.tooltip
    const tr = state.tr
      .removeMark(range.from, range.to, range.mark)
      .addMark(range.from, range.to, markType.create({ id: options.id, text }))

    dispatch?.(tr)
    return true
  }
}

function removeTooltipMark(id: string): Command {
  return (state, dispatch) => {
    const range = findTooltipRange(state.doc, id)
    if (!range) return false

    dispatch?.(state.tr.removeMark(range.from, range.to, range.mark))
    return true
  }
}

export function findTooltipRange(doc: Node, id: string): TooltipRange | null {
  let range: TooltipRange | null = null

  doc.descendants((node, pos) => {
    if (!node.isText) return

    const mark = node.marks.find((mark) => {
      return mark.type.name === 'tooltip' && (mark.attrs as TooltipAttrs).id === id
    })
    if (!mark) return

    if (!range) {
      range = { from: pos, to: pos + node.nodeSize, mark }
      return
    }

    range.to = pos + node.nodeSize
  })

  return range
}
