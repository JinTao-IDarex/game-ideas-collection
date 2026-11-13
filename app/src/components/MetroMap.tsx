// ─── 末班车 v2 · SVG 地铁图 ────────────────────────────────────────
// 列车是真实班次实体：白点=普通列车，彩色脉冲点=末班车，车过灯灭
import { useMemo } from 'react'
import { STATIONS, STATION_MAP, LINES, STATION_LINES } from '../game/network'
import {
  EDGES, LINE_MAP, darkTimeOnLine, isStationAlive, edgesFrom,
  activeTrains, checkMove,
  type GameState,
} from '../game/engine'

const S = 64
const P = 56
const W = 13 * S + P * 2
const H = 11 * S + P * 2

const px = (gx: number) => gx * S + P
const py = (gy: number) => gy * S + P

function playerPos(st: GameState): { x: number; y: number } {
  if (st.phase === 'riding' && st.ride && st.now >= st.ride.depart) {
    const f = STATION_MAP[st.ride.from]
    const t = STATION_MAP[st.ride.to]
    const p = Math.min(1, (st.now - st.ride.depart) / (st.ride.arrive - st.ride.depart))
    return { x: px(f.x) + (px(t.x) - px(f.x)) * p, y: py(f.y) + (py(t.y) - py(f.y)) * p }
  }
  const s = STATION_MAP[st.at]
  return { x: px(s.x), y: py(s.y) }
}

interface Props {
  state: GameState
  bikeArmed: boolean
  onStationClick: (id: string) => void
}

export default function MetroMap({ state, bikeArmed, onStationClick }: Props) {
  const now = state.now

  // 每个相邻站的出行方案（等车分钟数 / 骑行 / 不可达）
  const options = useMemo(() => {
    const map = new Map<string, { ok: boolean; wait?: number; isLast?: boolean }>()
    if (state.phase !== 'playing') return map
    for (const e of edgesFrom(state.at)) {
      const nb = e.a === state.at ? e.b : e.a
      if (map.has(nb)) continue
      if (bikeArmed) {
        map.set(nb, { ok: true, wait: -1 }) // -1 = 骑行
      } else {
        const c = checkMove(state, nb, false)
        map.set(nb, c.ok ? { ok: true, wait: Math.max(0, Math.ceil(c.depart! - now)), isLast: c.isLast } : { ok: false })
      }
    }
    return map
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.at, state.phase, bikeArmed, Math.floor(now)])

  const player = playerPos(state)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full select-none" style={{ maxHeight: 'calc(100vh - 190px)' }}>
      <defs>
        <filter id="glow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect x={0} y={0} width={W} height={H} fill="#0a0f1e" rx={18} />

      {/* 线路段（末班车扫过即熄） */}
      {EDGES.map((e, i) => {
        const line = LINE_MAP[e.lineId]
        const a = STATION_MAP[e.a]
        const b = STATION_MAP[e.b]
        const segDead = now >= Math.min(darkTimeOnLine(line, e.a), darkTimeOnLine(line, e.b))
        return (
          <line
            key={i}
            x1={px(a.x)} y1={py(a.y)} x2={px(b.x)} y2={py(b.y)}
            stroke={segDead ? '#232c3f' : line.color}
            strokeWidth={9}
            strokeLinecap="round"
            opacity={segDead ? 0.55 : 0.92}
            style={{ transition: 'stroke 0.8s' }}
          />
        )
      })}

      {/* 真实列车：白点普通班次，彩色脉冲=末班车 */}
      {LINES.map((line) =>
        activeTrains(line, now).map((t, i) => (
          <g key={`${line.id}-${i}`}>
            {t.isLast ? (
              <>
                <circle cx={px(t.x)} cy={py(t.y)} r={6} fill={line.color} filter="url(#glow)" />
                <circle cx={px(t.x)} cy={py(t.y)} r={11} fill="none" stroke={line.color} strokeWidth={1.2} opacity={0.6}>
                  <animate attributeName="r" values="8;14;8" dur="1.4s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.8;0.1;0.8" dur="1.4s" repeatCount="indefinite" />
                </circle>
              </>
            ) : (
              <circle cx={px(t.x)} cy={py(t.y)} r={4} fill="#e8eefc" opacity={0.85} />
            )}
          </g>
        )),
      )}

      {/* 站点 */}
      {STATIONS.map((s) => {
        const alive = isStationAlive(s.id, now)
        const isHere = state.at === s.id && state.phase !== 'riding'
        const isHome = state.home === s.id
        const isInter = STATION_LINES[s.id].length > 1
        const dying = alive && stationWillDieSoon(s.id, now)
        const opt = options.get(s.id)
        const cx = px(s.x)
        const cy = py(s.y)
        const tx = cx + (s.lx ?? 0) * 16
        const ty = cy + (s.ly ?? 0) * 20 + (s.ly ? 4 : 24)
        const anchor = s.anchor ?? (s.lx ? (s.lx > 0 ? 'start' : 'end') : 'middle')
        return (
          <g key={s.id}>
            {isInter ? (
              <>
                <circle cx={cx} cy={cy} r={10} fill={alive ? '#0a0f1e' : '#141b2b'} stroke={alive ? '#e2e8f0' : '#3a4763'} strokeWidth={3} style={{ transition: 'all 0.8s' }} />
                <circle cx={cx} cy={cy} r={4.5} fill={alive ? '#e2e8f0' : '#3a4763'} style={{ transition: 'all 0.8s' }} />
              </>
            ) : (
              <circle cx={cx} cy={cy} r={6.5} fill={alive ? '#f1f5f9' : '#232c3f'} stroke={alive ? '#0a0f1e' : '#3a4763'} strokeWidth={2} style={{ transition: 'all 0.8s' }} />
            )}
            {dying && (
              <circle cx={cx} cy={cy} r={isInter ? 15 : 12} fill="none" stroke="#f59e0b" strokeWidth={1.5} opacity={0.8}>
                <animate attributeName="r" values={`${isInter ? 12 : 9};${isInter ? 18 : 15};${isInter ? 12 : 9}`} dur="1.6s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.9;0.2;0.9" dur="1.6s" repeatCount="indefinite" />
              </circle>
            )}
            {isHome && (
              <text x={cx} y={cy - 22} textAnchor="middle" fontSize={20}>🏠</text>
            )}
            <text
              x={tx} y={ty}
              textAnchor={anchor}
              fontSize={13}
              fill={isHere || isHome ? '#f8fafc' : alive ? '#9aa8c2' : '#455169'}
              fontWeight={isHere || isHome ? 700 : 400}
              style={{ transition: 'fill 0.8s', pointerEvents: 'none' }}
            >
              {s.name}
            </text>

            {/* 出行方案角标：等 N 分 / 末班 / 🚲 */}
            {opt?.ok && (
              <>
                <g style={{ pointerEvents: 'none' }}>
                  <rect x={cx + 9} y={cy - 24} rx={7} width={opt.wait === -1 ? 26 : opt.isLast ? 34 : 30} height={16} fill={opt.wait === -1 ? '#16403b' : opt.isLast ? '#4a2d0f' : '#14263f'} stroke={opt.wait === -1 ? '#2dd4bf' : opt.isLast ? '#f59e0b' : '#2b4a77'} strokeWidth={0.8} />
                  <text x={cx + (opt.wait === -1 ? 22 : opt.isLast ? 26 : 24)} y={cy - 12} textAnchor="middle" fontSize={10.5} fill={opt.wait === -1 ? '#5eead4' : opt.isLast ? '#fbbf24' : '#7dd3fc'}>
                    {opt.wait === -1 ? '🚲4′' : opt.isLast ? `末${opt.wait}′` : `${opt.wait}′`}
                  </text>
                </g>
                <circle
                  cx={cx} cy={cy} r={20}
                  fill="transparent"
                  style={{ cursor: 'pointer' }}
                  onClick={() => onStationClick(s.id)}
                >
                  <title>{s.name}</title>
                </circle>
                <circle cx={cx} cy={cy} r={13} fill="none" stroke={opt.wait === -1 ? '#2dd4bf' : '#38bdf8'} strokeWidth={1.5} opacity={0.7} style={{ pointerEvents: 'none' }}>
                  <animate attributeName="opacity" values="0.7;0.15;0.7" dur="1.8s" repeatCount="indefinite" />
                </circle>
              </>
            )}
          </g>
        )
      })}

      {/* 玩家（候车时静止在站台） */}
      <g filter="url(#glow)">
        <circle cx={player.x} cy={player.y} r={9} fill={state.mode === 'street' ? '#5eead4' : '#fde047'} stroke="#0a0f1e" strokeWidth={2.5} />
        <circle cx={player.x} cy={player.y} r={15} fill="none" stroke={state.mode === 'street' ? '#5eead4' : '#fde047'} strokeWidth={1.5} opacity={0.5}>
          <animate attributeName="r" values="11;19;11" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.7;0.05;0.7" dur="2s" repeatCount="indefinite" />
        </circle>
      </g>
    </svg>
  )
}

function stationWillDieSoon(id: string, now: number): boolean {
  const lines = STATION_LINES[id] ?? []
  const dark = Math.max(...lines.map((l) => darkTimeOnLine(l, id)))
  const left = dark - now
  return left <= 8 && left > 0
}
