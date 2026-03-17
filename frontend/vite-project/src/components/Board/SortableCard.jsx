import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

function SortableCard({ card }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: card._id })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="group relative bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-50 transition-all duration-300 cursor-grab active:cursor-grabbing"
    >
      <div className="flex flex-col gap-3">
        <div className="text-sm font-bold text-slate-800 leading-snug group-hover:text-indigo-600 transition-colors">
          {card.title}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-full">
            Low Priority
          </div>
        </div>
      </div>
    </div>
  )
}

export default SortableCard
