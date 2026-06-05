import '@prosekit/basic/style.css'
import '@prosekit/basic/typography.css'
import '../src/style.css'
import './style.css'

import { defineBasicExtension } from '@prosekit/basic'
import { createEditor, union, type NodeJSON } from '@prosekit/core'
import { ProseKit } from '@prosekit/react'
import { useMemo } from 'react'
import { createRoot } from 'react-dom/client'

import { defineReactTooltip, TooltipToolbar } from '../src/react.tsx'

const rootElement = document.querySelector<HTMLDivElement>('#app')
if (!rootElement) {
  throw new Error('Failed to find #app element')
}

const defaultContent: NodeJSON = {
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 1 },
      content: [{ type: 'text', text: 'Tooltip marks' }],
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Select text and click the ' },
        { type: 'text', marks: [{ type: 'code' }], text: 'Tooltip' },
        { type: 'text', text: ' button to attach editable hover text. ' },
        {
          type: 'text',
          marks: [
            {
              type: 'tooltip',
              attrs: {
                id: 'sample-tooltip',
                text: 'This text lives in the tooltip mark attributes.',
              },
            },
          ],
          text: 'Hover this marked text',
        },
        { type: 'text', text: ', then click it to edit the tooltip.' },
      ],
    },
  ],
}

function defineEditorExtension() {
  return union(defineBasicExtension(), defineReactTooltip())
}

function App() {
  const editor = useMemo(() => {
    return createEditor({
      extension: defineEditorExtension(),
      defaultContent,
    })
  }, [])

  return (
    <>
      <header className="hero">
        <p className="eyebrow">prosekit-extension-tooltip</p>
        <h1 className="title">ProseKit Tooltip Extension</h1>
        <p className="subtitle">
          Editable inline tooltip marks with hover previews, selection-anchored creation,
          and popover editing.
        </p>
      </header>

      <main className="card">
        <ProseKit editor={editor}>
          <div className="toolbar">
            <TooltipToolbar />
          </div>
          <div id="editor" ref={editor.mount} />
        </ProseKit>
      </main>

      <footer className="footer">
        <a href="https://prosekit.dev" target="_blank" rel="noreferrer">
          ProseKit
        </a>
        <span className="sep">·</span>
        <a
          href="https://www.npmjs.com/package/prosekit-extension-tooltip"
          target="_blank"
          rel="noreferrer"
        >
          npm
        </a>
        <span className="sep">·</span>
        <a
          href="https://github.com/prosekit/prosekit-extension-tooltip"
          target="_blank"
          rel="noreferrer"
        >
          GitHub
        </a>
      </footer>
    </>
  )
}

createRoot(rootElement).render(<App />)
