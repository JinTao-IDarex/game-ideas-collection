// ─── 末班车 · 线网数据 ─────────────────────────────────────────────
// 一座虚构城市「不夜城」，6 条线路，站名是程序员的日常彩蛋。
// 坐标单位：格。渲染时 ×64px。

export interface StationDef {
  id: string
  name: string
  x: number
  y: number
  /** 标签偏移（格），可选，默认自动 */
  lx?: number
  ly?: number
  anchor?: 'start' | 'middle' | 'end'
}

export interface LineDef {
  id: string
  name: string
  short: string // 正方形色块用
  color: string
  stations: string[]
  /** 末班车从两端终点站同时发出的时刻（分钟，自 0:00 起） */
  lastTrain: number
}

export const HOP_MINUTES = 2 // 站间行车 2 分钟
export const TRANSFER_MINUTES = 6 // 换乘步行 6 分钟
export const TRAIN_INTERVAL = 5 // 发车间隔 5 分钟
export const SERVICE_START = 20 * 60 // 运营服务从 20:00 起纳入班次表
export const BIKE_MINUTES = 4 // 共享单车：相邻站 4 分钟，不受熄灯限制
export const BIKE_USES = 3 // 全程 3 次骑行体力

export const STATIONS: StationDef[] = [
  // 1号线 y=6
  { id: 'kjy', name: '科技园西', x: 1, y: 6, ly: 1 },
  { id: 'xqc', name: '需求池', x: 3, y: 6, ly: 1 },
  { id: 'sx', name: '上线', x: 5, y: 6, ly: -1.2 },
  { id: 'gw', name: '工位', x: 7, y: 6, ly: 1 },
  { id: 'kfd', name: '咖啡因大道', x: 9, y: 6, ly: -1.2 },
  { id: 'jbf', name: '加班大厦', x: 11, y: 6, ly: 1 },
  { id: 'czc', name: '城中村', x: 13, y: 6, ly: 1 },
  // 2号线 y=9
  { id: 'mt', name: '码头', x: 1, y: 9, ly: 1 },
  { id: 'jg', name: '旧港', x: 3, y: 9, ly: 1 },
  { id: 'hdl', name: '海底捞', x: 5, y: 9, ly: 1 },
  { id: 'rmgc', name: '人民广场', x: 7, y: 9, ly: 1 },
  { id: 'wxc', name: '万象城', x: 9, y: 9, ly: 1 },
  { id: 'dz', name: '东站', x: 11, y: 9, ly: -1.2 },
  { id: 'jcb', name: '机场北', x: 13, y: 9, ly: 1 },
  // 3号线 x=5
  { id: 'dxc', name: '大学城', x: 5, y: 1, lx: 1 },
  { id: 'tsg', name: '图书馆', x: 5, y: 3, lx: -1, anchor: 'end' },
  { id: 'nz', name: '南站', x: 5, y: 11, lx: 1 },
  // 4号线 x=9
  { id: 'bz', name: '北站', x: 9, y: 1, lx: 1 },
  { id: 'smzx', name: '市民中心', x: 9, y: 3, lx: 1 },
  { id: 'bj', name: '滨江', x: 9, y: 11, lx: 1 },
  // 5号线（紫）
  { id: 'wy', name: '望月', x: 2, y: 2, ly: -1.1 },
  { id: 'zcl', name: '知春里', x: 4, y: 4, lx: -1, anchor: 'end' },
  { id: 'nh', name: '南湖', x: 7, y: 11, ly: 1.2 },
  // 6号线（青）
  { id: 'hzd', name: '会展东', x: 13, y: 2, ly: -1.1 },
  { id: 'blz', name: '白鹭洲', x: 11, y: 4, lx: 1 },
  { id: 'bsq', name: '保税区', x: 11, y: 11, lx: 1 },
]

export const LINES: LineDef[] = [
  {
    id: 'L1', name: '1号线', short: '1', color: '#f2555a', lastTrain: 23 * 60 + 40,
    stations: ['kjy', 'xqc', 'sx', 'gw', 'kfd', 'jbf', 'czc'],
  },
  {
    id: 'L2', name: '2号线', short: '2', color: '#3b9eff', lastTrain: 23 * 60 + 20,
    stations: ['mt', 'jg', 'hdl', 'rmgc', 'wxc', 'dz', 'jcb'],
  },
  {
    id: 'L3', name: '3号线', short: '3', color: '#35b878', lastTrain: 22 * 60 + 50,
    stations: ['dxc', 'tsg', 'sx', 'hdl', 'nz'],
  },
  {
    id: 'L4', name: '4号线', short: '4', color: '#ff8b3e', lastTrain: 23 * 60 + 5,
    stations: ['bz', 'smzx', 'kfd', 'wxc', 'bj'],
  },
  {
    id: 'L5', name: '5号线', short: '5', color: '#a06bff', lastTrain: 22 * 60 + 20,
    stations: ['wy', 'zcl', 'gw', 'rmgc', 'nh'],
  },
  {
    id: 'L6', name: '6号线', short: '6', color: '#19c2b8', lastTrain: 22 * 60 + 35,
    stations: ['hzd', 'blz', 'jbf', 'dz', 'bsq'],
  },
]

export const STATION_MAP: Record<string, StationDef> = Object.fromEntries(
  STATIONS.map((s) => [s.id, s]),
)

/** 站点 → 所属线路 */
export const STATION_LINES: Record<string, LineDef[]> = {}
for (const line of LINES) {
  for (const sid of line.stations) {
    ;(STATION_LINES[sid] ??= []).push(line)
  }
}

export function fmtClock(min: number): string {
  const m = Math.floor(min)
  const h = Math.floor(m / 60) % 24
  const mm = m % 60
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}
