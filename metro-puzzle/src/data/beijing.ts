// 北京地铁真实站点数据（1 / 2 / 4 / 5 号线）
// 坐标为示意性地铁图网格坐标（非地理坐标），单位格在渲染时放大。

export type LabelSide = 'top' | 'bottom' | 'left' | 'right'

export interface StationDef {
  id: string
  name: string
  x: number
  y: number
  label: LabelSide
}

export interface LineDef {
  id: string
  name: string
  color: string
  loop?: boolean
  stations: string[] // 按真实顺序排列的站点 id
}

export const STATIONS: Record<string, StationDef> = {
  // ── 1 号线（y = 10，西 → 东）──
  pingguoyuan:   { id: 'pingguoyuan',   name: '苹果园',     x: 0,  y: 10, label: 'bottom' },
  gucheng:       { id: 'gucheng',       name: '古城',       x: 1,  y: 10, label: 'top' },
  bajiao:        { id: 'bajiao',        name: '八角游乐园', x: 2,  y: 10, label: 'bottom' },
  babaoshan:     { id: 'babaoshan',     name: '八宝山',     x: 3,  y: 10, label: 'top' },
  yuquanlu:      { id: 'yuquanlu',      name: '玉泉路',     x: 4,  y: 10, label: 'bottom' },
  wukesong:      { id: 'wukesong',      name: '五棵松',     x: 5,  y: 10, label: 'top' },
  wanshoulu:     { id: 'wanshoulu',     name: '万寿路',     x: 6,  y: 10, label: 'bottom' },
  gongzhufen:    { id: 'gongzhufen',    name: '公主坟',     x: 7,  y: 10, label: 'top' },
  junbo:         { id: 'junbo',         name: '军事博物馆', x: 8,  y: 10, label: 'bottom' },
  muxidi:        { id: 'muxidi',        name: '木樨地',     x: 9,  y: 10, label: 'top' },
  nanlishilu:    { id: 'nanlishilu',    name: '南礼士路',   x: 10, y: 10, label: 'bottom' },
  fuxingmen:     { id: 'fuxingmen',     name: '复兴门',     x: 11, y: 10, label: 'bottom' },
  xidan:         { id: 'xidan',         name: '西单',       x: 12, y: 10, label: 'top' },
  tiananmenxi:   { id: 'tiananmenxi',   name: '天安门西',   x: 13, y: 10, label: 'bottom' },
  tiananmendong: { id: 'tiananmendong', name: '天安门东',   x: 14, y: 10, label: 'top' },
  wangfujing:    { id: 'wangfujing',    name: '王府井',     x: 15, y: 10, label: 'bottom' },
  dongdan:       { id: 'dongdan',       name: '东单',       x: 16, y: 10, label: 'top' },
  jianguomen:    { id: 'jianguomen',    name: '建国门',     x: 17, y: 10, label: 'bottom' },
  yonganli:      { id: 'yonganli',      name: '永安里',     x: 18, y: 10, label: 'top' },
  guomao:        { id: 'guomao',        name: '国贸',       x: 19, y: 10, label: 'bottom' },
  dawanglu:      { id: 'dawanglu',      name: '大望路',     x: 20, y: 10, label: 'top' },
  sihui:         { id: 'sihui',         name: '四惠',       x: 21, y: 10, label: 'bottom' },
  sihuidong:     { id: 'sihuidong',     name: '四惠东',     x: 22, y: 10, label: 'top' },

  // ── 2 号线（环线，矩形：x∈[11,17]，y∈[6,12]）──
  xizhimen:      { id: 'xizhimen',      name: '西直门',     x: 11,   y: 6,  label: 'left' },
  jishuitan:     { id: 'jishuitan',     name: '积水潭',     x: 12.5, y: 6,  label: 'top' },
  guloudajie:    { id: 'guloudajie',    name: '鼓楼大街',   x: 13.5, y: 6,  label: 'top' },
  andingmen:     { id: 'andingmen',     name: '安定门',     x: 14.5, y: 6,  label: 'top' },
  yonghegong:    { id: 'yonghegong',    name: '雍和宫',     x: 16,   y: 6,  label: 'top' },
  dongzhimen:    { id: 'dongzhimen',    name: '东直门',     x: 17,   y: 6,  label: 'right' },
  dongssitiao:   { id: 'dongssitiao',   name: '东四十条',   x: 17,   y: 8,  label: 'right' },
  chaoyangmen:   { id: 'chaoyangmen',   name: '朝阳门',     x: 17,   y: 9,  label: 'right' },
  beijingzhan:   { id: 'beijingzhan',   name: '北京站',     x: 17,   y: 11, label: 'right' },
  chongwenmen:   { id: 'chongwenmen',   name: '崇文门',     x: 16,   y: 12, label: 'bottom' },
  qianmen:       { id: 'qianmen',       name: '前门',       x: 14,   y: 12, label: 'bottom' },
  hepingmen:     { id: 'hepingmen',     name: '和平门',     x: 13,   y: 12, label: 'bottom' },
  xuanwumen:     { id: 'xuanwumen',     name: '宣武门',     x: 12,   y: 12, label: 'bottom' },
  changchunjie:  { id: 'changchunjie',  name: '长椿街',     x: 11,   y: 11, label: 'left' },
  fuchengmen:    { id: 'fuchengmen',    name: '阜成门',     x: 11,   y: 8,  label: 'left' },
  chegongzhuang: { id: 'chegongzhuang', name: '车公庄',     x: 11,   y: 7,  label: 'left' },

  // ── 4 号线（北段 x=11 竖直，过西直门后挪到 x=12 竖直）──
  anheqiaobei:        { id: 'anheqiaobei',        name: '安河桥北',     x: 11, y: -5, label: 'right' },
  beigongmen:         { id: 'beigongmen',         name: '北宫门',       x: 11, y: -4, label: 'right' },
  xiyuan:             { id: 'xiyuan',             name: '西苑',         x: 11, y: -3, label: 'right' },
  yuanmingyuan:       { id: 'yuanmingyuan',       name: '圆明园',       x: 11, y: -2, label: 'right' },
  beidadongmen:       { id: 'beidadongmen',       name: '北京大学东门', x: 11, y: -1, label: 'right' },
  zhongguancun:       { id: 'zhongguancun',       name: '中关村',       x: 11, y: 0,  label: 'right' },
  haidianhuangzhuang: { id: 'haidianhuangzhuang', name: '海淀黄庄',     x: 11, y: 1,  label: 'right' },
  renmindaxue:        { id: 'renmindaxue',        name: '人民大学',     x: 11, y: 2,  label: 'right' },
  weigongcun:         { id: 'weigongcun',         name: '魏公村',       x: 11, y: 3,  label: 'right' },
  guotu:              { id: 'guotu',              name: '国家图书馆',   x: 11, y: 4,  label: 'right' },
  dongwuyuan:         { id: 'dongwuyuan',         name: '动物园',       x: 11, y: 5,  label: 'right' },
  xinjiekou:          { id: 'xinjiekou',          name: '新街口',       x: 12, y: 5,  label: 'right' },
  pinganli:           { id: 'pinganli',           name: '平安里',       x: 12, y: 7,  label: 'right' },
  xisi:               { id: 'xisi',               name: '西四',         x: 12, y: 8,  label: 'right' },
  lingjinghutong:     { id: 'lingjinghutong',     name: '灵境胡同',     x: 12, y: 9,  label: 'right' },
  caishikou:          { id: 'caishikou',          name: '菜市口',       x: 12, y: 13, label: 'right' },
  taoranting:         { id: 'taoranting',         name: '陶然亭',       x: 12, y: 14, label: 'right' },
  beijingnanzhan:     { id: 'beijingnanzhan',     name: '北京南站',     x: 12, y: 15, label: 'right' },
  majiabao:           { id: 'majiabao',           name: '马家堡',       x: 12, y: 16, label: 'right' },
  jiaomenxi:          { id: 'jiaomenxi',          name: '角门西',       x: 12, y: 17, label: 'right' },
  gongyixiqiao:       { id: 'gongyixiqiao',       name: '公益西桥',     x: 12, y: 18, label: 'right' },

  // ── 5 号线（x = 16 竖直，北 → 南）──
  tiantongyuanbei:  { id: 'tiantongyuanbei',  name: '天通苑北',     x: 16, y: -5, label: 'right' },
  tiantongyuan:     { id: 'tiantongyuan',     name: '天通苑',       x: 16, y: -4, label: 'right' },
  tiantongyuannan:  { id: 'tiantongyuannan',  name: '天通苑南',     x: 16, y: -3, label: 'right' },
  lishuiqiao:       { id: 'lishuiqiao',       name: '立水桥',       x: 16, y: -2, label: 'right' },
  lishuiqiaonan:    { id: 'lishuiqiaonan',    name: '立水桥南',     x: 16, y: -1, label: 'right' },
  beiyuanlubei:     { id: 'beiyuanlubei',     name: '北苑路北',     x: 16, y: 0,  label: 'right' },
  datunludong:      { id: 'datunludong',      name: '大屯路东',     x: 16, y: 1,  label: 'right' },
  huixinxiijiebei:  { id: 'huixinxiijiebei',  name: '惠新西街北口', x: 16, y: 2,  label: 'right' },
  huixinxiijienan:  { id: 'huixinxiijienan',  name: '惠新西街南口', x: 16, y: 3,  label: 'right' },
  hepingxiqiao:     { id: 'hepingxiqiao',     name: '和平西桥',     x: 16, y: 4,  label: 'left' },
  hepinglibeijie:   { id: 'hepinglibeijie',   name: '和平里北街',   x: 16, y: 5,  label: 'left' },
  beixinqiao:       { id: 'beixinqiao',       name: '北新桥',       x: 16, y: 7,  label: 'left' },
  zhangzizhonglu:   { id: 'zhangzizhonglu',   name: '张自忠路',     x: 16, y: 8,  label: 'left' },
  dongsi:           { id: 'dongsi',           name: '东四',         x: 16, y: 9,  label: 'left' },
  dengshikou:       { id: 'dengshikou',       name: '灯市口',       x: 16, y: 9.5, label: 'right' },
  ciqikou:          { id: 'ciqikou',          name: '磁器口',       x: 16, y: 13, label: 'left' },
  tiantandongmen:   { id: 'tiantandongmen',   name: '天坛东门',     x: 16, y: 14, label: 'left' },
  puhuangyu:        { id: 'puhuangyu',        name: '蒲黄榆',       x: 16, y: 15, label: 'left' },
  liujiayao:        { id: 'liujiayao',        name: '刘家窑',       x: 16, y: 16, label: 'left' },
  songjiazhuang:    { id: 'songjiazhuang',    name: '宋家庄',       x: 16, y: 17, label: 'left' },
}

export const LINES: LineDef[] = [
  {
    id: 'L1',
    name: '1号线',
    color: '#C23A30',
    stations: [
      'pingguoyuan', 'gucheng', 'bajiao', 'babaoshan', 'yuquanlu', 'wukesong',
      'wanshoulu', 'gongzhufen', 'junbo', 'muxidi', 'nanlishilu', 'fuxingmen',
      'xidan', 'tiananmenxi', 'tiananmendong', 'wangfujing', 'dongdan',
      'jianguomen', 'yonganli', 'guomao', 'dawanglu', 'sihui', 'sihuidong',
    ],
  },
  {
    id: 'L2',
    name: '2号线(环)',
    color: '#00619B',
    loop: true,
    stations: [
      'xizhimen', 'jishuitan', 'guloudajie', 'andingmen', 'yonghegong',
      'dongzhimen', 'dongssitiao', 'chaoyangmen', 'jianguomen', 'beijingzhan',
      'chongwenmen', 'qianmen', 'hepingmen', 'xuanwumen', 'changchunjie',
      'fuxingmen', 'fuchengmen', 'chegongzhuang',
    ],
  },
  {
    id: 'L4',
    name: '4号线',
    color: '#008C95',
    stations: [
      'anheqiaobei', 'beigongmen', 'xiyuan', 'yuanmingyuan', 'beidadongmen',
      'zhongguancun', 'haidianhuangzhuang', 'renmindaxue', 'weigongcun',
      'guotu', 'dongwuyuan', 'xizhimen', 'xinjiekou', 'pinganli', 'xisi',
      'lingjinghutong', 'xidan', 'xuanwumen', 'caishikou', 'taoranting',
      'beijingnanzhan', 'majiabao', 'jiaomenxi', 'gongyixiqiao',
    ],
  },
  {
    id: 'L5',
    name: '5号线',
    color: '#AA0061',
    stations: [
      'tiantongyuanbei', 'tiantongyuan', 'tiantongyuannan', 'lishuiqiao',
      'lishuiqiaonan', 'beiyuanlubei', 'datunludong', 'huixinxiijiebei',
      'huixinxiijienan', 'hepingxiqiao', 'hepinglibeijie', 'yonghegong',
      'beixinqiao', 'zhangzizhonglu', 'dongsi', 'dengshikou', 'dongdan',
      'chongwenmen', 'ciqikou', 'tiantandongmen', 'puhuangyu', 'liujiayao',
      'songjiazhuang',
    ],
  },
]

export interface LevelDef {
  id: string
  title: string
  subtitle: string
  lineIds: string[]
  hints: number
}

export const LEVELS: LevelDef[] = [
  {
    id: 'easy',
    title: '第一关 · 老城一环',
    subtitle: '1号线 + 2号线环线，北京地铁的起点',
    lineIds: ['L1', 'L2'],
    hints: 3,
  },
  {
    id: 'normal',
    title: '第二关 · 南北纵贯',
    subtitle: '加入4号线，从安河桥北到公益西桥',
    lineIds: ['L1', 'L2', 'L4'],
    hints: 4,
  },
  {
    id: 'hard',
    title: '第三关 · 四线迷城',
    subtitle: '再加入5号线，84座车站的终极考验',
    lineIds: ['L1', 'L2', 'L4', 'L5'],
    hints: 5,
  },
]

/** 某站点经过的线路 */
export function linesOf(stationId: string, lineIds: string[]): LineDef[] {
  return LINES.filter(
    (l) => lineIds.includes(l.id) && l.stations.includes(stationId),
  )
}

/** 换乘站（在本关线路中属于 ≥2 条线） */
export function isTransfer(stationId: string, lineIds: string[]): boolean {
  return linesOf(stationId, lineIds).length >= 2
}

/** 本关所有去重站点 id */
export function levelStations(lineIds: string[]): string[] {
  const set = new Set<string>()
  for (const l of LINES) {
    if (lineIds.includes(l.id)) l.stations.forEach((s) => set.add(s))
  }
  return [...set]
}
