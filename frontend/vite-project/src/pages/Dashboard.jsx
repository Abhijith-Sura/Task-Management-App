import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import API from "@/api"

function Dashboard() {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState("");

  useEffect(() => {
    fetchBoards();
  }, []);

  const fetchBoards = async () => {
    try {
      const response = await API.get("/api/boards");
      setBoards(response.data);
    } catch (err) {
      setError("Failed to fetch boards.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    if (!newBoardTitle.trim()) return;
    try {
      const response = await API.post("/api/boards", { title: newBoardTitle });
      setBoards([...boards, response.data]);
      setNewBoardTitle("");
      setShowModal(false);
    } catch (err) {
      alert("Failed to create board.");
    }
  };

  if (loading) return <div className="text-center py-20 font-bold text-slate-500">Loading your workspace...</div>;

  return (
    <div className="flex flex-col gap-10">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">My Workspace</h1>
          <p className="text-slate-500 font-medium">Manage your active projects and team tasks.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="px-6 py-3 bg-indigo-600 text-white font-black rounded-2xl shadow-lg shadow-indigo-100 hover:opacity-90 transition-all active:scale-[0.98] uppercase tracking-widest text-sm"
        >
          New Board
        </button>
      </header>

      {error && <div className="p-4 bg-red-50 text-red-600 rounded-2xl font-bold">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {boards.map((board) => (
          <Link 
            key={board._id} 
            to={`/board/${board._id}`}
            className="group bg-white/60 backdrop-blur-sm p-8 rounded-3xl border border-slate-200 hover:border-indigo-200 hover:shadow-2xl hover:shadow-indigo-100 transition-all duration-300"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/><path d="M3 9V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4"/></svg>
              </div>
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600">
                Active
              </span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">{board.title}</h3>
            <p className="text-slate-500 text-sm font-medium mb-6">{board.members?.length || 1} members</p>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
               <div className="bg-indigo-600 h-full w-[40%] rounded-full shadow-sm shadow-indigo-200"></div>
            </div>
          </Link>
        ))}
        
        {/* Create New Project placeholder */}
        <button 
          onClick={() => setShowModal(true)}
          className="bg-white/40 backdrop-blur-sm p-8 rounded-3xl border-2 border-dashed border-slate-300 hover:border-indigo-400 hover:bg-white/60 transition-all flex flex-col items-center justify-center gap-4 group"
        >
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 group-hover:text-indigo-600"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          </div>
          <span className="font-bold text-slate-500 group-hover:text-indigo-600 transition-colors">New Project</span>
        </button>
      </div>

      {/* Basic Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
            <h2 className="text-2xl font-black text-slate-900 mb-6">Create New Board</h2>
            <form onSubmit={handleCreateBoard} className="space-y-6">
              <input 
                autoFocus
                type="text" 
                placeholder="Board Title" 
                value={newBoardTitle}
                onChange={(e) => setNewBoardTitle(e.target.value)}
                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium text-slate-800"
              />
              <div className="flex gap-4">
                <button 
                   type="button"
                   onClick={() => setShowModal(false)}
                   className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all uppercase tracking-widest text-xs"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 text-white font-black rounded-xl shadow-lg shadow-indigo-100 hover:opacity-90 transition-all uppercase tracking-widest text-xs"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
