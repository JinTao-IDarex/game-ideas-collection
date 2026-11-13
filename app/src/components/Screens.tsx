// ─── 末班车 · 开始屏 / 结算屏 ──────────────────────────────────────
import { useState } from 'react'
import { STATION_MAP, fmtClock } from '../game/network'
import { DIFFICULTY, resultTitle, shareText, type Difficulty, type GameState } from '../game/engine'

export function StartScreen({ onStart }: { onStart: (d: Difficulty) => void }) {
  const [d, setD] = useState<Difficulty>('normal')
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl" style={{ background: 'rgba(6,10,24,.88)', backdropFilter: 'blur(6px)' }}>
      <div className="text-center max-w-lg px-6">
        <div className="text-6xl mb-4">🚇</div>
        <h1 className="text-5xl font-black tracking-widest text-slate-100 mb-2" style={{ textShadow: '0 0 30px rgba(125,180,255,.5)' }}>
          末班车
        </h1>
        <p className="text-slate-400 tracking-[.3em] text-sm mb-8">LAST TRAIN HOME</p>

        <p className="text-slate-300 leading-7 mb-6">
          全城末班车正在一班班发出，<br />
          站点会随着末班车驶过<b className="text-amber-400">逐站熄灯</b>。<br />
          点击相邻站点乘车，在整座城市睡着之前——<b className="text-slate-100">回家</b>。
        </p>

        <div className="flex gap-3 justify-center mb-8">
          {(Object.keys(DIFFICULTY) as Difficulty[]).map((k) => (
            <button
              key={k}
              onClick={() => setD(k)}
              className="rounded-xl px-4 py-3 text-left transition-all"
              style={{
                background: d === k ? 'rgba(56,132,255,.18)' : 'rgba(20,30,52,.8)',
                border: `1px solid ${d === k ? '#3884ff' : '#22304e'}`,
              }}
            >
              <div className="font-bold text-slate-100">{DIFFICULTY[k].label}</div>
              <div className="text-xs text-slate-400 mt-0.5">{DIFFICULTY[k].desc}</div>
            </button>
          ))}
        </div>

        <button
          onClick={() => onStart(d)}
          className="rounded-full px-12 py-3.5 text-lg font-bold text-slate-900 transition-transform hover:scale-105 active:scale-95"
          style={{ background: 'linear-gradient(135deg,#fde047,#f59e0b)', boxShadow: '0 0 30px rgba(253,224,71,.35)' }}
        >
          出 发
        </button>
        <p className="text-xs text-slate-500 mt-4">换乘需步行 6 分钟 · 熄灯的站不能上下车</p>
      </div>
    </div>
  )
}

export function EndScreen({ state, onRestart }: { state: GameState; onRestart: () => void }) {
  const won = state.phase === 'won'
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareText(state))
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      /* 剪贴板不可用时静默 */
    }
  }

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl" style={{ background: 'rgba(6,10,24,.85)', backdropFilter: 'blur(6px)' }}>
      <div className="text-center max-w-md px-6">
        <div className="text-6xl mb-4">{won ? '🏠' : '🌧️'}</div>
        <h2 className="text-4xl font-black text-slate-100 mb-2">{won ? '到家了' : '今晚睡公司'}</h2>
        <p className="text-lg mb-1" style={{ color: won ? '#fde047' : '#8fa3c8' }}>
          {won ? resultTitle(state) : ''}
        </p>
        <p className="text-slate-400 mb-6">
          {won
            ? `${fmtClock(state.wonAt)} 推开「${STATION_MAP[state.home].name}」的家门，城市在身后熄了灯。`
            : state.loseReason}
        </p>

        <div className="flex justify-center gap-6 mb-8 text-sm text-slate-300">
          <div><span className="text-2xl font-bold text-slate-100">{state.hops}</span><br />途经站数</div>
          <div><span className="text-2xl font-bold text-slate-100">{state.transfers}</span><br />换乘次数</div>
          <div><span className="text-2xl font-bold text-slate-100">{state.bikeUsed}</span><br />🚲 骑行</div>
          <div><span className="text-2xl font-bold text-slate-100">{state.linesUsed.length}</span><br />搭乘线路</div>
        </div>

        <div className="flex gap-3 justify-center">
          <button
            onClick={copy}
            className="rounded-full px-6 py-2.5 font-bold text-slate-900 transition-transform hover:scale-105 active:scale-95"
            style={{ background: 'linear-gradient(135deg,#38bdf8,#3884ff)' }}
          >
            {copied ? '已复制 ✓' : '复制战绩'}
          </button>
          <button
            onClick={onRestart}
            className="rounded-full px-6 py-2.5 font-bold text-slate-100 transition-transform hover:scale-105 active:scale-95"
            style={{ background: 'rgba(20,30,52,.9)', border: '1px solid #2b3b5e' }}
          >
            再来一晚
          </button>
        </div>
      </div>
    </div>
  )
}
