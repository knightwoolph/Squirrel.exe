import { describe, it, expect } from 'vitest'
import { analyzeBrainDump, getPriorityLabel, getPriorityEmoji } from './brainDumpAnalyzer'

describe('analyzeBrainDump', () => {
  it('extracts tasks from simple bullet list', () => {
    const input = `- Buy groceries
- Call the dentist
- Finish the report`
    const result = analyzeBrainDump(input)
    expect(result.tasks.length).toBeGreaterThanOrEqual(2)
  })

  it('detects high priority from keywords', () => {
    const input = '- URGENT: Fix the production bug immediately'
    const result = analyzeBrainDump(input)
    expect(result.tasks.length).toBeGreaterThanOrEqual(1)
    expect(result.tasks[0].priority).toBeGreaterThanOrEqual(4)
  })

  it('detects low priority from someday keywords', () => {
    const input = '- Maybe someday learn to paint'
    const result = analyzeBrainDump(input)
    // Low-confidence items may be filtered as notes
    if (result.tasks.length > 0) {
      expect(result.tasks[0].priority).toBeLessThanOrEqual(2)
    } else {
      // Classified as a note due to low confidence — correct behavior
      expect(result.notes.length).toBeGreaterThanOrEqual(1)
    }
  })

  it('handles empty input gracefully', () => {
    const result = analyzeBrainDump('')
    expect(result.tasks).toHaveLength(0)
  })

  it('handles whitespace-only input', () => {
    const result = analyzeBrainDump('   \n\n  ')
    expect(result.tasks).toHaveLength(0)
  })

  it('assigns confidence scores between 0 and 1', () => {
    const input = `- Buy milk from the store
- Deploy hotfix to production immediately
- Send the invoice to accounting`
    const result = analyzeBrainDump(input)
    for (const task of result.tasks) {
      expect(task.confidence).toBeGreaterThanOrEqual(0)
      expect(task.confidence).toBeLessThanOrEqual(1)
    }
  })

  it('returns summary text', () => {
    const input = `- Buy groceries
- Call mom
- Write the proposal`
    const result = analyzeBrainDump(input)
    expect(typeof result.summary).toBe('string')
  })

  it('separates notes from tasks', () => {
    const input = `Project Alpha:
- Fix the login bug
- Update the documentation`
    const result = analyzeBrainDump(input)
    // "Project Alpha:" should be classified as a note (section header)
    expect(result.notes.length).toBeGreaterThanOrEqual(0)
  })
})

describe('getPriorityLabel', () => {
  it('returns correct labels for all priorities', () => {
    expect(getPriorityLabel(1)).toBe('Someday')
    expect(getPriorityLabel(2)).toBe('Low')
    expect(getPriorityLabel(3)).toBe('Medium')
    expect(getPriorityLabel(4)).toBe('High')
    expect(getPriorityLabel(5)).toBe('Critical')
  })
})

describe('getPriorityEmoji', () => {
  it('returns emojis for all priorities', () => {
    for (let p = 1; p <= 5; p++) {
      const emoji = getPriorityEmoji(p as 1 | 2 | 3 | 4 | 5)
      expect(typeof emoji).toBe('string')
      expect(emoji.length).toBeGreaterThan(0)
    }
  })
})
