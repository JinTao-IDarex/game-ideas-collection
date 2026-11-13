import { useCallback, useMemo, useRef, useState } from 'react'
import { LINES, STATIONS, isTransfer, linesOf } from '@/data/beijing'

const U = 72 // 每网格单位的像素

interface Props {
  lineIds: string[]
  placement: Record<string, string>
  selected: string | null
  locked: Set<string>
  hardMode: boolean
  onStationClick: (posId: string) => void
}

interface View {
  x: number
  y: number
  k: number
}

export default function MetroBoard({
  lineIds,
  placement,
  selected,
  locked,
  hardMode,
  onStationClick,
}: Props) {
  const lines = useMemo(() => LINES.filter((l) => lineIds.includes(l.id)), [lineIds])

  const stationIds = useMemo(() => {
    const set = new Set<string>()
    lines.forEach((l) => l.stations.forEach((s) => set.add(s)))
    return [...set]
  }, [lines])

  const bounds = useMemo(() => {
    const xs = stationIds.map((id) => STATIONS[id].x)
    const ys = stationIds.map((id) => STATIONS[id].y)
    return {
      minX: Math.min(...xs) - 2.2,
      maxX: Math.max(...xs) + 3.2,
      minY: Math.min(...ys) - 1.8,
      maxY: Math.max(...ys) + 1.8,
    }
  }, [stationIds])

  const initView = useCallback((): View => {
    const w = (bounds.maxX - bounds.minX) * U
    const h = (bounds.maxY - bounds.minY) * U
    const vw = svgRef.current?.clientWidth ?? 1200
    const vh = svgRef.current?.clientHeight ?? 800
    const k = Math.min(vw / w, vh / h, 1)
    return {
      x: (vw - w * k) / 2 - bounds.minX * U * k,
      y: (vh - h * k) / 2 - bounds.minY * U * k,
      k,
    }
  }, [bounds])

  const svgRef = useRef<SVGSVGElement>(null)
  const [view, setView] = useState<View | null>(null)
  const v = view ?? initView()

  const drag = useRef<{ px: number; py: number; moved: boolean } | null>(null)

  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = { px: e.clientX, py: e.clientY, moved: false }
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d) return
    const dx = e.clientX - d.px
    const dy = e.clientY - d.py
    if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true
    if (d.moved) {
      d.px = e.clientX
      d.py = e.clientY
      setView((cur) => {
        const base = cur ?? initView()
        return { ...base, x: base.x + dx, y: base.y + dy }
      })
    }
  }
  const onPointerUp = () => {
    // 延迟清掉，保证 click 事件先读取 moved 状态
    setTimeout(() => (drag.current = null), 0)
  }
  const wasDragging = () => drag.current?.moved ?? false

  const onWheel = (e: React.WheelEvent) => {
    const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15
    zoomAt(factor, e.clientX, e.clientY)
  }

  const zoomAt = (factor: number, cx?: number, cy?: number) => {
    const rect = svgRef.current?.getBoundingClientRect()
    const px = cx !== undefined && rect ? cx - rect.left : (rect?.width ?? 0) / 2
    const py = cy !== undefined && rect ? cy - rect.top : (rect?.height ?? 0) / 2
    setView((cur) => {
      const base = cur ?? initView()
      const k = Math.min(3, Math.max(0.25, base.k * factor))
      const f = k / base.k
      return { k, x: px - (px - base.x) * f, y: py - (py - base.y) * f }
    })
  }

  // 线路是否已全线归位（发光奖励）
  const lineDone = useMemo(() => {
    const m = new Map<string, boolean>()
    for (const l of lines) {
      m.set(l.id, l.stations.every((s) => placement[s] === s))
    }
    return m
  }, [lines, placement])

  const linePath = (lineId: string): string => {
    const l = lines.find((x) => x.id === lineId)!
    const pts = l.stations.map((s) => STATIONS[s])
    let d = `M ${pts[0].x * U} ${pts[0].y * U}`
    for (let i = 1; i < pts.length; i++) d += ` L ${pts[i].x * U} ${pts[i].y * U}`
    if (l.loop) d += ' Z'
    return d
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border border-slate-700 bg-[#0d1420]">
      <svg
        ref={svgRef}
        className="h-full w-full cursor-grab touch-none active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onWheel={onWheel}
      >
        <g transform={`translate(${v.x},${v.y}) scale(${v.k})`}>
          {/* 网格底纹 */}
          <g stroke="#1a2436" strokeWidth={1}>
            {Array.from({ length: Math.ceil(bounds.maxX - bounds.minX) + 1 }, (_, i) => (
              <line
                key={`vx${i}`}
                x1={(bounds.minX + i) * U}
                y1={bounds.minY * U}
                x2={(bounds.minX + i) * U}
                y2={bounds.maxY * U}
              />
            ))}
            {Array.from({ length: Math.ceil(bounds.maxY - bounds.minY) + 1 }, (_, i) => (
              <line
                key={`hz${i}`}
                x1={bounds.minX * U}
                y1={(bounds.minY + i) * U}
                x2={bounds.maxX * U}
                y2={(bounds.minY + i) * U}
              />
            ))}
          </g>

          {/* 完成线路的辉光 */}
          {lines.map(
            (l) =>
              lineDone.get(l.id) && (
                <path
                  key={`glow-${l.id}`}
                  d={linePath(l.id)}
                  fill="none"
                  stroke={l.color}
                  strokeWidth={18}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  opacity={0.28}
                  className="animate-pulse"
                />
              ),
          )}

          {/* 线路骨架 */}
          {lines.map((l) => (
            <path
              key={l.id}
              d={linePath(l.id)}
              fill="none"
              stroke={l.color}
              strokeWidth={7}
              strokeLinejoin="round"
              strokeLinecap="round"
              opacity={0.95}
            />
          ))}

          {/* 站点 */}
          {stationIds.map((posId) => {
            const st = STATIONS[posId]
            const px = st.x * U
            const py = st.y * U
            const transfer = isTransfer(posId, lineIds)
            const myLines = linesOf(posId, lineIds)
            const occupant = placement[posId]
            const correct = occupant === posId
            const isLocked = locked.has(posId)
            const isSelected = selected === posId
            const ringColor = hardMode ? '#64748b' : myLines[0]?.color ?? '#64748b'

            const labelDX =
              st.label === 'left' ? -14 : st.label === 'right' ? 14 : 0
            const labelDY =
              st.label === 'top' ? -16 : st.label === 'bottom' ? 24 : 5
            const anchor =
              st.label === 'left' ? 'end' : st.label === 'right' ? 'start' : 'middle'

            return (
              <g
                key={posId}
                onClick={(e) => {
                  e.stopPropagation()
                  if (!wasDragging()) onStationClick(posId)
                }}
                className={isLocked ? 'cursor-default' : 'cursor-pointer'}
              >
                {/* 点击热区 */}
                <circle cx={px} cy={py} r={26} fill="transparent" />

                {/* 选中光环 */}
                {isSelected && (
                  <circle
                    cx={px}
                    cy={py}
                    r={20}
                    fill="none"
                    stroke="#facc15"
                    strokeWidth={4}
                    className="animate-ping"
                    style={{ transformOrigin: `${px}px ${py}px` }}
                  />
                )}
                {isSelected && (
                  <circle cx={px} cy={py} r={20} fill="none" stroke="#facc15" strokeWidth={4} />
                )}

                {/* 站点点位 */}
                {transfer ? (
                  <>
                    <circle cx={px} cy={py} r={13} fill="#0d1420" stroke={myLines[0]?.color} strokeWidth={5} />
                    {myLines[1] && (
                      <circle cx={px} cy={py} r={6.5} fill="none" stroke={myLines[1].color} strokeWidth={4} />
                    )}
                  </>
                ) : (
                  <circle
                    cx={px}
                    cy={py}
                    r={10}
                    fill={correct ? ringColor : '#0d1420'}
                    stroke={isSelected ? '#facc15' : ringColor}
                    strokeWidth={4.5}
                  />
                )}

                {/* 站名 */}
                <text
                  x={px + labelDX}
                  y={py + labelDY}
                  textAnchor={anchor}
                  fontSize={19}
                  fontWeight={correct ? 700 : 500}
                  fill={
                    isLocked
                      ? '#4ade80'
                      : isSelected
                        ? '#facc15'
                        : '#cbd5e1'
                  }
                  style={{
                    paintOrder: 'stroke',
                    stroke: '#0d1420',
                    strokeWidth: 5,
                    userSelect: 'none',
                  }}
                >
                  {occupant ? STATIONS[occupant].name : ''}
                </text>

                {/* 锁定对勾 */}
                {isLocked && !transfer && (
                  <text
                    x={px + labelDX}
                    y={py + labelDY + 16}
                    textAnchor={anchor}
                    fontSize={12}
                    fill="#4ade80"
                    style={{ paintOrder: 'stroke', stroke: '#0d1420', strokeWidth: 4 }}
                  >
                    ✓ 归位
                  </text>
                )}
              </g>
            )
          })}
        </g>
      </svg>

      {/* 缩放控件 */}
      <div className="absolute right-3 top-3 flex flex-col gap-1.5">
        <button
          onClick={() => zoomAt(1.25)}
          className="h-9 w-9 rounded-lg border border-slate-600 bg-slate-800/90 text-lg text-slate-200 hover:bg-slate-700"
        >
          +
        </button>
        <button
          onClick={() => zoomAt(0.8)}
          className="h-9 w-9 rounded-lg border border-slate-600 bg-slate-800/90 text-lg text-slate-200 hover:bg-slate-700"
        >
          −
        </button>
        <button
          onClick={() => setView(initView())}
          className="h-9 w-9 rounded-lg border border-slate-600 bg-slate-800/90 text-xs text-slate-200 hover:bg-slate-700"
        >
          复位
        </button>
      </div>

      <div className="pointer-events-none absolute bottom-2 left-3 text-xs text-slate-500">
        拖动平移 · 滚轮缩放 · 点击两个站名交换位置
      </div>
    </div>
  )
}
