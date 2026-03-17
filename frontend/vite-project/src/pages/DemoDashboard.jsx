import DemoBoardCard from "@/components/DemoBoardCard/DemoBoardCard"

const demoBoards = [
  {
    id: 1,
    title: "Startup Roadmap 2024",
    description: "Full-scale strategic planning for a tech startup launch, from MVP to Series A.",
    tag: "Business",
    color: "indigo"
  },
  {
    id: 2,
    title: "Eco-Friendly Website Rebrand",
    description: "Modernizing the digital presence with a focus on sustainability and user experience.",
    tag: "Design",
    color: "emerald"
  },
  {
    id: 3,
    title: "Global Marketing Q3",
    description: "Coordinating multi-channel campaigns across international markets.",
    tag: "Marketing",
    color: "amber"
  },
  {
    id: 4,
    title: "Product Roadmap - V2",
    description: "Detailed feature breakdown and sprint planning for the next major release.",
    tag: "Product",
    color: "rose"
  },
  {
    id: 5,
    title: "Internal Operations",
    description: "Streamlining team communication and internal documentation workflows.",
    tag: "Operations",
    color: "sky"
  },
  {
    id: 6,
    title: "Client Project: Zenith Hub",
    description: "Comprehensive task tracking for our high-priority enterprise client.",
    tag: "Client",
    color: "violet"
  }
]

function DemoDashboard() {
  return (
    <div className="flex flex-col gap-12">
      {/* Hero Section */}
      <section className="text-center py-8">
        <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight mb-6">
          Manage anything with <span className="bg-linear-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">TaskFlow</span>
        </h1>
        <p className="text-xl text-slate-500 max-w-3xl mx-auto leading-relaxed">
          From the small stuff to the big picture, TaskFlow organizes work so teams know what to do, why it matters, and how to get it done.
        </p>
      </section>

      {/* Board Grid Section */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Explore Demo Boards</h2>
            <p className="text-slate-500">Pick a template to see how TaskFlow works in action.</p>
          </div>
          <button className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
            View All Templates
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Create New Board (Call to Action) */}
          <div className="group relative bg-white/40 backdrop-blur-sm border-2 border-dashed border-slate-300 rounded-3xl p-8 flex flex-col items-center justify-center gap-4 hover:border-indigo-400/50 hover:bg-white/60 transition-all cursor-pointer min-h-[240px]">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-md group-hover:scale-110 group-hover:shadow-indigo-200 transition-all duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600">
                <path d="M5 12h14"/><path d="M12 5v14"/>
              </svg>
            </div>
            <div className="text-center">
              <span className="block text-lg font-bold text-slate-800">Create New Board</span>
              <p className="text-sm text-slate-500">Start from a blank canvas</p>
            </div>
          </div>

          {demoBoards.map(board => (
            <DemoBoardCard key={board.id} board={board} />
          ))}
        </div>
      </section>
    </div>
  )
}

export default DemoDashboard