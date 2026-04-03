import { describe, it, expect } from 'vitest'
import {
  calculateStreakMultiplier,
  calculateNutsEarned,
  getReasonLabel,
  NUT_REWARDS,
} from './gamification'

describe('calculateStreakMultiplier', () => {
  it('returns 1.0 for no streak', () => {
    expect(calculateStreakMultiplier(0)).toBe(1.0)
  })

  it('returns 1.0 for streaks under 7 days', () => {
    expect(calculateStreakMultiplier(1)).toBe(1.0)
    expect(calculateStreakMultiplier(6)).toBe(1.0)
  })

  it('returns 1.5 for 7-13 day streaks', () => {
    expect(calculateStreakMultiplier(7)).toBe(1.5)
    expect(calculateStreakMultiplier(10)).toBe(1.5)
    expect(calculateStreakMultiplier(13)).toBe(1.5)
  })

  it('returns 2.0 for 14-29 day streaks', () => {
    expect(calculateStreakMultiplier(14)).toBe(2.0)
    expect(calculateStreakMultiplier(20)).toBe(2.0)
    expect(calculateStreakMultiplier(29)).toBe(2.0)
  })

  it('returns 3.0 for 30+ day streaks (legendary)', () => {
    expect(calculateStreakMultiplier(30)).toBe(3.0)
    expect(calculateStreakMultiplier(100)).toBe(3.0)
    expect(calculateStreakMultiplier(365)).toBe(3.0)
  })
})

describe('calculateNutsEarned', () => {
  it('returns base amount with no streak', () => {
    const result = calculateNutsEarned(5, 0)
    expect(result.nuts).toBe(5)
    expect(result.multiplier).toBe(1.0)
  })

  it('applies 1.5x multiplier at 7-day streak', () => {
    const result = calculateNutsEarned(5, 7)
    expect(result.nuts).toBe(7) // floor(5 * 1.5) = 7
    expect(result.multiplier).toBe(1.5)
  })

  it('applies 2x multiplier at 14-day streak', () => {
    const result = calculateNutsEarned(5, 14)
    expect(result.nuts).toBe(10)
    expect(result.multiplier).toBe(2.0)
  })

  it('applies 3x multiplier at 30-day streak', () => {
    const result = calculateNutsEarned(5, 30)
    expect(result.nuts).toBe(15)
    expect(result.multiplier).toBe(3.0)
  })

  it('floors fractional nut amounts', () => {
    const result = calculateNutsEarned(3, 7) // 3 * 1.5 = 4.5
    expect(result.nuts).toBe(4)
  })
})

describe('NUT_REWARDS', () => {
  it('has correct task creation reward', () => {
    expect(NUT_REWARDS.TASK_CREATE).toBe(1)
  })

  it('scales task completion by priority', () => {
    expect(NUT_REWARDS.TASK_COMPLETE[1]).toBe(3) // someday
    expect(NUT_REWARDS.TASK_COMPLETE[2]).toBe(4) // low
    expect(NUT_REWARDS.TASK_COMPLETE[3]).toBe(5) // medium
    expect(NUT_REWARDS.TASK_COMPLETE[4]).toBe(6) // high
    expect(NUT_REWARDS.TASK_COMPLETE[5]).toBe(8) // critical
  })

  it('has correct timer session reward', () => {
    expect(NUT_REWARDS.TIMER_SESSION).toBe(2)
  })

  it('has correct comeback bonus', () => {
    expect(NUT_REWARDS.COMEBACK_BONUS).toBe(5)
  })
})

describe('getReasonLabel', () => {
  it('returns human-readable labels for all reasons', () => {
    expect(getReasonLabel('task_complete')).toBe('Task completed')
    expect(getReasonLabel('task_create')).toBe('Task created')
    expect(getReasonLabel('subtask_complete')).toBe('Subtask completed')
    expect(getReasonLabel('timer_session')).toBe('Timer session')
    expect(getReasonLabel('purchase')).toBe('Skin purchase')
    expect(getReasonLabel('comeback')).toBe('Comeback challenge')
    expect(getReasonLabel('bonus')).toBe('Bonus')
  })
})
