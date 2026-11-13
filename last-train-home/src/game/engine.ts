// ─── 末班车 v2 · 游戏引擎（纯逻辑，无渲染） ────────────────────────
// v2 核心：真实班次表 + 掐点换乘 + 共享单车兜底
import {
  LINES, STATION_MAP, STATION_LINES,
  HOP_MINUTES, TRANSFER_MINUTES, TRAIN_INTERVAL, SERVICE_START,
  BIKE_MINUTES, BIKE_USES, fmtClock,
  type LineDef,
} from './network'

export type Difficulty = 'easy' | 'normal' | 'hell'
export type Phase = 'menu' | 'playing' | 'riding' | 'won' | 'lost'
export type Mode = 'metro' | 'street'

export const DIFFICULTY: Record<Difficulty, { label: string; desc: string; startMin: number }> = {
  easy:   { label: '佛系下班', desc: '21:00 出发，时间充裕', startMin: 21 * 60 },
  normal: { label: '标准加班', desc: '21:30 出发，有点紧张', startMin: 21 * 60 + 30 },
  hell:   { label: '地狱需求', desc: '22:00 出发，末班车已在路上', startMin: 22 * 60 },
}

export interface Edge { a: string; b: string; lineId: string }
export interface Ride {
  from: string
  to: string
  lineId: string | null
  byBike: boolean
  depart: number // 发车/出发时刻（now < depart 时为候车中）
  arrive: number
  isLast: boolean // 是否末班车
}
export interface AlertMsg { id: number; min: number; text: string; kind: 'info' | 'warn' | 'dead' }

export interface GameState {
  phase: Phase
  difficulty: Difficulty
  now: number
  home: string
  at: string
  currentLine: string | null
  ride: Ride | null
  mode: Mode
  bikeLeft: number
  bikeUsed: number
  hops: number
  transfers: number
  linesUsed: string[]
  alerts: AlertMsg[]
  alertedLines: string[]
  loseReason: string
  wonAt: number
}

// ─── 边表 ─────────────────────────────────────────────────────────
export const EDGES: Edge[] = []
for (const line of LINES) {
  for (let i = 0; i < line.stations.length - 1; i++) {
    EDGES.push({ a: line.stations[i], b: line.stations[i + 1], lineId: line.id })
  }
}

export const LINE_MAP: Record<string, LineDef> = Object.fromEntries(LINES.map((l) => [l.id, l]))

// ─── 熄灯时间 ─────────────────────────────────────────────────────
/** 某站在线路 L 上的熄灯时刻：两端末班车同时发出，中间站最晚 */
export function darkTimeOnLine(line: LineDef, stationId: string): number {
  const i = line.stations.indexOf(stationId)
  const n = line.stations.length
  return line.lastTrain + HOP_MINUTES * Math.max(i, n - 1 - i)
}

/** 站点全局熄灯时刻：只要还有一条线活着，站就亮着 */
export function stationDarkTime(stationId: string): number {
  return Math.max(...STATION_LINES[stationId].map((l) => darkTimeOnLine(l, stationId)))
}

export function isStationAlive(stationId: string, t: number): boolean {
  return t < stationDarkTime(stationId)
}

/** 线路是否已全网停运（末班车已从终点发出即算） */
export function lineDead(line: LineDef, t: number): boolean {
  return t >= line.lastTrain
}

// ─── 班次表 ───────────────────────────────────────────────────────
/** 某条线从一个终点站发出的全部班次（升序，含末班车；两端对称同表） */
export function departuresFrom(line: LineDef): number[] {
  const deps: number[] = []
  for (let dep = line.lastTrain; dep >= SERVICE_START; dep -= TRAIN_INTERVAL) {
    deps.unshift(dep)
  }
  return deps
}

export interface NextTrain { time: number; isLast: boolean }

/** 在 from 站乘坐去相邻 to 站方向的下一班车（t 时刻之后） */
export function nextDeparture(line: LineDef, fromId: string, toId: string, t: number): NextTrain | null {
  const i = line.stations.indexOf(fromId)
  const j = line.stations.indexOf(toId)
  if (i < 0 || j < 0 || Math.abs(i - j) !== 1) return null
  const termIdx = j > i ? 0 : line.stations.length - 1
  const distFromTerm = Math.abs(i - termIdx)
  for (const dep of departuresFrom(line)) {
    const pass = dep + HOP_MINUTES * distFromTerm
    if (pass >= t) return { time: pass, isLast: dep === line.lastTrain }
  }
  return null
}

export interface TrainDot { lineId: string; x: number; y: number; isLast: boolean }

/** 当前在线路上行驶的全部列车（渲染用） */
export function activeTrains(line: LineDef, now: number): TrainDot[] {
  const dots: TrainDot[] = []
  const n = line.stations.length
  const trip = HOP_MINUTES * (n - 1)
  for (const termIdx of [0, n - 1]) {
    const dir = termIdx === 0 ? 1 : -1
    for (const dep of departuresFrom(line)) {
      const elapsed = now - dep
      if (elapsed < 0 || elapsed > trip) continue
      const seg = Math.min(Math.floor(elapsed / HOP_MINUTES), n - 2)
      const frac = elapsed / HOP_MINUTES - seg
      const a = STATION_MAP[line.stations[termIdx + seg * dir]]
      const b = STATION_MAP[line.stations[termIdx + (seg + 1) * dir]]
      dots.push({
        lineId: line.id,
        x: a.x + (b.x - a.x) * frac,
        y: a.y + (b.y - a.y) * frac,
        isLast: dep === line.lastTrain,
      })
    }
  }
  return dots
}

// ─── 邻接查询 ─────────────────────────────────────────────────────
export function edgesFrom(stationId: string): Edge[] {
  return EDGES.filter((e) => e.a === stationId || e.b === stationId)
}

function edgeOther(e: Edge, from: string): string {
  return e.a === from ? e.b : e.a
}

// ─── 开局 ─────────────────────────────────────────────────────────
function pick<T>(arr: T[], rnd: () => number): T {
  return arr[Math.floor(rnd() * arr.length)]
}

export function createGame(difficulty: Difficulty, seed = Math.random()): GameState {
  let s = seed * 1e9
  const rnd = () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
  // 家必须安排在 23:10 之后才熄灯的站，保证每局都有解
  const lateStations = Object.keys(STATION_MAP).filter((id) => stationDarkTime(id) >= 23 * 60 + 10)
  const home = pick(lateStations, rnd)
  let at = pick(Object.keys(STATION_MAP), rnd)
  while (at === home) at = pick(Object.keys(STATION_MAP), rnd)

  return {
    phase: 'playing',
    difficulty,
    now: DIFFICULTY[difficulty].startMin,
    home,
    at,
    currentLine: null,
    ride: null,
    mode: 'metro',
    bikeLeft: BIKE_USES,
    bikeUsed: 0,
    hops: 0,
    transfers: 0,
    linesUsed: [],
    alerts: [{ id: 0, min: DIFFICULTY[difficulty].startMin, text: `今晚的家在「${STATION_MAP[home].name}」，末班车不等人。`, kind: 'info' }],
    alertedLines: [],
    loseReason: '',
    wonAt: 0,
  }
}

// ─── 移动检查 ─────────────────────────────────────────────────────
export interface MoveCheck {
  ok: boolean
  reason?: string
  byBike?: boolean
  line?: LineDef
  depart?: number
  arrive?: number
  isLast?: boolean
  walk?: number
}

export function checkMove(st: GameState, target: string, byBike = false): MoveCheck {
  if (st.phase !== 'playing') return { ok: false, reason: '正在车上或候车中' }
  const edges = edgesFrom(st.at).filter((e) => edgeOther(e, st.at) === target)
  if (edges.length === 0) return { ok: false, reason: '不相邻' }

  // ── 共享单车：不看班次、不怕熄灯，4 分钟一站 ──
  if (byBike) {
    if (st.bikeLeft <= 0) return { ok: false, reason: '骑行体力用完了' }
    return { ok: true, byBike: true, depart: st.now, arrive: st.now + BIKE_MINUTES }
  }

  // ── 地铁：掐点等车 ──
  const candidates: { line: LineDef; nd: NextTrain; walk: number }[] = []
  for (const e of edges) {
    const line = LINE_MAP[e.lineId]
    const walk = st.currentLine !== null && st.currentLine !== line.id ? TRANSFER_MINUTES : 0
    const nd = nextDeparture(line, st.at, target, st.now + walk)
    if (nd) candidates.push({ line, nd, walk })
  }
  if (candidates.length === 0) {
    const hadTransfer = edges.some((e) => st.currentLine && e.lineId !== st.currentLine)
    return {
      ok: false,
      reason: hadTransfer ? '换乘走到站台时，末班车刚开走' : '这个方向的末班车已开走',
    }
  }
  // 优先免换乘的当前线路，其次选最早发车的
  const same = candidates.find((c) => c.line.id === st.currentLine)
  const best = same ?? candidates.reduce((a, b) => (a.nd.time <= b.nd.time ? a : b))
  return {
    ok: true,
    line: best.line,
    depart: best.nd.time,
    arrive: best.nd.time + HOP_MINUTES,
    isLast: best.nd.isLast,
    walk: best.walk,
  }
}

export function applyMove(st: GameState, target: string, byBike = false): GameState {
  const c = checkMove(st, target, byBike)
  if (!c.ok) return st
  const alerts = [...st.alerts]
  if (c.byBike) {
    alerts.push({ id: alerts.length, min: st.now, text: `扫了辆共享单车，蹬向「${STATION_MAP[target].name}」`, kind: 'info' })
  } else if (c.walk) {
    alerts.push({ id: alerts.length, min: st.now, text: `换乘${c.line!.name}，狂奔 ${TRANSFER_MINUTES} 分钟…`, kind: 'warn' })
  }
  if (c.isLast && !c.byBike) {
    alerts.push({ id: alerts.length, min: st.now, text: `赶上了${c.line!.name}末班车！`, kind: 'warn' })
  }
  return {
    ...st,
    phase: 'riding',
    ride: {
      from: st.at,
      to: target,
      lineId: c.byBike ? null : c.line!.id,
      byBike: !!c.byBike,
      depart: c.depart!,
      arrive: c.arrive!,
      isLast: !!c.isLast,
    },
    bikeLeft: st.bikeLeft - (c.byBike ? 1 : 0),
    bikeUsed: st.bikeUsed + (c.byBike ? 1 : 0),
    transfers: st.transfers + (c.walk ? 1 : 0),
    hops: st.hops + 1,
    linesUsed: c.byBike || st.linesUsed.includes(c.line!.id) ? st.linesUsed : [...st.linesUsed, c.line!.id],
    alerts,
  }
}

// ─── 时间推进 ─────────────────────────────────────────────────────
export function tick(st: GameState, now: number): GameState {
  let next = { ...st, now }

  // 到站
  if (next.phase === 'riding' && next.ride && now >= next.ride.arrive) {
    next = {
      ...next,
      phase: 'playing',
      at: next.ride.to,
      mode: next.ride.byBike ? 'street' : 'metro',
      currentLine: next.ride.byBike ? null : next.ride.lineId,
      ride: null,
    }
  }

  // 到家（家必须还亮着灯）
  if (next.phase === 'playing' && next.at === next.home && isStationAlive(next.home, now)) {
    return { ...next, phase: 'won', wonAt: now, ride: null }
  }

  // 线路末班车发出提醒
  const alerts = [...next.alerts]
  const alerted = [...next.alertedLines]
  for (const line of LINES) {
    if (!alerted.includes(line.id) && now >= line.lastTrain) {
      alerted.push(line.id)
      alerts.push({ id: alerts.length, min: now, text: `${line.name}末班车已从两端发出，站点开始熄灯`, kind: 'dead' })
    }
  }

  // 当前站即将熄灯提醒
  if (next.phase === 'playing' && next.mode === 'metro') {
    const left = stationDarkTime(next.at) - now
    const alreadyWarned = alerts.some((a) => a.text.includes('即将熄灯') && a.text.includes(STATION_MAP[next.at].name))
    if (left <= 8 && left > 0 && !alreadyWarned) {
      alerts.push({ id: alerts.length, min: now, text: `「${STATION_MAP[next.at].name}」即将熄灯，快上车！`, kind: 'warn' })
    }
  }
  next = { ...next, alerts, alertedLines: alerted }

  // 判负：家熄灯（无论你在哪）
  if (!isStationAlive(next.home, now)) {
    return { ...next, phase: 'lost', loseReason: `家方向的末班车开走了，「${STATION_MAP[next.home].name}」已熄灯。` }
  }
  // 判负：在地铁站内眼睁睁看着灯灭（骑车在街上的不算）
  if (next.phase === 'playing' && next.mode === 'metro' && !isStationAlive(next.at, now)) {
    return { ...next, phase: 'lost', loseReason: `「${STATION_MAP[next.at].name}」的灯在你眼前灭了。` }
  }
  // 判负：骑车到熄灯站且体力耗尽，困在街头
  if (next.phase === 'playing' && next.mode === 'street' && !isStationAlive(next.at, now) && next.bikeLeft <= 0) {
    return { ...next, phase: 'lost', loseReason: '共享单车骑到没电，你站在熄了灯的街口。' }
  }
  return next
}

// ─── 辅助：是否还有路回家（提示用，含单车） ────────────────────────
export function hasPathHome(st: GameState): boolean {
  if (!isStationAlive(st.home, st.now)) return false
  const seen = new Set<string>([st.at])
  const queue = [st.at]
  while (queue.length) {
    const cur = queue.shift()!
    if (cur === st.home) return true
    for (const e of edgesFrom(cur)) {
      const nb = edgeOther(e, cur)
      if (seen.has(nb)) continue
      // 地铁需要两边都亮灯；有体力时单车可以穿过熄灯站
      if ((isStationAlive(nb, st.now) && isStationAlive(cur, st.now)) || st.bikeLeft > 0) {
        seen.add(nb)
        queue.push(nb)
      }
    }
  }
  return false
}

// ─── 结算 ─────────────────────────────────────────────────────────
export function resultTitle(st: GameState): string {
  if (st.phase !== 'won') return '今晚睡公司'
  const t = st.wonAt
  if (t <= 22 * 60 + 30) return '末班车之王 👑'
  if (t <= 23 * 60) return '压哨大师 ⚡'
  return '打工人楷模 🍺'
}

export function shareText(st: GameState): string {
  const lineBar = LINES.map((l) =>
    `${{ L1: '🟥', L2: '🟦', L3: '🟩', L4: '🟧', L5: '🟪', L6: '⬜' }[l.id]}${st.linesUsed.includes(l.id) ? '乘' : l.lastTrain <= st.now ? '熄' : '—'}`,
  ).join(' ')
  const bikePart = st.bikeUsed > 0 ? ` · 🚲×${st.bikeUsed}` : ''
  if (st.phase === 'won') {
    return [
      '🚇 末班车 LAST TRAIN HOME',
      `我在 ${fmtClock(st.wonAt)} 压哨到家，${resultTitle(st)}`,
      `${st.hops} 站 · 换乘 ${st.transfers} 次${bikePart}`,
      lineBar,
      '全城熄灯前，你到家了吗？',
    ].join('\n')
  }
  return [
    '🚇 末班车 LAST TRAIN HOME',
    `我没赶上……${st.loseReason}`,
    `${st.hops} 站 · 换乘 ${st.transfers} 次${bikePart}`,
    lineBar,
    '全城熄灯前，你到家了吗？',
  ].join('\n')
}
