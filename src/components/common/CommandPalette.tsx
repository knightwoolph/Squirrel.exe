import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  Clock,
  Brain,
  Users,
  DollarSign,
  TreePine,
  Settings,
  Search,
  Plus,
  Timer,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useAppStore } from '../../stores/appStore'
import { useTaskStore } from '../../stores/taskStore'

interface CommandItem {
  id: string
  label: string
  icon: React.ReactNode
  shortcut?: string
  action: () => void
  category: string
}

export function CommandPalette() {
  const { commandPaletteOpen, closeCommandPalette, openQuickStash } = useAppStore()
  const { openTaskForm } = useTaskStore()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const commands: CommandItem[] = [
    // Navigation
    { id: 'nav-dashboard', label: 'Go to Dashboard', icon: <LayoutDashboard className="h-4 w-4" />, action: () => navigate('/'), category: 'Navigation' },
    { id: 'nav-tasks', label: 'Go to Tasks', icon: <CheckSquare className="h-4 w-4" />, action: () => navigate('/tasks'), category: 'Navigation' },
    { id: 'nav-projects', label: 'Go to Projects', icon: <FolderKanban className="h-4 w-4" />, action: () => navigate('/projects'), category: 'Navigation' },
    { id: 'nav-timer', label: 'Go to Timer', icon: <Clock className="h-4 w-4" />, action: () => navigate('/timer'), category: 'Navigation' },
    { id: 'nav-stash', label: 'Go to Brain Dump', icon: <Brain className="h-4 w-4" />, action: () => navigate('/stash'), category: 'Navigation' },
    { id: 'nav-contacts', label: 'Go to Contacts', icon: <Users className="h-4 w-4" />, action: () => navigate('/contacts'), category: 'Navigation' },
    { id: 'nav-deals', label: 'Go to Deals', icon: <DollarSign className="h-4 w-4" />, action: () => navigate('/deals'), category: 'Navigation' },
    { id: 'nav-victory', label: 'Go to Victory Oak', icon: <TreePine className="h-4 w-4" />, action: () => navigate('/victory-oak'), category: 'Navigation' },
    { id: 'nav-settings', label: 'Go to Settings', icon: <Settings className="h-4 w-4" />, action: () => navigate('/settings'), category: 'Navigation' },
    // Actions
    { id: 'act-newtask', label: 'Create New Task', icon: <Plus className="h-4 w-4" />, shortcut: 'N', action: () => openTaskForm(), category: 'Actions' },
    { id: 'act-braindump', label: 'Quick Brain Dump', icon: <Brain className="h-4 w-4" />, shortcut: 'Ctrl+Shift+S', action: () => openQuickStash(), category: 'Actions' },
    { id: 'act-timer', label: 'Start Focus Timer', icon: <Timer className="h-4 w-4" />, action: () => navigate('/timer'), category: 'Actions' },
  ]

  const filtered = query
    ? commands.filter((cmd) =>
        cmd.label.toLowerCase().includes(query.toLowerCase())
      )
    : commands

  const handleSelect = useCallback((item: CommandItem) => {
    item.action()
    closeCommandPalette()
    setQuery('')
    setSelectedIndex(0)
  }, [closeCommandPalette])

  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [commandPaletteOpen])

  useEffect(() => {
    if (!commandPaletteOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => Math.max(prev - 1, 0))
      } else if (e.key === 'Enter' && filtered[selectedIndex]) {
        e.preventDefault()
        handleSelect(filtered[selectedIndex])
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [commandPaletteOpen, selectedIndex, filtered, handleSelect])

  if (!commandPaletteOpen) return null

  // Group by category
  const grouped = filtered.reduce<Record<string, CommandItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {})

  let flatIndex = 0

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-modal-backdrop bg-black/50 backdrop-blur-sm"
        onClick={closeCommandPalette}
      />

      {/* Palette */}
      <div className="fixed inset-x-0 top-[20%] z-modal mx-auto w-full max-w-lg animate-scale-in">
        <div className="overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-xl">
          {/* Search input */}
          <div className="flex items-center gap-3 border-b border-[var(--border-subtle)] px-4 py-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Type a command or search..."
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setSelectedIndex(0)
              }}
            />
            <kbd className="rounded border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-1.5 py-0.5 text-[10px] text-muted-foreground">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-80 overflow-y-auto py-2">
            {filtered.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                No results found
              </p>
            ) : (
              Object.entries(grouped).map(([category, items]) => (
                <div key={category}>
                  <p className="px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {category}
                  </p>
                  {items.map((item) => {
                    const idx = flatIndex++
                    return (
                      <button
                        key={item.id}
                        className={cn(
                          'flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors',
                          idx === selectedIndex
                            ? 'bg-primary/10 text-primary'
                            : 'text-foreground hover:bg-[var(--bg-tertiary)]'
                        )}
                        onClick={() => handleSelect(item)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                      >
                        <span className="flex-shrink-0 text-muted-foreground">{item.icon}</span>
                        <span className="flex-1 text-left">{item.label}</span>
                        {item.shortcut && (
                          <kbd className="rounded border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-1.5 py-0.5 text-[10px] text-muted-foreground">
                            {item.shortcut}
                          </kbd>
                        )}
                      </button>
                    )
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  )
}
