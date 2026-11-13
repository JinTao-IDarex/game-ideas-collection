// ─── 末班车司机 · 开场 / 众生相结算 ────────────────────────────────
import { useState } from 'react'
import { driverTitle, driverShareText, deliveredCount, type DriverState } from '../game/driver'

export function DriverIntro({ onStart }: { onStart: () => void }) {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl" style={{ background: 'rgba(6,10,24,.9)', backdropFilter: 'blur(6px)' }}>
      <div className="text-center max-w-lg px-6">
        <div className="text-6xl mb-4">🚇</div>
        <h1 className="text-4xl font-black tracking-widest text-slate-100 mb-2" style={{ textShadow: '0 0 30px rgba(242,85,90,.5)' }}>
          末班车司机
        </h1>
        <p className="text-slate-400 tracking-[.3em] text-sm mb-6">LAST TRAIN DRIVER</p>

        <p className="text-slate-300 leading-7 mb-6">
          今晚你开 <b className="text-red-400">1 号线末班车</b>，23:00 发车，<br />
          <b className="text-amber-400">23:30 前必须回库</b>，否则半路断电。<br />
          每停一站 <b>+4 分钟</b>。站台上每个人，都有自己的今夜。<br />
          <b className="text-slate-100">停，还是不停——你说了算。</b>
        </p>

        <button
          onClick={onStart}
          className="rounded-full px-12 py-3.5 text-lg font-bold text-slate-900 transition-transform hover:scale-105 active:scale-95"
          style={{ background: 'linear-gradient(135deg,#f2555a,#f59e0b)', boxShadow: '0 0 30px rgba(242,85,90,.35)' }}
        >
          发 车
        </button>
        <p className="text-xs text-slate-500 mt-4">无人上下的站会自动通过 · 换乘接驳有末班时刻</p>
      </div>
    </div>
  )
}

export function DriverEnding({ state, onRestart }: { state: DriverState; onRestart: () => void }) {
  const [copied, setCopied] = useState(false)
  const ok = deliveredCount(state)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(driverShareText(state))
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch { /* 静默 */ }
  }

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl overflow-auto" style={{ background: 'rgba(6,10,24,.92)', backdropFilter: 'blur(6px)' }}>
      <div className="text-center max-w-xl px-6 py-8">
        <div className="text-5xl mb-3">{state.result === 'blackout' ? '🕯️' : '🌃'}</div>
        <h2 className="text-3xl font-black text-slate-100 mb-1">
          {state.result === 'blackout' ? '半路断电' : '末班车回库'}
        </h2>
        <p className="text-lg mb-1" style={{ color: '#fde047' }}>{driverTitle(state)}</p>
        <p className="text-slate-400 text-sm mb-5">
          {state.result === 'blackout'
            ? '你停了一路，接触网在 23:30 断了电。全车人一起走回了家。'
            : `今夜 ${ok}/${state.passengers.length} 人到家，停靠 ${state.stops} 站。`}
        </p>

        {/* 今夜众生相 */}
        <div className="text-left rounded-xl p-4 mb-6 flex flex-col gap-2" style={{ background: 'rgba(20,30,52,.7)', border: '1px solid #22304e' }}>
          <div className="text-xs text-slate-500 mb-1 tracking-widest">今夜众生相</div>
          {state.passengers.map((p) => (
            <div key={p.id} className="text-sm flex gap-2">
              <span>{p.status === 'delivered' ? '✅' : '🌧️'}</span>
              <span className="text-slate-200 font-medium whitespace-nowrap">{p.emoji} {p.name}</span>
              <span className={p.status === 'delivered' ? 'text-slate-400' : 'text-red-300/80'}>{p.note}</span>
            </div>
          ))}
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
            再开一班
          </button>
        </div>
      </div>
    </div>
  )
}
