# prosekit-extension-tooltip

Editable tooltip marks for [ProseKit](https://prosekit.dev).

This package provides a `tooltip` mark that stores a tooltip `id` and `text` in
mark attributes. The core extension includes typed commands for adding,
updating, and removing tooltip marks. The React entry adds a mark view and a
toolbar button for a complete editing flow.

## Installation

```bash
pnpm add prosekit-extension-tooltip
```

## Core Usage

```ts
import { defineBasicExtension } from '@prosekit/basic'
import { union } from '@prosekit/core'
import { defineTooltip } from 'prosekit-extension-tooltip'

const extension = union(defineBasicExtension(), defineTooltip())
```

Available commands:

```ts
editor.commands.addTooltip({ id: 'tip-1', text: 'Tooltip text' })
editor.commands.updateTooltip({ id: 'tip-1', text: 'Updated text' })
editor.commands.removeTooltip('tip-1')
```

## React Usage

```tsx
import 'prosekit-extension-tooltip/style.css'

import { defineBasicExtension } from '@prosekit/basic'
import { createEditor, union } from '@prosekit/core'
import { ProseKit } from '@prosekit/react'
import {
  defineReactTooltip,
  TooltipToolbar,
} from 'prosekit-extension-tooltip/react'

const extension = union(defineBasicExtension(), defineReactTooltip())
const editor = createEditor({ extension })

export function Editor() {
  return (
    <ProseKit editor={editor}>
      <TooltipToolbar />
      <div ref={editor.mount} />
    </ProseKit>
  )
}
```

React behavior:

- Select text and click `Tooltip` to open an input next to the selection.
- The input has submit and cancel controls.
- If the editor selection changes while the input is open, the input closes.
- Hover a tooltip mark to preview text.
- Click a tooltip mark to open a popover with the text and an edit icon.
- Editing updates by tooltip `id`, not by the current editor selection.

## Development

```bash
pnpm install
pnpm dev
pnpm typecheck
pnpm test
pnpm build
```

The demo website runs at `http://localhost:5173`.

## License

MIT
