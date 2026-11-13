import { useEffect, useMemo, useState } from 'react'
import { LEVELS, LINES } from '@/data/beijing'
import { usePuzzleGame } from '@/hooks/usePuzzleGame'
import MetroBoard from '@/components/MetroBoard'

interface Best {
  moves: number
  seconds: number
}

function fmt(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function starsOf(moves: number, total: number, hintsLeft: number, hintCount: number) {
  const noHint = hintsLeft === hintCount
  if (moves <= total * 0.9 && noHint) return 3
  if (moves <= total * 1.5) return 2
  return 1
}

export default function Home() {
  const [levelIdx, setLevelIdx] = useState(0)
  const [hardMode, setHardMode] = useState(false)
  const level = LEVELS[levelIdx]

  const {
    state,
    total,
    correctCount,
    won,
    elapsed,
    clickStation,
    useHint,
    restart,
  } = usePuzzleGame(level.lineIds, level.hints)

  const [best, setBest] = useState<Best | null>(null)

  // 切换关卡时重新发牌
  useEffect(() => {
    restart()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level.id])

  useEffect(() => {
    const raw = localStorage.getItem(`metro-puzzle-best-${level.id}`)
    setBest(raw ? (JSON.parse(raw) as Best) : null)
  }, [level.id])

  useEffect(() => {
    if (won) {
      const cur: Best = { moves: state.moves, seconds: elapsed }
      const raw = localStorage.getItem(`metro-puzzle-best-${level.id}`)
      const prev: Best | null = raw ? JSON.parse(raw) : null
      if (!prev || cur.moves < prev.moves) {
        localStorage.setItem(`metro-puzzle-best-${level.id}`, JSON.stringify(cur))
        setBest(cur)
      }
    }
  }, [won]) // eslint-disable-line react-hooks/exhaustive-deps

  const levelLines = useMemo(
    () => LINES.filter((l) => level.lineIds.includes(l.id)),
    [level],
  )

  const stars = starsOf(state.moves, total, state.hintsLeft, level.hints)

  return (
    <div className="flex h-screen flex-col bg-[#0a0f1a] text-slate-100">
      {/* 顶栏 */}
      <header className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-slate-800 px-5 py-3">
        <div>
          <h1 className="text-xl font-black tracking-wide">
            🚇 地铁拼图师 <span className="text-sm font-normal text-slate-400">Metro Puzzle · 北京</span>
          </h1>
        </div>

        <nav className="flex gap-1.5">
          {LEVELS.map((lv, i) => (
            <button
              key={lv.id}
              onClick={() => setLevelIdx(i)}
              className={`rounded-lg px-3 py-1.5 text-sm transition ${
                i === levelIdx
                  ? 'bg-amber-500 font-bold text-slate-900'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {lv.title}
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {levelLines.map((l) => (
            <span
              key={l.id}
              className="rounded-full px-2.5 py-0.5 text-xs font-bold text-white"
              style={{ backgroundColor: l.color }}
            >
              {l.name}
            </span>
          ))}
        </div>
      </header>

      {/* 状态栏 */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-slate-800/60 px-5 py-2 text-sm">
        <span className="text-slate-400">{level.subtitle}</span>
        <span>
          进度 <b className="text-emerald-400">{correctCount}</b>
          <span className="text-slate-500"> / {total}</span>
        </span>
        <span>
          步数 <b className="text-amber-400">{state.moves}</b>
        </span>
        <span>
          用时 <b className="text-sky-400">{fmt(elapsed)}</b>
        </span>
        {best && (
          <span className="text-slate-500">
            最佳纪录 {best.moves} 步 · {fmt(best.seconds)}
          </span>
        )}

        <div className="ml-auto flex items-center gap-2">
          <label className="flex cursor-pointer items-center gap-1.5 text-slate-400">
            <input
              type="checkbox"
              checked={hardMode}
              onChange={(e) => setHardMode(e.target.checked)}
              className="accent-amber-500"
            />
            硬核模式<span className="text-xs text-slate-600">(点位不分色)</span>
          </label>
          <button
            onClick={useHint}
            disabled={state.hintsLeft <= 0 || won}
            className="rounded-lg bg-sky-600 px-3 py-1 font-bold hover:bg-sky-500 disabled:opacity-30"
          >
            💡 提示 ×{state.hintsLeft}
          </button>
          <button
            onClick={restart}
            className="rounded-lg bg-slate-700 px-3 py-1 font-bold hover:bg-slate-600"
          >
            ↺ 重开
          </button>
        </div>
      </div>

      {/* 图板 */}
      <main className="min-h-0 flex-1 p-3">
        <MetroBoard
          key={level.id}
          lineIds={level.lineIds}
          placement={state.placement}
          selected={state.selected}
          locked={state.locked}
          hardMode={hardMode}
          onStationClick={clickStation}
        />
      </main>

      {/* 胜利弹窗 */}
      {won && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-[26rem] rounded-2xl border border-amber-500/40 bg-[#101828] p-8 text-center shadow-2xl">
            <div className="text-5xl">🏆</div>
            <h2 className="mt-3 text-2xl font-black">拼图完成！</h2>
            <div className="mt-2 text-3xl tracking-widest text-amber-400">
              {'★'.repeat(stars)}
              <span className="text-slate-700">{'★'.repeat(3 - stars)}</span>
            </div>
            <p className="mt-4 text-slate-300">
              你用 <b className="text-amber-400">{state.moves}</b> 步、
              <b className="text-sky-400"> {fmt(elapsed)} </b>
              复原了 {level.title.replace(/^第.关 · /, '')}的
              <b className="text-emerald-400"> {total} </b>座车站
            </p>
            <p className="mt-2 text-sm text-slate-500">
              {stars === 3
                ? '完美！你就是活的北京地铁图 🗺️'
                : stars === 2
                  ? '很不错！少用提示、少绕路可以冲三星'
                  : '通关就是胜利！再试一次冲击更高评价'}
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={restart}
                className="rounded-xl bg-slate-700 px-5 py-2.5 font-bold hover:bg-slate-600"
              >
                再玩一次
              </button>
              {levelIdx < LEVELS.length - 1 && (
                <button
                  onClick={() => setLevelIdx(levelIdx + 1)}
                  className="rounded-xl bg-amber-500 px-5 py-2.5 font-bold text-slate-900 hover:bg-amber-400"
                >
                  下一关 →
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
