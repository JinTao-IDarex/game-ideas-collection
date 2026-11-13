// ─── 末班车司机 · HUD + 决策面板 + 乘客名单 ────────────────────────
import { STATION_MAP, fmtClock } from '../game/network'
import {
  ROUTE, DWELL_MINUTES, DEPOT_DEADLINE, CAPACITY, TRANSFER_CUTOFF,
  waitingAt, alightingAt, aboardCount, deliveredCount,
  type DriverState,
} from '../game/driver'

export function DriverHud({ state }: { state: DriverState }) {
  const latest = state.alerts[state.alerts.length - 1]
  const left = Math.max(0, Math.ceil(DEPOT_DEADLINE - state.now))
  return (
    <div className="w-full flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-baseline gap-3">
          <span className="text-4xl font-black tabular-nums tracking-wider text-slate-100" style={{ textShadow: '0 0 18px rgba(242,85,90,.4)' }}>
            {fmtClock(state.now)}
          </span>
          <span className="text-xs text-slate-400">🔌 回库死线 23:30 · 剩 {left}′</span>
        </div>
        <div className="flex gap-2 text-xs">
          <span className="rounded-full px-3 py-1 font-medium" style={{ background: 'rgba(56,132,255,.15)', color: '#7dd3fc', border: '1px solid #2b4a77' }}>
            车上 {aboardCount(state)}/{CAPACITY}
          </span>
          <span className="rounded-full px-3 py-1 font-medium" style={{ background: 'rgba(48,164,108,.15)', color: '#4ade80', border: '1px solid #1e4d33' }}>
            已送达 {deliveredCount(state)}/{state.passengers.length}
          </span>
          <span className="rounded-full px-3 py-1 font-medium" style={{ background: 'rgba(20,30,52,.9)', color: '#8fa3c8', border: '1px solid #22304e' }}>
            停靠 {state.stops} 站
          </span>
        </div>
      </div>
      <div className="text-sm rounded-lg px-3 py-1.5 truncate" style={{ background: 'rgba(20,30,52,.8)', color: latest?.kind === 'dead' ? '#f2a155' : latest?.kind === 'warn' ? '#facc15' : '#8fa3c8', border: '1px solid #22304e' }}>
        {latest ? `${fmtClock(latest.min)}　${latest.text}` : ''}
      </div>
    </div>
  )
}

export function Manifest({ state }: { state: DriverState }) {
  const color = {
    waiting: { bg: 'rgba(20,30,52,.9)', fg: '#8fa3c8', bd: '#22304e' },
    aboard: { bg: 'rgba(56,132,255,.15)', fg: '#7dd3fc', bd: '#2b4a77' },
    delivered: { bg: 'rgba(48,164,108,.15)', fg: '#4ade80', bd: '#1e4d33' },
    stranded: { bg: 'rgba(242,85,90,.12)', fg: '#f2555a', bd: '#4d2430' },
  } as const
  return (
    <div className="w-full flex gap-1.5 flex-wrap justify-center">
      {state.passengers.map((p) => (
        <span
          key={p.id}
          className="rounded-full px-2 py-0.5 text-xs"
          title={p.note ?? `${p.story}｜${p.destDesc}`}
          style={{ background: color[p.status].bg, color: color[p.status].fg, border: `1px solid ${color[p.status].bd}` }}
        >
          {p.emoji}{p.name}
        </span>
      ))}
    </div>
  )
}

export function DecisionPanel({ state, onDecide }: { state: DriverState; onDecide: (stop: boolean) => void }) {
  if (state.phase !== 'deciding') return null
  const sid = ROUTE[state.nextIdx]
  const sname = STATION_MAP[sid].name
  const waiting = waitingAt(state, sid)
  const alighting = alightingAt(state, sid)
  const cutoff = TRANSFER_CUTOFF[sid]
  const arriveT = state.arriveAt
  const left = DEPOT_DEADLINE - arriveT

  return (
    <div className="absolute left-1/2 -translate-x-1/2 bottom-4 z-20 w-[92%] max-w-xl rounded-2xl p-4"
      style={{ background: 'rgba(10,16,34,.96)', border: '1px solid #2b3b5e', boxShadow: '0 12px 40px rgba(0,0,0,.6)' }}>
      <div className="flex items-baseline justify-between mb-2">
        <div className="text-lg font-bold text-slate-100">已到站：{sname}</div>
        <div className="text-xs text-slate-400">{fmtClock(arriveT)} · 距回库死线 {left}′</div>
      </div>

      {cutoff && (
        <div className="text-xs mb-2" style={{ color: arriveT <= cutoff ? '#7dd3fc' : '#f2555a' }}>
          🔀 此站可换乘，接驳末班 {fmtClock(cutoff)}{arriveT <= cutoff ? `（还剩 ${cutoff - arriveT}′）` : '（已过）'}
        </div>
      )}

      <div className="flex flex-col gap-1 mb-3 text-sm">
        {waiting.map((p) => (
          <div key={p.id} className="text-slate-300">
            {p.emoji} <b>{p.name}</b> 想上车 <span className="text-slate-500">—— {p.destDesc}</span>
            {p.transferAt && <span className="text-amber-400">（需在{STATION_MAP[p.transferAt].name}赶上{p.transferLine} {fmtClock(TRANSFER_CUTOFF[p.transferAt])}）</span>}
          </div>
        ))}
        {alighting.map((p) => (
          <div key={p.id} className="text-sky-300">{p.emoji} <b>{p.name}</b> 要在此下车</div>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => onDecide(true)}
          className="flex-1 rounded-xl py-2.5 font-bold text-slate-900 transition-transform hover:scale-[1.02] active:scale-95"
          style={{ background: 'linear-gradient(135deg,#fde047,#f59e0b)' }}
        >
          停靠（+{DWELL_MINUTES}′）
        </button>
        <button
          onClick={() => onDecide(false)}
          className="flex-1 rounded-xl py-2.5 font-bold text-slate-300 transition-transform hover:scale-[1.02] active:scale-95"
          style={{ background: 'rgba(20,30,52,.9)', border: '1px solid #2b3b5e' }}
        >
          直接通过
        </button>
      </div>
    </div>
  )
}
