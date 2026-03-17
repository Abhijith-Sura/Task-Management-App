import { useParams } from "react-router-dom"
import { useState, useEffect } from "react"
import Board from "../components/Board/Board"
import API from "@/api"

function BoardPage() {
  const { id } = useParams()
  const [board, setBoard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchBoardDetails();
  }, [id]);

  const fetchBoardDetails = async () => {
    try {
      // First, get the board title/details
      const boardRes = await API.get("/api/boards");
      const currentBoard = boardRes.data.find(b => b._id === id);
      setBoard(currentBoard);
    } catch (err) {
      setError("Failed to load board details.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-20 font-bold text-slate-500 text-xl tracking-tight">Syncing with workspace...</div>;
  if (!board) return <div className="text-center py-20 font-bold text-red-500 text-xl">Board not found.</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      {/* BOARD HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-200">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600">
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" x2="21" y1="9" y2="9"/><line x1="9" x2="9" y1="21" y2="9"/>
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">{board.title}</h1>
              <button className="p-1.5 hover:bg-white rounded-lg transition-colors group cursor-pointer border border-transparent hover:border-slate-200">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 group-hover:text-amber-400">
                   <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              </button>
            </div>
            <p className="text-sm font-medium text-slate-500">ID: {id} • A collaborative space for your team's goals.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex -space-x-3 mr-4">
            {board.members?.map((member, i) => (
              <div key={i} className="w-10 h-10 rounded-full border-4 border-slate-50 bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 shadow-sm relative z-0 hover:z-10 transition-all cursor-pointer">
                {member.name?.[0] || 'U'}
              </div>
            ))}
            {!board.members?.length && (
               <div className="w-10 h-10 rounded-full border-4 border-slate-50 bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 shadow-sm">
                 ?
               </div>
            )}
            <button className="w-10 h-10 rounded-full border-4 border-slate-50 bg-indigo-50 flex items-center justify-center text-xs font-bold text-indigo-600 shadow-sm">
              +
            </button>
          </div>
          <button className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
            Invite
          </button>
        </div>
      </div>

      {/* BOARD CANVAS */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
        <Board boardId={id} />
      </div>
    </div>
  )
}

export default BoardPage