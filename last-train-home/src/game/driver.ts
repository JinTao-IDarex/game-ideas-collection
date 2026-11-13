// ─── 末班车司机 · 游戏引擎（纯逻辑） ───────────────────────────────
// 你开 1 号线末班车：23:00 发车，23:30 前必须回库。
// 每停一站 +4 分钟。站台上每个人都有自己的今夜。
import { STATION_MAP, LINES, fmtClock } from './network'
import { LINE_MAP, type AlertMsg } from './engine'

export const fmtClockD = fmtClock

export const DRIVER_DEPART = 23 * 60 // 23:00 发车
export const DWELL_MINUTES = 4 // 每停一站 4 分钟
export const DEPOT_DEADLINE = 23 * 60 + 30 // 23:30 回库死线，过了断电
export const HOP = 2 // 站间行车 2 分钟
export const CAPACITY = 8

/** 换乘接驳末班 cutoff：到达换乘站晚于此刻，乘客就接不上 */
export const TRANSFER_CUTOFF: Record<string, number> = {
  sx: 23 * 60 + 7, // 上线 · 3号线 23:07
  gw: 23 * 60 + 13, // 工位 · 5号线 23:13
  jbf: 23 * 60 + 22, // 加班大厦 · 6号线 23:22
}

export const DRIVER_LINE = 'L1'
/** 1号线站序 */
export const ROUTE = LINE_MAP[DRIVER_LINE].stations

export interface Passenger {
  id: string
  emoji: string
  name: string
  story: string // 上车点字幕
  from: string // 上车站（均在1号线上）
  to?: string // 1号线内下车站
  transferAt?: string // 换乘站
  transferLine?: string
  destDesc: string // 去向描述
  status: 'waiting' | 'aboard' | 'delivered' | 'stranded'
  note?: string // 结局一句话
}

export interface DriverState {
  phase: 'menu' | 'moving' | 'deciding' | 'done'
  now: number
  nextIdx: number // 正在接近的站（ROUTE 下标）；deciding 时 = 当前停靠的站
  arriveAt: number // moving 状态下到达 nextIdx 的时刻
  passengers: Passenger[]
  stops: number
  alerts: AlertMsg[]
  alertedLines: string[]
  result: 'arrived' | 'blackout' | null
}

export const ROSTER: Omit<Passenger, 'status'>[] = [
  { id: 'wang', emoji: '👴', name: '王叔', story: '在科技园西上车', from: 'kjy', transferAt: 'sx', transferLine: '3号线', destDesc: '去南站陪床，老伴今晚手术' },
  { id: 'zhao', emoji: '👩‍💻', name: '小赵', story: '在科技园西上车', from: 'kjy', to: 'czc', destDesc: '回城中村，猫还饿着' },
  { id: 'pm', emoji: '🧑‍💼', name: '产品经理', story: '在需求池等车', from: 'xqc', transferAt: 'gw', transferLine: '5号线', destDesc: '去人民广场接女朋友下班' },
  { id: 'ky', emoji: '📚', name: '考研党', story: '在需求池等车', from: 'xqc', to: 'czc', destDesc: '回城中村背政治' },
  { id: 'hs', emoji: '😷', name: '护士小刘', story: '在上线等车', from: 'sx', to: 'kfd', destDesc: '咖啡因大道的药店 0 点关门，病人等着药' },
  { id: 'dj', emoji: '🚗', name: '代驾师傅', story: '在上线等车', from: 'sx', transferAt: 'jbf', transferLine: '6号线', destDesc: '去东站接今晚最后一单' },
  { id: 'cx', emoji: '👨‍💻', name: '崩溃的程序员', story: '在工位等车', from: 'gw', to: 'czc', destDesc: '需求又改了，只想回城中村' },
  { id: 'ay', emoji: '💊', name: '药店阿姨', story: '在咖啡因大道等车', from: 'kfd', to: 'czc', destDesc: '回城中村给孙子送药' },
  { id: 'bj', emoji: '📝', name: '夜班编辑', story: '在加班大厦等车', from: 'jbf', to: 'czc', destDesc: '回城中村，天亮前交稿' },
]

// ─── 开局 ─────────────────────────────────────────────────────────
export function createDriverGame(): DriverState {
  const passengers: Passenger[] = ROSTER.map((p) => ({
    ...p,
    status: p.from === 'kjy' ? 'aboard' : 'waiting', // 起点站乘客直接上车
  }))
  return {
    phase: 'moving',
    now: DRIVER_DEPART,
    nextIdx: 1,
    arriveAt: DRIVER_DEPART + HOP,
    passengers,
    stops: 0,
    alerts: [{ id: 0, min: DRIVER_DEPART, text: `末班车 ${fmtClock(DRIVER_DEPART)} 从科技园西发出，${ROSTER.filter((p) => p.from === 'kjy').length} 人上车。`, kind: 'info' }],
    alertedLines: [],
    result: null,
  }
}

// ─── 查询 ─────────────────────────────────────────────────────────
export const waitingAt = (st: DriverState, sid: string) =>
  st.passengers.filter((p) => p.status === 'waiting' && p.from === sid)

export const alightingAt = (st: DriverState, sid: string) =>
  st.passengers.filter(
    (p) => p.status === 'aboard' && (p.to === sid || p.transferAt === sid),
  )

export const aboardCount = (st: DriverState) =>
  st.passengers.filter((p) => p.status === 'aboard').length

export const deliveredCount = (st: DriverState) =>
  st.passengers.filter((p) => p.status === 'delivered').length

/** 某站是否需要玩家决策（没人上下就自动通过） */
export function needsDecision(st: DriverState, sid: string): boolean {
  return waitingAt(st, sid).length > 0 || alightingAt(st, sid).length > 0
}

// ─── 时间推进 ─────────────────────────────────────────────────────
export function driverTick(st: DriverState, now: number): DriverState {
  if (st.phase !== 'moving') return st
  let next = { ...st, now }

  // 环境线停运播报
  const alerts = [...next.alerts]
  const alerted = [...next.alertedLines]
  for (const line of LINES) {
    if (line.id !== DRIVER_LINE && !alerted.includes(line.id) && now >= line.lastTrain) {
      alerted.push(line.id)
      alerts.push({ id: alerts.length, min: now, text: `${line.name}末班车已从两端发出`, kind: 'dead' })
    }
  }
  next = { ...next, alerts, alertedLines: alerted }

  // 回库死线：半路断电
  if (now >= DEPOT_DEADLINE) {
    return {
      ...next,
      phase: 'done',
      result: 'blackout',
      now: DEPOT_DEADLINE,
      alerts: [...next.alerts, { id: next.alerts.length, min: DEPOT_DEADLINE, text: '接触网断电，列车停在了半路。', kind: 'dead' }],
    }
  }

  // 到站
  if (now >= next.arriveAt) {
    const sid = ROUTE[next.nextIdx]
    const isTerminus = next.nextIdx === ROUTE.length - 1
    if (isTerminus) {
      return arriveTerminus(next)
    }
    if (needsDecision(next, sid)) {
      return { ...next, phase: 'deciding', now: next.arriveAt }
    }
    // 无人上下，直接通过
    return { ...next, nextIdx: next.nextIdx + 1, arriveAt: next.arriveAt + HOP }
  }
  return next
}

// ─── 停靠/通过 决策 ────────────────────────────────────────────────
export function driverDecide(st: DriverState, stop: boolean): DriverState {
  if (st.phase !== 'deciding') return st
  const sid = ROUTE[st.nextIdx]
  const sname = STATION_MAP[sid].name
  const arriveT = st.arriveAt
  const passengers = st.passengers.map((p) => ({ ...p }))
  const alerts = [...st.alerts]

  const waiting = passengers.filter((p) => p.status === 'waiting' && p.from === sid)
  const alighting = passengers.filter(
    (p) => p.status === 'aboard' && (p.to === sid || p.transferAt === sid),
  )

  if (stop) {
    // 下车
    for (const p of alighting) {
      if (p.to === sid) {
        p.status = 'delivered'
        p.note = `在${sname}下了车——${p.destDesc}`
        alerts.push({ id: alerts.length, min: arriveT, text: `${p.emoji} ${p.name} 下车了`, kind: 'info' })
      } else if (p.transferAt === sid) {
        const cutoff = TRANSFER_CUTOFF[sid]
        if (arriveT <= cutoff) {
          p.status = 'delivered'
          p.note = `赶上了${p.transferLine}末班——${p.destDesc}`
          alerts.push({ id: alerts.length, min: arriveT, text: `${p.emoji} ${p.name} 赶上了${p.transferLine}末班车！`, kind: 'info' })
        } else {
          p.status = 'stranded'
          p.note = `下车时${p.transferLine}末班刚开走，只能打车`
          alerts.push({ id: alerts.length, min: arriveT, text: `${p.emoji} ${p.name} 眼睁睁看着${p.transferLine}末班开走…`, kind: 'warn' })
        }
      }
    }
    // 上车（先到先得，满载为止）
    let aboard = passengers.filter((p) => p.status === 'aboard').length
    for (const p of waiting) {
      if (aboard < CAPACITY) {
        p.status = 'aboard'
        aboard++
        alerts.push({ id: alerts.length, min: arriveT, text: `${p.emoji} ${p.name} 上车了：${p.destDesc}`, kind: 'info' })
      } else {
        p.status = 'stranded'
        p.note = '车厢满了，没挤上来'
        alerts.push({ id: alerts.length, min: arriveT, text: `${p.emoji} ${p.name} 没能挤上满载的车厢`, kind: 'warn' })
      }
    }
    const dep = arriveT + DWELL_MINUTES
    return {
      ...st,
      phase: 'moving',
      passengers,
      stops: st.stops + 1,
      now: dep,
      nextIdx: st.nextIdx + 1,
      arriveAt: dep + HOP,
      alerts: [...alerts, { id: alerts.length, min: dep, text: `${sname} 停靠 ${DWELL_MINUTES} 分钟，继续向前`, kind: 'info' }],
    }
  }

  // 通过：站台的人被留下；想下车的下不了
  for (const p of waiting) {
    p.status = 'stranded'
    p.note = `在${sname}站台目送末班车驶过`
  }
  if (waiting.length > 0) {
    alerts.push({ id: alerts.length, min: arriveT, text: `你驶过${sname}，${waiting.map((p) => p.emoji + p.name).join('、')} 目送尾灯远去…`, kind: 'dead' })
  }
  for (const p of alighting) {
    p.note = p.to === sid ? `你驶过了 TA 要下的${sname}` : `你驶过了换乘站${sname}`
    alerts.push({ id: alerts.length, min: arriveT, text: `${p.emoji} ${p.name} 拍着车门——${sname}没停`, kind: 'warn' })
  }
  return {
    ...st,
    phase: 'moving',
    passengers,
    nextIdx: st.nextIdx + 1,
    arriveAt: arriveT + HOP,
    alerts,
  }
}

// ─── 终点结算 ─────────────────────────────────────────────────────
function arriveTerminus(st: DriverState): DriverState {
  const passengers = st.passengers.map((p) => ({ ...p }))
  for (const p of passengers) {
    if (p.status !== 'aboard') continue
    if (p.to === 'czc' && !p.note) {
      p.status = 'delivered'
      p.note = `到城中村了——${p.destDesc}`
    } else {
      p.status = 'stranded'
      p.note = p.note ?? '一路坐到了终点站，又打车折返'
    }
  }
  return {
    ...st,
    phase: 'done',
    result: 'arrived',
    passengers,
    alerts: [...st.alerts, { id: st.alerts.length, min: st.arriveAt, text: `末班车 ${fmtClock(st.arriveAt)} 回库。今夜结束了。`, kind: 'info' }],
  }
}

// ─── 结局文案 ─────────────────────────────────────────────────────
export function driverTitle(st: DriverState): string {
  if (st.result === 'blackout') return '半路断电，全城笑话 🕯️'
  const total = st.passengers.length
  const ok = deliveredCount(st)
  if (ok === total) return '今夜无人被落下 👑'
  if (ok >= total - 2) return '好司机 🌟'
  if (ok >= Math.ceil(total / 2)) return '平凡的一夜'
  return '冷漠准点王 🧊'
}

export function driverShareText(st: DriverState): string {
  const rows = st.passengers.map((p) => `${p.status === 'delivered' ? '✅' : '🌧️'}${p.emoji}${p.name}`).join(' ')
  return [
    '🚇 末班车司机 LAST TRAIN DRIVER',
    st.result === 'blackout'
      ? '我停了一路，列车在半路断了电……'
      : `今夜我开末班车：${deliveredCount(st)}/${st.passengers.length} 人到家，停靠 ${st.stops} 站`,
    driverTitle(st),
    rows,
    '换你开这班末班车，你停哪几站？',
  ].join('\n')
}
