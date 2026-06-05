import { union, type Editor } from '@prosekit/core'
import type { ReactMarkViewProps } from '@prosekit/react'
import {
  defineReactMarkView,
  useEditor,
  useEditorDerivedValue,
} from '@prosekit/react'
import {
  InlinePopoverPopup,
  InlinePopoverPositioner,
  InlinePopoverRoot,
  type InlinePopoverRootProps,
} from '@prosekit/react/inline-popover'
import {
  PopoverPopup,
  PopoverPositioner,
  PopoverRoot,
  PopoverTrigger,
} from '@prosekit/react/popover'
import {
  TooltipPopup,
  TooltipPositioner,
  TooltipRoot,
  TooltipTrigger,
} from '@prosekit/react/tooltip'
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
  type ReactNode,
} from 'react'

import {
  defineTooltip,
  type TooltipAttrs,
  type UpdateTooltipOptions,
} from './index.ts'

export function defineReactTooltip() {
  return union(
    defineTooltip(),
    defineReactMarkView({
      name: 'tooltip',
      component: TooltipMarkView,
    }),
  )
}

function createTooltipId(): string {
  return `tooltip-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

function getToolbarState(editor: Editor<ReturnType<typeof defineReactTooltip>>) {
  const { selection } = editor.state

  return {
    canAddTooltip: editor.commands.addTooltip.canExec({
      id: 'can-add-tooltip',
      text: 'Tooltip',
    }),
    selectionKey: selection.empty ? '' : `${selection.from}:${selection.to}`,
  }
}

export function TooltipToolbar() {
  const editor = useEditor<ReturnType<typeof defineReactTooltip>>()
  const { canAddTooltip, selectionKey } = useEditorDerivedValue(getToolbarState)
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [anchorSelectionKey, setAnchorSelectionKey] = useState('')

  useEffect(() => {
    if (open && selectionKey !== anchorSelectionKey) {
      setOpen(false)
      setText('')
      setAnchorSelectionKey('')
    }
  }, [anchorSelectionKey, open, selectionKey])

  const handleOpenChange: NonNullable<InlinePopoverRootProps['onOpenChange']> = (event) => {
    setOpen(event.detail)
    if (!event.detail) {
      setText('')
      setAnchorSelectionKey('')
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextText = text.trim()
    if (!nextText) return

    editor.commands.addTooltip({ id: createTooltipId(), text: nextText })
    setOpen(false)
    setText('')
    editor.focus()
  }

  const handleCancel = () => {
    setOpen(false)
    setText('')
    setAnchorSelectionKey('')
    editor.focus()
  }

  return (
    <>
      <button
        type="button"
        className="prosekit-tooltip-button"
        disabled={!canAddTooltip}
        aria-pressed={open}
        onClick={() => {
          setAnchorSelectionKey(selectionKey)
          setOpen(true)
        }}
      >
        Tooltip
      </button>
      <InlinePopoverRoot
        data-testid="tooltip-input"
        defaultOpen={false}
        open={open}
        onOpenChange={handleOpenChange}
      >
        <InlinePopoverPositioner placement="bottom">
          <InlinePopoverCard>
            <TooltipForm
              id="tooltip-toolbar-input"
              label="Tooltip text"
              value={text}
              submitLabel="Add tooltip"
              onChange={setText}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              autoFocus
            />
          </InlinePopoverCard>
        </InlinePopoverPositioner>
      </InlinePopoverRoot>
    </>
  )
}

function TooltipMarkView(props: ReactMarkViewProps) {
  const editor = useEditor<ReturnType<typeof defineReactTooltip>>()
  const attrs = props.mark.attrs as TooltipAttrs
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(attrs.text)
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current)
      }
    }
  }, [])

  const cancelPendingReset = () => {
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current)
      resetTimerRef.current = null
    }
  }

  const resetAfterClose = () => {
    cancelPendingReset()
    resetTimerRef.current = setTimeout(() => {
      setEditing(false)
      setText(attrs.text)
      resetTimerRef.current = null
    }, 200)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const options: UpdateTooltipOptions = { id: attrs.id, text }
    editor.commands.updateTooltip(options)
    setOpen(false)
    resetAfterClose()
    editor.focus()
  }

  return (
    <PopoverRoot
      open={open}
      onOpenChange={(event) => {
        if (event.detail) {
          cancelPendingReset()
        }
        setOpen(event.detail)
        if (!event.detail) {
          resetAfterClose()
        }
      }}
    >
      <PopoverTrigger>
        <TooltipRoot>
          <TooltipTrigger>
            <span
              ref={props.contentRef}
              data-tooltip-id={attrs.id}
              className="prosekit-tooltip-mark"
            />
          </TooltipTrigger>
          <TooltipPositioner placement="top">
            <TooltipPopup>{attrs.text}</TooltipPopup>
          </TooltipPositioner>
        </TooltipRoot>
      </PopoverTrigger>
      <PopoverPositioner placement="bottom">
        <PopoverCard>
          {editing ? (
            <TooltipForm
              id={`tooltip-input-${attrs.id}`}
              label="Tooltip text"
              value={text}
              submitLabel="Save tooltip"
              onChange={setText}
              onSubmit={handleSubmit}
            />
          ) : (
            <div className="prosekit-tooltip-preview-row">
              <div>{attrs.text}</div>
              <button
                type="button"
                aria-label="Edit tooltip"
                className="prosekit-tooltip-icon-button"
                onClick={() => {
                  setText(attrs.text)
                  setEditing(true)
                }}
              >
                <PencilIcon />
              </button>
            </div>
          )}
        </PopoverCard>
      </PopoverPositioner>
    </PopoverRoot>
  )
}

function TooltipForm(props: {
  id: string
  label: string
  value: string
  submitLabel: string
  autoFocus?: boolean
  onChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel?: () => void
}) {
  return (
    <form onSubmit={props.onSubmit} className="prosekit-tooltip-form">
      <label htmlFor={props.id}>{props.label}</label>
      <input
        id={props.id}
        autoFocus={props.autoFocus}
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
        className="prosekit-tooltip-input"
        placeholder="Enter tooltip text..."
      />
      <div className="prosekit-tooltip-actions">
        <button type="submit" className="prosekit-tooltip-button">
          {props.submitLabel}
        </button>
        {props.onCancel ? (
          <button
            type="button"
            className="prosekit-tooltip-button"
            onClick={props.onCancel}
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  )
}

function InlinePopoverCard(props: { children: ReactNode }) {
  const stopEditorMouseEvent = (event: MouseEvent) => {
    event.stopPropagation()
  }

  return (
    <InlinePopoverPopup
      contentEditable={false}
      className="prosekit-tooltip-card"
      onMouseDown={stopEditorMouseEvent}
      onMouseMove={stopEditorMouseEvent}
      onMouseUp={stopEditorMouseEvent}
      onClick={(event) => event.stopPropagation()}
      onDoubleClick={(event) => event.stopPropagation()}
    >
      {props.children}
    </InlinePopoverPopup>
  )
}

function PopoverCard(props: { children: ReactNode }) {
  const stopEditorMouseEvent = (event: MouseEvent) => {
    event.stopPropagation()
  }

  return (
    <PopoverPopup
      contentEditable={false}
      className="prosekit-tooltip-card"
      onMouseDown={stopEditorMouseEvent}
      onMouseMove={stopEditorMouseEvent}
      onMouseUp={stopEditorMouseEvent}
      onClick={(event) => event.stopPropagation()}
      onDoubleClick={(event) => event.stopPropagation()}
    >
      {props.children}
    </PopoverPopup>
  )
}

function PencilIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="prosekit-tooltip-icon"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  )
}
