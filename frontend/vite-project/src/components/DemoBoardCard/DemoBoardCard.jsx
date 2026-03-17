import { Link } from "react-router-dom"

function DemoBoardCard({ board }) {
  const colorMap = {
    indigo: "from-indigo-500 to-indigo-600",
    emerald: "from-emerald-500 to-emerald-600",
    amber: "from-amber-500 to-amber-600",
    rose: "from-rose-500 to-rose-600",
    sky: "from-sky-500 to-sky-600",
    violet: "from-violet-500 to-violet-600"
  };

  const bgGradient = colorMap[board.color] || "from-slate-500 to-slate-600";

  return (
    <Link to={`/board/${board.id}`} className="block group">
      <div className="h-full bg-white/60 backdrop-blur-sm rounded-3xl p-8 shadow-sm hover:shadow-2xl hover:shadow-indigo-100 border border-slate-200 hover:border-indigo-200 transition-all duration-300 flex flex-col gap-6 relative overflow-hidden">
        {/* Decorative background element */}
        <div className={`absolute -top-4 -right-4 w-24 h-24 bg-linear-to-br ${bgGradient} opacity-5 rounded-full group-hover:scale-150 transition-transform duration-700`}></div>

        <div className="flex justify-between items-start relative z-10">
          <div className={`w-12 h-12 bg-linear-to-br ${bgGradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" x2="21" y1="9" y2="9"/><line x1="9" x2="9" y1="21" y2="9"/>
            </svg>
          </div>
          <span className={`px-3 py-1 bg-white/50 border border-slate-100 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:border-indigo-100 transition-colors`}>
            {board.tag || "Workspace"}
          </span>
        </div>

        <div className="relative z-10">
          <h3 className="text-xl font-black text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
            {board.title}
          </h3>
          <p className="text-sm text-slate-500 leading-relaxed font-medium">
            {board.description}
          </p>
        </div>

        <div className="mt-auto pt-6 flex items-center justify-between relative z-10">
          <div className="flex -space-x-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">
                {String.fromCharCode(64 + i)}
              </div>
            ))}
          </div>
          <div className="flex items-center text-sm font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
            <span>Explore</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
              <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
            </svg>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default DemoBoardCard