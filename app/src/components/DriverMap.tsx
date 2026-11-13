// ─── 末班车司机 · SVG 地图 ─────────────────────────────────────────
// 你的列车行驶过的 1号线区段会随之熄灯；其他线路按各自时刻表熄灯
import { STATIONS, STATION_MAP, LINES, STATION_LINES } from '../game/network'
import { darkTimeOnLine, activeTrains, LINE_MAP } from '../game/engine'
import { ROUTE, waitingAt, TRANSFER_CUTOFF, fmtClockD, type DriverState } from '../game/driver'

const S = 64
const P = 56
const W = 13 * S + P * 2
const H = 11 * S + P * 2

const px = (gx: number) => gx * S + P
const py = (gy: number) => gy * S + P

export default function DriverMap({ state }: { state: DriverState }) {
  const now = state.now

  // 你的列车位置
  let trainX = 0
  let trainY = 0
  {
    const cur = STATION_MAP[ROUTE[Math.min(state.nextIdx, ROUTE.length - 1)]]
    if (state.phase === 'deciding' || state.phase === 'done') {
      trainX = px(cur.x)
      trainY = py(cur.y)
    } else {
      const prev = STATION_MAP[ROUTE[state.nextIdx - 1]]
      const p = Math.min(1, Math.max(0, (now - (state.arriveAt - 2)) / 2))
      trainX = px(prev.x) + (px(cur.x) - px(prev.x)) * p
      trainY = py(prev.y) + (py(cur.y) - py(prev.y)) * p
    }
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full select-none" style={{ maxHeight: 'calc(100vh - 220px)' }}>
      <defs>
        <filter id="glow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect x={0} y={0} width={W} height={H} fill="#0a0f1e" rx={18} />

      {/* 其他线路（按各自时刻表熄灯） */}
      {LINES.filter((l) => l.id !== 'L1').map((line) =>
        line.stations.slice(0, -1).map((sid, i) => {
          const a = STATION_MAP[sid]
          const b = STATION_MAP[line.stations[i + 1]]
          const dead = now >= Math.min(darkTimeOnLine(line, sid), darkTimeOnLine(line, line.stations[i + 1]))
          return (
            <line
              key={`${line.id}-${i}`}
              x1={px(a.x)} y1={py(a.y)} x2={px(b.x)} y2={py(b.y)}
              stroke={dead ? '#232c3f' : line.color}
              strokeWidth={7}
              strokeLinecap="round"
              opacity={dead ? 0.4 : 0.55}
              style={{ transition: 'stroke 0.8s' }}
            />
          )
        }),
      )}

      {/* 1号线（你的线）：驶过即熄 */}
      {ROUTE.slice(0, -1).map((sid, i) => {
        const a = STATION_MAP[sid]
        const b = STATION_MAP[ROUTE[i + 1]]
        const segDead = state.nextIdx > i + 1
        return (
          <line
            key={`L1-${i}`}
            x1={px(a.x)} y1={py(a.y)} x2={px(b.x)} y2={py(b.y)}
            stroke={segDead ? '#232c3f' : LINE_MAP.L1.color}
            strokeWidth={10}
            strokeLinecap="round"
            opacity={segDead ? 0.55 : 0.95}
            style={{ transition: 'stroke 0.8s' }}
          />
        )
      })}

      {/* 其他线路的列车（城市还活着的背景） */}
      {LINES.filter((l) => l.id !== 'L1').map((line) =>
        activeTrains(line, now).map((t, i) => (
          <circle key={`${line.id}-t${i}`} cx={px(t.x)} cy={py(t.y)} r={t.isLast ? 5 : 3.5} fill={t.isLast ? line.color : '#e8eefc'} opacity={t.isLast ? 0.95 : 0.7} />
        )),
      )}

      {/* 站点 */}
      {STATIONS.map((s) => {
        const onRoute = ROUTE.includes(s.id)
        const routeIdx = ROUTE.indexOf(s.id)
        // 1号线站：驶过即灭；其他线站：按时刻表
        const alive = onRoute
          ? routeIdx >= state.nextIdx || state.phase === 'done'
          : STATION_LINES[s.id].some((l) => now < darkTimeOnLine(l, s.id))
        const isInter = STATION_LINES[s.id].length > 1
        const waiting = waitingAt(state, s.id)
        const cutoff = TRANSFER_CUTOFF[s.id]
        const cx = px(s.x)
        const cy = py(s.y)
        const tx = cx + (s.lx ?? 0) * 16
        const ty = cy + (s.ly ?? 0) * 20 + (s.ly ? 4 : 24)
        const anchor = s.anchor ?? (s.lx ? (s.lx > 0 ? 'start' : 'end') : 'middle')
        const isNext = onRoute && routeIdx === state.nextIdx && state.phase !== 'done'
        return (
          <g key={s.id}>
            {isInter ? (
              <>
                <circle cx={cx} cy={cy} r={9} fill={alive ? '#0a0f1e' : '#141b2b'} stroke={alive ? '#e2e8f0' : '#3a4763'} strokeWidth={2.5} style={{ transition: 'all 0.8s' }} />
                <circle cx={cx} cy={cy} r={4} fill={alive ? '#e2e8f0' : '#3a4763'} style={{ transition: 'all 0.8s' }} />
              </>
            ) : (
              <circle cx={cx} cy={cy} r={6} fill={alive ? '#f1f5f9' : '#232c3f'} stroke={alive ? '#0a0f1e' : '#3a4763'} strokeWidth={2} style={{ transition: 'all 0.8s' }} />
            )}
            {isNext && (
              <circle cx={cx} cy={cy} r={16} fill="none" stroke="#fde047" strokeWidth={1.5}>
                <animate attributeName="r" values="12;20;12" dur="1.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.9;0.1;0.9" dur="1.5s" repeatCount="indefinite" />
              </circle>
            )}
            <text
              x={tx} y={ty}
              textAnchor={anchor}
              fontSize={13}
              fill={alive ? (onRoute ? '#c7d2ea' : '#7787a6') : '#455169'}
              fontWeight={onRoute ? 600 : 400}
              style={{ transition: 'fill 0.8s', pointerEvents: 'none' }}
            >
              {s.name}
            </text>
            {/* 换乘末班提示 */}
            {onRoute && cutoff && alive && (
              <text x={cx} y={cy + (s.ly && s.ly < 0 ? 26 : -26)} textAnchor="middle" fontSize={10} fill={now >= cutoff ? '#4b5878' : '#8fa3c8'} style={{ pointerEvents: 'none' }}>
                🔀末班 {fmtClockD(cutoff)}
              </text>
            )}
            {/* 站台上等车的人 */}
            {waiting.length > 0 && (
              <text x={cx} y={cy - (cutoff ? 38 : 24)} textAnchor="middle" fontSize={15} style={{ pointerEvents: 'none' }}>
                {waiting.map((p) => p.emoji).join('')}
              </text>
            )}
          </g>
        )
      })}

      {/* 你的末班车 */}
      {state.phase !== 'done' && (
        <g filter="url(#glow)">
          <circle cx={trainX} cy={trainY} r={10} fill="#f2555a" stroke="#fff1f2" strokeWidth={2} />
          <circle cx={trainX} cy={trainY} r={17} fill="none" stroke="#f2555a" strokeWidth={1.5} opacity={0.5}>
            <animate attributeName="r" values="13;21;13" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.7;0.05;0.7" dur="2s" repeatCount="indefinite" />
          </circle>
        </g>
      )}
    </svg>
  )
}
