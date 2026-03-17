import { useState, useEffect } from "react"
import { 
  DndContext, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors 
} from "@dnd-kit/core"
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy 
} from "@dnd-kit/sortable"
import { io } from "socket.io-client"
import API from "@/api"
import SortableCard from "./SortableCard"

const socket = io("http://localhost:5000")

function Board({ boardId }) {
  const [boardLists, setBoardLists] = useState([])
  const [showInput, setShowInput] = useState(false)
  const [title, setTitle] = useState("")
  const [loading, setLoading] = useState(true)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    fetchListsAndCards()
    
    // Join board room for real-time updates
    socket.emit("join-board", boardId)

    // Listen for updates from other users
    socket.on("update-card", (data) => {
       // Simple refresh for now to keep things sync easily
       fetchListsAndCards()
    })

    return () => {
      socket.off("update-card")
    }
  }, [boardId])

  const fetchListsAndCards = async () => {
    try {
      const listsRes = await API.get(`/api/lists/${boardId}`)
      const lists = listsRes.data

      const listsWithCards = await Promise.all(
        lists.map(async (list) => {
          const cardsRes = await API.get(`/api/cards/${list._id}`)
          return { ...list, cards: cardsRes.data }
        })
      )

      setBoardLists(listsWithCards)
    } catch (err) {
      console.error("Failed to fetch board content", err)
    } finally {
      setLoading(false)
    }
  }

  const handleDragEnd = async (event) => {
    const { active, over } = event
    if (!over) return

    const activeCardId = active.id
    const overListId = over.id // This assumes we drop into a list or onto another card

    // Find which list the card is currently in and which list it should go to
    const sourceList = boardLists.find(l => l.cards.some(c => c._id === activeCardId))
    const destinationList = boardLists.find(l => l._id === overListId || l.cards.some(c => c._id === overListId))

    if (!sourceList || !destinationList || sourceList._id === destinationList._id) return

    try {
      // Update backend
      await API.put("/api/cards/move", { 
        cardId: activeCardId, 
        newListId: destinationList._id 
      })

      // Notify others
      socket.emit("card-moved", { boardId, cardId: activeCardId, newListId: destinationList._id })

      // Optimistic update
      fetchListsAndCards()
    } catch (err) {
      console.error("Failed to move card", err)
    }
  }

  const addList = async () => {
    if (!title.trim()) return
    try {
      const response = await API.post("/api/lists", { title, boardId })
      setBoardLists([...boardLists, { ...response.data, cards: [] }])
      setTitle("")
      setShowInput(false)
    } catch (err) {
      alert("Failed to add list")
    }
  }

  const addCard = async (listId) => {
    const cardTitle = prompt("Enter card title:")
    if (!cardTitle) return
    try {
      const response = await API.post("/api/cards", { title: cardTitle, listId })
      setBoardLists(boardLists.map(list => 
        list._id === listId ? { ...list, cards: [...list.cards, response.data] } : list
      ))
    } catch (err) {
      alert("Failed to add card")
    }
  }

  if (loading) return <div className="p-10 text-slate-400 font-bold uppercase tracking-tighter animate-pulse">Assembling your board...</div>

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <div className="flex gap-8 h-full items-start select-none pb-4">
        {boardLists.map(list => (
          <div
            key={list._id}
            className="w-80 bg-white/50 backdrop-blur-md rounded-3xl flex flex-col max-h-full border border-white/20 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-indigo-100 transition-all duration-300"
          >
            {/* LIST HEADER */}
            <div className="p-5 flex justify-between items-center group/header">
              <h3 className="text-sm font-black text-slate-800 tracking-tight uppercase px-1">
                {list.title}
              </h3>
            </div>

            {/* CARDS CONTAINER */}
            <SortableContext items={list.cards.map(c => c._id)} strategy={verticalListSortingStrategy}>
              <div id={list._id} className="p-3 pt-0 flex flex-col gap-3 overflow-y-auto min-h-[50px]">
                {list.cards?.map(card => (
                  <SortableCard key={card._id} card={card} />
                ))}
              </div>
            </SortableContext>

            {/* LIST FOOTER */}
            <div className="p-3">
              <button 
                onClick={() => addCard(list._id)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-black text-slate-500 hover:bg-indigo-600 hover:text-white rounded-xl transition-all duration-300 cursor-pointer group shadow-sm hover:shadow-indigo-200 border border-transparent hover:border-indigo-500 uppercase tracking-widest"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                Add a card
              </button>
            </div>
          </div>
        ))}

        {/* ADD LIST UI */}
        <div className="w-80 shrink-0">
          {!showInput ? (
            <button
              onClick={() => setShowInput(true)}
              className="w-full flex items-center gap-3 px-6 py-4 bg-white/40 backdrop-blur-sm hover:bg-white/60 border-2 border-dashed border-slate-300 rounded-3xl text-sm font-black text-slate-600 transition-all cursor-pointer shadow-sm group hover:border-indigo-400"
            >
              <div className="p-2 bg-white rounded-xl shadow-md group-hover:scale-110 group-hover:shadow-indigo-100 transition-all duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
              </div>
              Add another list
            </button>
          ) : (
            <div className="bg-white p-5 rounded-3xl shadow-2xl shadow-indigo-100 border border-indigo-100 flex flex-col gap-4 animate-in fade-in zoom-in duration-300">
              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addList()}
                placeholder="List title..."
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
              <div className="flex items-center gap-2">
                <button onClick={addList} className="flex-1 px-5 py-2.5 bg-indigo-600 text-white text-[13px] font-black rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all cursor-pointer uppercase tracking-widest">
                  Add List
                </button>
                <button onClick={() => setShowInput(false)} className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer border border-transparent hover:border-slate-200">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DndContext>
  )
}

export default Board