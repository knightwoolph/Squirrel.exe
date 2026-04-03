import { useState, useRef, useEffect } from 'react'
import { Brain, Zap } from 'lucide-react'
import { Button } from '../ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog'
import { Textarea } from '../ui/textarea'
import { useAppStore } from '../../stores/appStore'
import { useStashStore } from '../../stores/stashStore'

export function QuickStash() {
  const { quickStashOpen, closeQuickStash } = useAppStore()
  const { addStashItem } = useStashStore()
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (quickStashOpen) {
      setContent('')
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }, [quickStashOpen])

  const handleSave = async () => {
    if (!content.trim()) return
    setSaving(true)
    try {
      await addStashItem(content.trim())
      setContent('')
      closeQuickStash()
    } finally {
      setSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    }
  }

  return (
    <Dialog open={quickStashOpen} onOpenChange={(open) => !open && closeQuickStash()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Quick Brain Dump
          </DialogTitle>
          <DialogDescription>
            Capture your thought before it escapes. You can organize it later.
          </DialogDescription>
        </DialogHeader>

        <Textarea
          ref={textareaRef}
          placeholder="What's on your mind? Tasks, ideas, reminders..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          className="min-h-[120px] resize-none"
        />

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Ctrl+Enter to save
          </span>
          <Button
            onClick={handleSave}
            disabled={!content.trim() || saving}
            size="sm"
          >
            <Zap className="mr-1.5 h-3.5 w-3.5" />
            {saving ? 'Saving...' : 'Stash It'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
