# -*- coding: utf-8 -*-
"""用高德地铁官方绘图数据生成五城互联地铁图 HTML"""
import json, os

BASE = os.path.dirname(os.path.abspath(__file__))
CITIES = [
    ("beijing.json",   "北京",   (40,   40,  1150, 690)),
    ("shanghai.json",  "上海",   (1310, 40,  1150, 690)),
    ("guangzhou.json", "广州",   (40,   830, 940,  840)),
    ("shenzhen.json",  "深圳",   (1020, 830, 700,  840)),
    ("hk_xianggang.json", "香港", (1760, 900, 700,  770)),
]

def parse_city(fname):
    d = json.load(open(os.path.join(BASE, "metro-data", fname), encoding="utf-8"))
    # 仅去掉完全重复的条目；同名支线（如东铁线罗湖/落马洲支线）全部保留
    seen = set()
    raw = []
    for l in d["l"]:
        key = (l["ln"], tuple(s["n"] for s in l["st"]))
        if key not in seen:
            seen.add(key)
            raw.append(l)
    lines = []
    for l in raw:
        pts = []
        for i, s in enumerate(l["st"]):
            rs = s.get("rs") or ""
            seg = [tuple(map(float, p.split())) for p in rs.split("|") if p.strip()]
            if not seg:
                p = s.get("p")
                if p: seg = [tuple(map(float, p.split()))]
            for pt in seg:
                if not pts or abs(pts[-1][0]-pt[0]) > 0.01 or abs(pts[-1][1]-pt[1]) > 0.01:
                    pts.append(pt)
            if not seg and i == len(l["st"]) - 1:
                pass
        # 末站兜底
        lastp = l["st"][-1].get("p")
        if lastp:
            lp = tuple(map(float, lastp.split()))
            if abs(pts[-1][0]-lp[0]) > 0.01 or abs(pts[-1][1]-lp[1]) > 0.01:
                pts.append(lp)
        if l.get("lo") == "1" and len(pts) > 2:
            pts.append(pts[0])
        stations = []
        for s in l["st"]:
            p = s.get("p")
            if p:
                x, y = map(float, p.split())
                stations.append([x, y, s["n"]])
        lines.append({"n": l["ln"], "cl": "#" + l.get("cl", "888888"),
                      "loop": l.get("lo") == "1", "pts": pts, "st": stations})
    return lines

def bbox(lines):
    xs, ys = [], []
    for l in lines:
        for x, y in l["pts"]:
            xs.append(x); ys.append(y)
    return min(xs), min(ys), max(xs), max(ys)

def make_transform(lines, rect):
    x0, y0, x1, y1 = bbox(lines)
    X, Y, W, H = rect
    w, h = x1 - x0, y1 - y0
    s = min(W / w, H / h) * 0.94
    ox = X + (W - w * s) / 2 - x0 * s
    oy = Y + (H - h * s) / 2 - y0 * s
    return lambda x, y: (round(ox + x * s, 1), round(oy + y * s, 1))

out_cities = []
hub_index = {}
for fname, cname, rect in CITIES:
    lines = parse_city(fname)
    T = make_transform(lines, rect)
    jl = []
    smap = {}
    for l in lines:
        pts = [list(T(x, y)) for x, y in l["pts"]]
        sts = []
        for x, y, n in l["st"]:
            tx, ty = T(x, y)
            sts.append([tx, ty, n])
            key = n
            if key not in smap:
                smap[key] = {"x": tx, "y": ty, "lines": []}
            smap[key]["lines"].append(l["n"])
        jl.append({"n": l["n"], "cl": l["cl"], "pts": pts, "st": sts})
    inter = [{"x": v["x"], "y": v["y"], "n": k, "c": len(v["lines"])}
             for k, v in smap.items() if len(v["lines"]) > 1]
    out_cities.append({"name": cname, "rect": rect, "lines": jl, "inter": inter})
    for k, v in smap.items():
        hub_index[(cname, k)] = (v["x"], v["y"])
    nst = sum(len(l["st"]) for l in jl)
    print(f"{cname}: {len(jl)} 条线, {nst} 站次, 换乘站 {len(inter)} 个")

def hub(city, *names):
    for n in names:
        if (city, n) in hub_index:
            return hub_index[(city, n)]
    raise KeyError(city + str(names))

def terminus_line(city, st_name):
    """找到以该站为终点站的线路（名称+颜色）；找不到则取任意过路线"""
    cand = None
    for c in out_cities:
        if c["name"] != city:
            continue
        for l in c["lines"]:
            names = [s[2] for s in l["st"]]
            if names and (names[0] == st_name or names[-1] == st_name):
                return l["n"], l["cl"]
            if st_name in names:
                cand = (l["n"], l["cl"])
    if cand:
        return cand
    raise KeyError(city + ":" + st_name)

# 贯通运营：一座城市线路的终点 = 另一座城市线路的起点
LINKS = [
    ("北京", "天宫院",   "上海", "富锦路"),    # 京4号线大兴线 → 沪1号线
    ("北京", "郭公庄",   "广州", "嘉禾望岗"),  # 京9号线 → 穗2号线
    ("上海", "上海松江站", "深圳", "碧头"),  # 沪9号线 → 深11号线
    ("广州", "文冲",     "深圳", "机场东"),    # 穗5号线 → 深1号线
    ("深圳", "罗湖",     "香港", "罗湖"),      # 深1号线 → 港东铁线（真实口岸）
    ("深圳", "福田口岸", "香港", "落马洲"),    # 深4号线 → 港东铁线支线（真实口岸）
]

def bezier(a, b):
    dx, dy = b[0] - a[0], b[1] - a[1]
    if abs(dy) >= abs(dx):
        c1 = [round(a[0], 1), round(a[1] + dy * 0.45, 1)]
        c2 = [round(b[0], 1), round(b[1] - dy * 0.45, 1)]
    else:
        c1 = [round(a[0] + dx * 0.45, 1), round(a[1], 1)]
        c2 = [round(b[0] - dx * 0.45, 1), round(b[1], 1)]
    return f"M {a[0]} {a[1]} C {c1[0]} {c1[1]} {c2[0]} {c2[1]} {b[0]} {b[1]}"

links = []
for ca_city, sa, cb_city, sb in LINKS:
    a = hub(ca_city, sa)
    b = hub(cb_city, sb)
    la, cla = terminus_line(ca_city, sa)
    lb, clb = terminus_line(cb_city, sb)
    label = f"{la} ⇄ {lb}"
    if sa == "罗湖":
        label = "罗湖口岸 · " + label
    if sa == "福田口岸":
        label = "福田口岸 · " + label
    links.append({"a": list(a), "b": list(b), "ca": cla, "cb": clb,
                  "d": bezier(a, b), "label": label})
    print(f"贯通: {ca_city}{la}({sa}) → {cb_city}{lb}({sb})  {cla}->{clb}")

data = {"cities": out_cities, "links": links}

html_head = """<!doctype html>
<html lang="zh">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>华夏都市圈轨道交通图（真实线路版）</title>
<style>
  body{margin:0;background:#F5F1E8;font-family:"Microsoft YaHei","PingFang SC","Noto Sans CJK SC",sans-serif;color:#3a372f}
  header{padding:16px 26px 6px;display:flex;align-items:baseline;gap:18px;flex-wrap:wrap}
  h1{margin:0;font-size:24px;letter-spacing:4px}
  .sub{color:#8a8474;font-size:12.5px;letter-spacing:1px}
  .wrap{display:flex;align-items:stretch}
  #stage{flex:1;min-width:0}
  svg{width:100%;height:auto;display:block;cursor:grab;touch-action:none}
  svg:active{cursor:grabbing}
  aside{width:250px;padding:4px 18px 20px 16px;font-size:12.5px;border-left:1px solid #E2DCCB;background:#FBF8F1;max-height:80vh;overflow:auto}
  .lg-city{font-weight:700;margin:14px 0 5px;font-size:13.5px;letter-spacing:2px;border-bottom:1px solid #E2DCCB;padding-bottom:3px}
  .lg{display:flex;align-items:center;gap:8px;margin:3px 0}
  .chip{width:24px;height:8px;border-radius:4px;flex:none}
  .dash{width:24px;height:0;border-top:5px dashed;flex:none;border-radius:2px}
  .note{font-size:11.5px;color:#99917d;margin-top:14px;line-height:1.75}
  .toolbar{position:absolute;left:70px;top:96px;background:#fff;border:1px solid #DDD6C4;border-radius:8px;padding:6px 10px;font-size:12px;box-shadow:0 2px 8px rgba(0,0,0,.08)}
  .toolbar label{display:flex;align-items:center;gap:5px;margin:2px 0;cursor:pointer}
  text{user-select:none}
</style>
</head>
<body>
<header>
  <h1>华夏都市圈轨道交通图</h1>
  <div class="sub">北京 · 上海 · 广州 · 深圳 · 香港 —— 真实官方线路数据绘制（滚轮缩放 / 拖拽平移）</div>
</header>
<div class="wrap">
  <div id="stage" style="position:relative">
    <svg id="map" viewBox="0 0 2500 1760"></svg>
    <div class="toolbar">
      <label><input type="checkbox" id="ckAll"> 显示全部站名</label>
      <label><input type="checkbox" id="ckInter" checked> 换乘站标注</label>
    </div>
  </div>
  <aside id="legend"></aside>
</div>
<script>
var DATA = __DATA__;
"""

html_tail = """
var NS='http://www.w3.org/2000/svg';
var svg=document.getElementById('map');
function el(t,attrs,parent){var e=document.createElementNS(NS,t);for(var k in attrs)e.setAttribute(k,attrs[k]);(parent||svg).appendChild(e);return e;}
function pathOf(pts){return 'M '+pts.map(function(p){return p[0]+' '+p[1];}).join(' L ');}

el('rect',{x:0,y:0,width:2500,height:1760,fill:'#FBF8F1'});

// 城区框 + 城名
DATA.cities.forEach(function(c){
  var r=c.rect;
  el('rect',{x:r[0],y:r[1],width:r[2],height:r[3],rx:20,fill:'#FFFFFF','fill-opacity':.6,stroke:'#D9D2C2','stroke-width':2,'stroke-dasharray':'9 7'});
  var t=el('text',{x:r[0]+22,y:r[1]+42,'font-size':30,'letter-spacing':10,fill:'#A79F8B','font-weight':700});
  t.textContent=c.name;
});

var gLines=el('g',{}), gLink=el('g',{}), gSt=el('g',{}), gInter=el('g',{}), gAll=el('g',{visibility:'hidden'});
var defs=el('defs',{});

// 真实线路
DATA.cities.forEach(function(c){
  var seenLn={};
  c.lines.forEach(function(l){
    el('path',{d:pathOf(l.pts),fill:'none',stroke:l.cl,'stroke-width':4.2,'stroke-linecap':'round','stroke-linejoin':'round'},gLines);
    // 两端线名（同名支线只标一次）
    if(!seenLn[l.n]){seenLn[l.n]=1;
    [l.pts[0],l.pts[l.pts.length-1]].forEach(function(p,i){
      var t=el('text',{x:p[0]+(i?6:-6),y:p[1]-8,'font-size':11,'font-weight':700,fill:l.cl,'text-anchor':i?'start':'end','paint-order':'stroke',stroke:'#fff','stroke-width':3},gLines);
      t.textContent=l.n;
    });}
    l.st.forEach(function(s){
      el('circle',{cx:s[0],cy:s[1],r:3,fill:'#fff',stroke:l.cl,'stroke-width':1.8},gSt);
      var t=el('text',{x:s[0]+5,y:s[1]-4,'font-size':9,fill:'#777','paint-order':'stroke',stroke:'#FBF8F1','stroke-width':2.5},gAll);
      t.textContent=s[2];
    });
  });
  // 换乘站
  c.inter.forEach(function(s){
    el('circle',{cx:s.x,cy:s.y,r:6,fill:'#fff',stroke:'#333','stroke-width':2.4},gInter);
    var t=el('text',{x:s.x+7,y:s.y-7,'font-size':11.5,'font-weight':700,fill:'#222','paint-order':'stroke',stroke:'#FBF8F1','stroke-width':3.5},gInter);
    t.textContent=s.n;
  });
});

// 贯通运营连接线：线路终点直接延伸为邻城线路起点（渐变色平滑过渡）
DATA.links.forEach(function(L,i){
  var g=el('linearGradient',{id:'lk'+i,gradientUnits:'userSpaceOnUse',x1:L.a[0],y1:L.a[1],x2:L.b[0],y2:L.b[1]},defs);
  el('stop',{offset:'0%','stop-color':L.ca},g);
  el('stop',{offset:'100%','stop-color':L.cb},g);
  var p=el('path',{d:L.d,fill:'none',stroke:'url(#lk'+i+')','stroke-width':5.5,'stroke-linecap':'round'},gLink);
  var m=p.getPointAtLength(p.getTotalLength()/2);
  [L.a,L.b].forEach(function(pt){
    el('circle',{cx:pt[0],cy:pt[1],r:7,fill:'#fff',stroke:'#333','stroke-width':2.6},gLink);
  });
  var t=el('text',{x:m.x+8,y:m.y-10,'font-size':13,'font-weight':700,fill:'#555','paint-order':'stroke',stroke:'#FBF8F1','stroke-width':4},gLink);
  t.textContent=L.label;
});

// 缩放 / 平移
var vb=[0,0,2500,1760];
function setVB(){svg.setAttribute('viewBox',vb.join(' '));}
svg.addEventListener('wheel',function(e){
  e.preventDefault();
  var f=e.deltaY>0?1.2:1/1.2;
  var pt=svg.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;
  var m=pt.matrixTransform(svg.getScreenCTM().inverse());
  var w=vb[2]*f,h=vb[3]*f;
  vb=[m.x-(m.x-vb[0])*f, m.y-(m.y-vb[1])*f, w, h];
  setVB();
},{passive:false});
var drag=null;
svg.addEventListener('pointerdown',function(e){drag={x:e.clientX,y:e.clientY,vb:vb.slice()};svg.setPointerCapture(e.pointerId);});
svg.addEventListener('pointermove',function(e){
  if(!drag)return;
  var sc=vb[2]/svg.clientWidth;
  vb=[drag.vb[0]-(e.clientX-drag.x)*sc, drag.vb[1]-(e.clientY-drag.y)*sc, drag.vb[2], drag.vb[3]];
  setVB();
});
svg.addEventListener('pointerup',function(){drag=null;});

// 图例
var legend=document.getElementById('legend');
DATA.cities.forEach(function(c){
  var h=document.createElement('div');h.className='lg-city';h.textContent=c.name+'（'+c.lines.length+' 条）';legend.appendChild(h);
  var seen={};
  c.lines.forEach(function(l){
    if(seen[l.n])return;seen[l.n]=1;
    var d=document.createElement('div');d.className='lg';
    d.innerHTML='<span class="chip" style="background:'+l.cl+'"></span>'+l.n;
    legend.appendChild(d);
  });
});
var hx=document.createElement('div');hx.className='lg-city';hx.textContent='跨城贯通运营（虚构）';legend.appendChild(hx);
DATA.links.forEach(function(L){
  var d=document.createElement('div');d.className='lg';
  d.innerHTML='<span class="chip" style="background:linear-gradient(90deg,'+L.ca+','+L.cb+')"></span>'+L.label;
  legend.appendChild(d);
});
var note=document.createElement('div');note.className='note';
note.innerHTML='说明：<br>· 五城线路按高德地铁官方示意图绘图坐标 1:1 绘制，颜色为官方线路色。<br>· 渐变色连接线为虚构的"贯通运营"：一座城市线路的终点站直接延伸为另一座城市线路的起点（如北京4号线大兴线终点天宫院 → 上海1号线起点富锦路），端站画为大圈换乘节点。<br>· 深圳罗湖→香港罗湖、深圳福田口岸→香港落马洲为真实存在的口岸衔接。<br>· 滚轮缩放可查看每座城的完整细节。';
legend.appendChild(note);

document.getElementById('ckAll').onchange=function(){gAll.setAttribute('visibility',this.checked?'visible':'hidden');};
document.getElementById('ckInter').onchange=function(){gInter.setAttribute('visibility',this.checked?'visible':'hidden');};
</script>
</body>
</html>
"""

out = html_head.replace("__DATA__", json.dumps(data, ensure_ascii=False, separators=(",", ":"))) + html_tail
target = os.path.join(BASE, "huaxia-metro-map.html")
open(target, "w", encoding="utf-8").write(out)
print("written:", target, os.path.getsize(target), "bytes")
