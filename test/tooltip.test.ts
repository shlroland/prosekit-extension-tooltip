import { defineBasicExtension } from '@prosekit/basic'
import { union } from '@prosekit/core'
import { createTestEditor } from '@prosekit/core/test'
import { TextSelection } from '@prosekit/pm/state'
import { expect, it } from 'vitest'

import {
  defineTooltip,
  defineTooltipSpec,
  findTooltipRange,
} from '../src/index.ts'

import { getTestContainerDiv } from './utils.ts'

function createTooltipEditor() {
  const extension = union(defineBasicExtension(), defineTooltip())
  return createTestEditor({ extension })
}

function selectText(editor: ReturnType<typeof createTooltipEditor>, from: number, to: number) {
  editor.view.dispatch(
    editor.state.tr.setSelection(TextSelection.create(editor.state.doc, from, to)),
  )
}

it('contains tooltip mark in the ProseMirror schema', () => {
  const editor = createTooltipEditor()
  expect(editor.schema.spec.marks.get('tooltip')).toBeDefined()
})

it('can create a tooltip mark', () => {
  const editor = createTooltipEditor()
  const mark = editor.schema.marks.tooltip.create({
    id: 'tip-1',
    text: 'Tooltip text',
  })

  expect(mark.attrs).toEqual({ id: 'tip-1', text: 'Tooltip text' })
})

it('can reject invalid tooltip mark attributes', () => {
  const editor = createTooltipEditor()

  expect(() => {
    const mark = editor.schema.marks.tooltip.create({
      id: 'tip-1',
      text: 123,
    })
    editor.nodes.doc(editor.nodes.paragraph('Hello')).type.schema.nodeFromJSON({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Hello', marks: [mark.toJSON()] }],
        },
      ],
    }).check()
  }).toThrow()
})

it('can add a tooltip mark to the current selection', () => {
  const editor = createTooltipEditor()
  editor.mount(getTestContainerDiv())
  editor.setContent(editor.nodes.doc(editor.nodes.paragraph('Hello tooltip')))
  selectText(editor, 1, 6)

  editor.commands.addTooltip({ id: 'tip-1', text: 'Greeting' })

  expect(editor.state.doc.toJSON()).toMatchInlineSnapshot(`
    {
      "content": [
        {
          "content": [
            {
              "marks": [
                {
                  "attrs": {
                    "id": "tip-1",
                    "text": "Greeting",
                  },
                  "type": "tooltip",
                },
              ],
              "text": "Hello",
              "type": "text",
            },
            {
              "text": " tooltip",
              "type": "text",
            },
          ],
          "type": "paragraph",
        },
      ],
      "type": "doc",
    }
  `)
})

it('can update a tooltip mark without relying on the current selection', () => {
  const editor = createTooltipEditor()
  editor.mount(getTestContainerDiv())
  const n = editor.nodes

  editor.setContent(
    n.doc(n.paragraph(editor.marks.tooltip({ id: 'tip-1', text: 'Before' }, 'Hello'), ' tooltip')),
  )
  selectText(editor, 7, 14)

  editor.commands.updateTooltip({ id: 'tip-1', text: 'After' })

  const range = findTooltipRange(editor.state.doc, 'tip-1')
  expect(range).toMatchObject({ from: 1, to: 6 })
  expect(range?.mark.attrs).toEqual({ id: 'tip-1', text: 'After' })
})

it('removes a tooltip mark when updated with empty text', () => {
  const editor = createTooltipEditor()
  const n = editor.nodes

  editor.setContent(
    n.doc(n.paragraph(editor.marks.tooltip({ id: 'tip-1', text: 'Before' }, 'Hello'), ' tooltip')),
  )
  editor.commands.updateTooltip({ id: 'tip-1', text: '   ' })

  expect(findTooltipRange(editor.state.doc, 'tip-1')).toBeNull()
})

it('can parse and render tooltip marks as spans', () => {
  const extension = union(defineBasicExtension(), defineTooltipSpec())
  const editor = createTestEditor({ extension })

  editor.setContent(
    '<p><span data-tooltip-id="tip-1" data-tooltip-text="Tooltip text">Hello</span></p>',
  )

  expect(editor.state.doc.toJSON()).toMatchInlineSnapshot(`
    {
      "content": [
        {
          "content": [
            {
              "marks": [
                {
                  "attrs": {
                    "id": "tip-1",
                    "text": "Tooltip text",
                  },
                  "type": "tooltip",
                },
              ],
              "text": "Hello",
              "type": "text",
            },
          ],
          "type": "paragraph",
        },
      ],
      "type": "doc",
    }
  `)
})
