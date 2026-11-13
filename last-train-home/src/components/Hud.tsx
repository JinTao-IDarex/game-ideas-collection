// ─── 末班车 v2 · HUD（时钟 / 线路状态 / 单车 / 消息流） ────────────
import { LINES, STATION_MAP, fmtClock } from '../game/network'
import { LINE_MAP as NL_MAP, lineDead, stationDarkTime, hasPathHome, type GameState } from '../game/engine'

interface Props {
  state: GameState
  bikeArmed: boolean
  onToggleBike: () => void
}

export default function Hud({ state, bikeArmed, onToggleBike }: Props) {
  const now = state.now
  const latest = state.alerts[state.alerts.length - 1]
  const noPath = (state.phase === 'playing' || state.phase === 'riding') && !hasPathHome(state)
  const homeLeft = Math.max(0, Math.ceil(stationDarkTime(state.home) - now))

  let status = ''
  if (state.phase === 'riding' && state.ride) {
    const r = state.ride
    const toName = STATION_MAP[r.to].name
    if (r.byBike) {
      status = `🚲 骑行中 → ${toName}，${fmtClock(r.arrive)} 到`
    } else if (now < r.depart) {
      const wait = Math.max(0, Math.ceil(r.depart - now))
      status = `站台候车中 · ${NL_MAP[r.lineId!].name} ${wait}′ 后发车${r.isLast ? '（末班车！）' : ''}`
    } else {
      status = `乘车中 → ${toName}，${fmtClock(r.arrive)} 到`
    }
  }

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-baseline gap-3">
          <span className="text-4xl font-black tabular-nums tracking-wider text-slate-100" style={{ textShadow: '0 0 18px rgba(125,180,255,.35)' }}>
            {fmtClock(now)}
          </span>
          <span className="text-xs text-slate-400">🏠 {STATION_MAP[state.home].name} · 距熄灯 {homeLeft} 分</span>
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          {LINES.map((l) => {
            const dead = lineDead(l, now)
            const left = Math.max(0, Math.ceil(l.lastTrain - now))
            return (
              <div
                key={l.id}
                className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
                style={{
                  background: dead ? '#1a2236' : `${l.color}22`,
                  color: dead ? '#4b5878' : l.color,
                  border: `1px solid ${dead ? '#232c3f' : l.color + '55'}`,
                  transition: 'all .8s',
                }}
                title={dead ? '末班车已发出' : `末班车 ${fmtClock(l.lastTrain)}`}
              >
                <span
                  className="inline-block w-3.5 h-3.5 rounded-sm text-[10px] leading-[14px] text-center font-bold"
                  style={{ background: dead ? '#232c3f' : l.color, color: dead ? '#4b5878' : '#0a0f1e' }}
                >
                  {l.short}
                </span>
                {dead ? '已停运' : `末班 ${left}′`}
              </div>
            )
          })}

          {/* 共享单车 */}
          <button
            onClick={onToggleBike}
            disabled={state.bikeLeft <= 0 && !bikeArmed}
            className="rounded-full px-3 py-1 text-xs font-bold transition-all"
            style={{
              background: bikeArmed ? '#2dd4bf' : 'rgba(20,30,52,.9)',
              color: bikeArmed ? '#042f2a' : state.bikeLeft > 0 ? '#5eead4' : '#4b5878',
              border: `1px solid ${bikeArmed ? '#2dd4bf' : '#2b3b5e'}`,
              boxShadow: bikeArmed ? '0 0 16px rgba(45,212,191,.5)' : 'none',
              cursor: state.bikeLeft > 0 || bikeArmed ? 'pointer' : 'not-allowed',
            }}
            title="共享单车：4分钟一站，不受熄灯限制，骑行后进站免换乘步行"
          >
            🚲 ×{state.bikeLeft}
          </button>
        </div>
      </div>

      <div
        className="text-sm rounded-lg px-3 py-1.5 truncate"
        style={{
          background: noPath ? 'rgba(242,85,90,.14)' : 'rgba(20,30,52,.8)',
          color: noPath ? '#f2555a' : latest?.kind === 'dead' ? '#f2a155' : latest?.kind === 'warn' ? '#facc15' : '#8fa3c8',
          border: `1px solid ${noPath ? '#f2555a55' : '#22304e'}`,
        }}
      >
        {status || (noPath ? '⚠️ 去家的路已经断了……除非出现奇迹' : latest ? `${fmtClock(latest.min)}　${latest.text}` : '')}
      </div>
    </div>
  )
}
