import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { isTransfer, levelStations } from '@/data/beijing'

export interface PuzzleState {
  /** 每个位置（用正确站点 id 表示位置）当前放着哪个站 */
  placement: Record<string, string>
  selected: string | null
  moves: number
  hintsLeft: number
  startedAt: number | null
  finishedAt: number | null
  /** 归位即锁定的站点 */
  locked: Set<string>
}

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** 打乱站点，尽量避免一站开局就归位 */
function deal(lineIds: string[]): { placement: Record<string, string>; locked: Set<string> } {
  const all = levelStations(lineIds)
  const movable = all.filter((s) => !isTransfer(s, lineIds))
  let names = shuffled(movable)
  // 简单修正：把碰巧归位的与下一个交换
  for (let i = 0; i < movable.length; i++) {
    if (names[i] === movable[i]) {
      const j = (i + 1) % movable.length
      ;[names[i], names[j]] = [names[j], names[i]]
    }
  }
  const placement: Record<string, string> = {}
  movable.forEach((pos, i) => (placement[pos] = names[i]))
  // 换乘站预置为锚点
  const locked = new Set<string>()
  for (const s of all) {
    if (isTransfer(s, lineIds)) {
      placement[s] = s
      locked.add(s)
    }
  }
  return { placement, locked }
}

export function usePuzzleGame(lineIds: string[], hintCount: number) {
  const [state, setState] = useState<PuzzleState>(() => {
    const { placement, locked } = deal(lineIds)
    return {
      placement,
      selected: null,
      moves: 0,
      hintsLeft: hintCount,
      startedAt: null,
      finishedAt: null,
      locked,
    }
  })
  const [now, setNow] = useState(Date.now())
  const timerRef = useRef<number | null>(null)

  const total = useMemo(
    () => levelStations(lineIds).filter((s) => !isTransfer(s, lineIds)).length,
    [lineIds],
  )
  const correctCount = useMemo(
    () =>
      Object.entries(state.placement).filter(([pos, s]) => pos === s).length -
      state.locked.size,
    [state.placement, state.locked],
  )
  const won = correctCount >= total

  // 计时
  useEffect(() => {
    if (state.startedAt && !state.finishedAt) {
      timerRef.current = window.setInterval(() => setNow(Date.now()), 500)
      return () => {
        if (timerRef.current) window.clearInterval(timerRef.current)
      }
    }
  }, [state.startedAt, state.finishedAt])

  // 胜利结算
  useEffect(() => {
    if (won && !state.finishedAt && state.startedAt) {
      setState((s) => ({ ...s, finishedAt: Date.now(), selected: null }))
    }
  }, [won, state.finishedAt, state.startedAt])

  const elapsed = state.startedAt
    ? Math.floor(((state.finishedAt ?? now) - state.startedAt) / 1000)
    : 0

  const clickStation = useCallback(
    (posId: string) => {
      setState((s) => {
        if (s.finishedAt) return s
        if (s.locked.has(posId)) return { ...s, selected: null }
        const startedAt = s.startedAt ?? Date.now()
        if (!s.selected) return { ...s, selected: posId, startedAt }
        if (s.selected === posId) return { ...s, selected: null, startedAt }

        const a = s.selected
        const placement = { ...s.placement }
        ;[placement[a], placement[posId]] = [placement[posId], placement[a]]

        // 交换后检查归位锁定
        const locked = new Set(s.locked)
        for (const p of [a, posId]) {
          if (placement[p] === p) locked.add(p)
        }
        return { ...s, placement, locked, selected: null, moves: s.moves + 1, startedAt }
      })
    },
    [],
  )

  const useHint = useCallback(() => {
    setState((s) => {
      if (s.finishedAt || s.hintsLeft <= 0) return s
      const wrong = Object.keys(s.placement).filter(
        (p) => s.placement[p] !== p && !s.locked.has(p),
      )
      if (wrong.length === 0) return s
      const target = wrong[Math.floor(Math.random() * wrong.length)]
      // 找到当前占着 target 正确站名的位置，交换
      const correctName = target
      const holder = Object.keys(s.placement).find(
        (p) => s.placement[p] === correctName,
      )
      const placement = { ...s.placement }
      if (holder && holder !== target) {
        placement[holder] = placement[target]
        placement[target] = correctName
      } else {
        placement[target] = correctName
      }
      const locked = new Set(s.locked)
      locked.add(target)
      if (holder && placement[holder] === holder) locked.add(holder)
      return {
        ...s,
        placement,
        locked,
        selected: null,
        hintsLeft: s.hintsLeft - 1,
        startedAt: s.startedAt ?? Date.now(),
      }
    })
  }, [])

  const restart = useCallback(() => {
    const { placement, locked } = deal(lineIds)
    setState({
      placement,
      selected: null,
      moves: 0,
      hintsLeft: hintCount,
      startedAt: null,
      finishedAt: null,
      locked,
    })
  }, [lineIds, hintCount])

  return {
    state,
    total,
    correctCount,
    won,
    elapsed,
    clickStation,
    useHint,
    restart,
  }
}
