// ─── 末班车 v2 · 游戏主容器 ────────────────────────────────────────
import { useEffect, useRef, useState } from 'react'
import MetroMap from '../components/MetroMap'
import Hud from '../components/Hud'
import { StartScreen, EndScreen } from '../components/Screens'
import {
  createGame, tick, applyMove, checkMove,
  DIFFICULTY,
  type Difficulty, type GameState,
} from '../game/engine'
import { sfx } from '../game/sound'

const RATE = 1 // 现实 1 秒 = 游戏 1 分钟

export default function Home() {
  const [game, setGame] = useState<GameState | null>(null)
  const [bikeArmed, setBikeArmed] = useState(false)
  const [toast, setToast] = useState('')
  const clockRef = useRef<{ real: number; startMin: number } | null>(null)
  const toastTimer = useRef<number | undefined>(undefined)
  const lastAlertCount = useRef(0)
  const endedRef = useRef(false)

  const showToast = (msg: string) => {
    setToast(msg)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(''), 2200)
  }

  const start = (d: Difficulty) => {
    const g = createGame(d)
    clockRef.current = { real: Date.now(), startMin: DIFFICULTY[d].startMin }
    lastAlertCount.current = g.alerts.length
    endedRef.current = false
    setBikeArmed(false)
    setGame(g)
  }

  // 主时钟
  const phase = game?.phase
  useEffect(() => {
    if (!game || (phase !== 'playing' && phase !== 'riding')) return
    const timer = window.setInterval(() => {
      setGame((g) => {
        if (!g || !clockRef.current || g.phase === 'won' || g.phase === 'lost') return g
        const now = clockRef.current.startMin + ((Date.now() - clockRef.current.real) / 1000) * RATE
        return tick(g, now)
      })
    }, 200)
    return () => window.clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // 音效：新消息 / 结局
  useEffect(() => {
    if (!game) return
    if (game.alerts.length > lastAlertCount.current) {
      const fresh = game.alerts.slice(lastAlertCount.current)
      lastAlertCount.current = game.alerts.length
      if (fresh.some((a) => a.kind === 'dead')) sfx.lineDead()
      else if (fresh.some((a) => a.kind === 'warn')) sfx.warn()
    }
    if ((game.phase === 'won' || game.phase === 'lost') && !endedRef.current) {
      endedRef.current = true
      game.phase === 'won' ? sfx.win() : sfx.lose()
    }
  }, [game])

  const onStationClick = (id: string) => {
    if (!game || game.phase !== 'playing') return
    const c = checkMove(game, id, bikeArmed)
    if (!c.ok) {
      if (c.reason) showToast(c.reason)
      return
    }
    const moved = applyMove(game, id, bikeArmed)
    if (bikeArmed) setBikeArmed(false)
    if (c.byBike) sfx.transfer()
    else if (moved.transfers > game.transfers) sfx.transfer()
    else sfx.board()
    setGame(moved)
  }

  const playing = game && game.phase !== 'menu'

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center gap-3 p-4" style={{ background: 'radial-gradient(1200px 700px at 50% -10%, #16203a 0%, #060a18 60%)' }}>
      {playing && <Hud state={game} bikeArmed={bikeArmed} onToggleBike={() => setBikeArmed((v) => !v)} />}

      <div className="relative w-full" style={{ maxWidth: 1000 }}>
        {playing ? (
          <MetroMap state={game} bikeArmed={bikeArmed} onStationClick={onStationClick} />
        ) : (
          <div className="opacity-40 blur-[1px] pointer-events-none">
            <MetroMap state={previewState} bikeArmed={false} onStationClick={() => {}} />
          </div>
        )}

        {(!game || game.phase === 'menu') && <StartScreen onStart={start} />}
        {game && (game.phase === 'won' || game.phase === 'lost') && (
          <EndScreen state={game} onRestart={() => start(game.difficulty)} />
        )}

        {toast && (
          <div className="absolute left-1/2 -translate-x-1/2 bottom-6 z-20 rounded-full px-5 py-2 text-sm font-medium text-amber-200"
            style={{ background: 'rgba(30,38,60,.95)', border: '1px solid #3a4763', boxShadow: '0 4px 20px rgba(0,0,0,.5)' }}>
            {toast}
          </div>
        )}
      </div>

      {playing && (
        <p className="text-xs text-slate-500">
          点击发光相邻站乘车 · 角标=等车分钟（末=末班车） · 🚲 4′/站不怕熄灯，骑完进站免换乘 · 现实 1 秒 = 游戏 1 分钟
        </p>
      )}
    </div>
  )
}

// 菜单背景用的静态预览（21:47 的不夜城）
const previewState = (() => {
  const g = createGame('normal', 0.42)
  return { ...g, now: 21 * 60 + 47 }
})()
