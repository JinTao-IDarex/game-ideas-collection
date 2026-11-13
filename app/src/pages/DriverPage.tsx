// ─── 末班车司机 · 游戏主容器 ───────────────────────────────────────
import { useEffect, useRef, useState } from 'react'
import DriverMap from '../components/DriverMap'
import { DriverHud, Manifest, DecisionPanel } from '../components/DriverHud'
import { DriverIntro, DriverEnding } from '../components/DriverScreens'
import { createDriverGame, driverTick, driverDecide, type DriverState } from '../game/driver'
import { sfx } from '../game/sound'

const RATE = 1 // 现实 1 秒 = 游戏 1 分钟

export default function DriverPage() {
  const [game, setGame] = useState<DriverState | null>(null)
  const clockRef = useRef<{ real: number; startMin: number } | null>(null)
  const lastAlertCount = useRef(0)
  const endedRef = useRef(false)

  const start = () => {
    const g = createDriverGame()
    clockRef.current = { real: Date.now(), startMin: g.now }
    lastAlertCount.current = g.alerts.length
    endedRef.current = false
    setGame(g)
  }

  const phase = game?.phase
  useEffect(() => {
    if (!game || phase !== 'moving') return
    const timer = window.setInterval(() => {
      setGame((g) => {
        if (!g || !clockRef.current || g.phase !== 'moving') return g
        const now = clockRef.current.startMin + ((Date.now() - clockRef.current.real) / 1000) * RATE
        return driverTick(g, now)
      })
    }, 200)
    return () => window.clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // 音效
  useEffect(() => {
    if (!game) return
    if (game.alerts.length > lastAlertCount.current) {
      const fresh = game.alerts.slice(lastAlertCount.current)
      lastAlertCount.current = game.alerts.length
      if (fresh.some((a) => a.kind === 'dead')) sfx.lineDead()
      else if (fresh.some((a) => a.kind === 'warn')) sfx.warn()
    }
    if (game.phase === 'done' && !endedRef.current) {
      endedRef.current = true
      game.result === 'arrived' ? sfx.win() : sfx.lose()
    }
  }, [game])

  const decide = (stop: boolean) => {
    if (!game) return
    const next = driverDecide(game, stop)
    // 停靠会跳过停站时间：重置时钟基准
    clockRef.current = { real: Date.now(), startMin: next.now }
    if (stop) sfx.board()
    setGame(next)
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center gap-3 p-4" style={{ background: 'radial-gradient(1200px 700px at 50% -10%, #1c1428 0%, #060a18 60%)' }}>
      {game && game.phase !== 'menu' && <DriverHud state={game} />}

      <div className="relative w-full" style={{ maxWidth: 1000 }}>
        {game ? (
          <DriverMap state={game} />
        ) : (
          <div className="opacity-40 blur-[1px] pointer-events-none">
            <DriverMap state={previewState} />
          </div>
        )}

        {!game && <DriverIntro onStart={start} />}
        {game && game.phase === 'done' && <DriverEnding state={game} onRestart={start} />}
        {game && <DecisionPanel state={game} onDecide={decide} />}
      </div>

      {game && game.phase !== 'done' && <Manifest state={game} />}
      {game && game.phase !== 'done' && (
        <p className="text-xs text-slate-500">停一站 +4′ · 无人上下的站自动通过 · 23:30 前回库 · 现实 1 秒 = 游戏 1 分钟</p>
      )}
    </div>
  )
}

const previewState = (() => {
  const g = createDriverGame()
  return { ...g, now: 23 * 60 + 3, nextIdx: 2, arriveAt: 23 * 60 + 5 }
})()
