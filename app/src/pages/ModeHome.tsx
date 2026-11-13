// ─── 模式选择：乘客 / 司机 ─────────────────────────────────────────
import { Link } from 'react-router'

export default function ModeHome() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center gap-8 p-4" style={{ background: 'radial-gradient(1200px 700px at 50% -10%, #16203a 0%, #060a18 60%)' }}>
      <div className="text-center">
        <div className="text-6xl mb-4">🌃</div>
        <h1 className="text-5xl font-black tracking-widest text-slate-100 mb-2" style={{ textShadow: '0 0 30px rgba(125,180,255,.5)' }}>末班车</h1>
        <p className="text-slate-400 tracking-[.4em] text-sm">LAST TRAIN</p>
      </div>

      <div className="flex gap-5 flex-wrap justify-center">
        <Link to="/passenger" className="no-underline">
          <div
            className="w-72 rounded-2xl p-6 transition-transform hover:scale-[1.03]"
            style={{ background: 'rgba(20,30,52,.85)', border: '1px solid #22304e' }}
          >
            <div className="text-4xl mb-3">🧍</div>
            <div className="text-xl font-bold text-slate-100 mb-2">乘客模式</div>
            <p className="text-sm text-slate-400 leading-6">
              全城末班车陆续发出，站点逐站熄灯。掐点等车、换乘狂奔、单车兜底——在整座城市睡着之前回家。
            </p>
          </div>
        </Link>

        <Link to="/driver" className="no-underline">
          <div
            className="w-72 rounded-2xl p-6 transition-transform hover:scale-[1.03]"
            style={{ background: 'rgba(40,22,32,.85)', border: '1px solid #4d2430' }}
          >
            <div className="text-4xl mb-3">🚇</div>
            <div className="text-xl font-bold text-slate-100 mb-2">司机模式 <span className="text-xs text-amber-400 align-middle">NEW</span></div>
            <p className="text-sm text-slate-400 leading-6">
              你开 1 号线末班车。每站停与不停，决定站台上那些人的今夜。23:30 前必须回库——你带谁回家？
            </p>
          </div>
        </Link>
      </div>

      <p className="text-xs text-slate-600">一座叫不夜城的城市 · 站名来自每个打工人的日常</p>
    </div>
  )
}
