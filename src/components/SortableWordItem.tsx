import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Word } from '@/types';
import TTSButton from './TTSButton';

interface SortableWordItemProps {
  word: Word;
  index: number;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onPriority: () => void;
  onDelete: () => void;
}

export default function SortableWordItem({
  word,
  index,
  isSelected,
  onToggleSelect,
  onEdit,
  onArchive,
  onPriority,
  onDelete
}: SortableWordItemProps) {
  return (
    <Draggable draggableId={word.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`flex flex-col sm:flex-row sm:items-center gap-1.5 px-3 py-2.5 rounded-2xl shadow-sm transition-all md:px-4 md:gap-3 bg-white ${
            isSelected ? 'ring-2 ring-primary/60' : ''
          } ${
            snapshot.isDragging ? 'shadow-xl scale-[1.02] z-50 ring-2 ring-primary/20' : 'hover:shadow-md hover:scale-[1.005]'
          }`}
        >
          {/* Main Content Area */}
          <div className="flex items-start sm:items-center gap-2 flex-1 min-w-0">
            {/* Drag Handle */}
            <div
              {...provided.dragHandleProps}
              className="text-foreground/20 hover:text-foreground cursor-grab active:cursor-grabbing shrink-0 flex justify-center mt-0.5 sm:mt-0"
            >
              <span className="material-symbols-rounded text-xl">drag_indicator</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5 sm:gap-2 mt-0.5 sm:mt-0">
              {/* Checkbox for Quest/Selection */}
              {onToggleSelect && (
                <button
                  onClick={onToggleSelect}
                  className={`w-6 h-6 rounded-md flex items-center justify-center border-2 transition-all shrink-0 ${
                    isSelected 
                      ? 'bg-[var(--primary)] border-[var(--primary)] text-white' 
                      : 'border-[var(--foreground)]/20 hover:border-[var(--primary)]/50 text-transparent'
                  }`}
                >
                  <span className="material-symbols-rounded text-sm" style={{ fontWeight: 800 }}>check</span>
                </button>
              )}

              {/* TTS */}
              <TTSButton text={word.word} className="shrink-0 -ml-1 sm:-ml-0" />
            </div>

            {/* Content (Dense Layout) */}
            <div className="flex-1 flex flex-col min-w-0 py-0.5">
              <div className="leading-tight">
                <span className="font-bold text-foreground text-[15px] break-words">
                  {word.word}
                </span>
                {word.part_of_speech && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-secondary text-foreground/90 rounded-full inline-block align-middle ml-1.5 mb-0.5">
                    {word.part_of_speech}
                  </span>
                )}
              </div>
              
              {word.memo && (
                <div className="mt-0.5 text-[13px] text-foreground/80 leading-tight break-words">
                  {word.memo}
                </div>
              )}
            </div>
          </div>

          {/* Footer / Actions Area */}
          <div className="flex items-center justify-between sm:justify-end shrink-0 w-full sm:w-auto pl-[72px] sm:pl-0 mt-0.5 sm:mt-0">
            {/* Tags Area */}
            <div className="flex flex-wrap gap-1 shrink-0">
              {word.tags && word.tags.map(tag => (
                <span key={tag} className="bg-foreground/5 border border-foreground/10 px-1.5 py-0.5 rounded-md text-foreground/80 font-medium text-[10px]">{tag}</span>
              ))}
            </div>

            {/* Actions Footer */}
            <div className="flex items-center shrink-0 -mr-1">
              <button
                onClick={onEdit}
                className="w-8 h-8 flex items-center justify-center rounded-full text-foreground/40 hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors"
                title="Edit"
              >
                <span className="material-symbols-rounded text-[18px]">edit</span>
              </button>
              <button
                onClick={onPriority}
                className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${word.is_priority ? 'text-amber-500 bg-amber-50' : 'text-foreground/40 hover:bg-black/5'}`}
                title="Toggle Priority"
              >
                <span className={`material-symbols-rounded text-[18px] ${word.is_priority ? 'icon-filled' : ''}`}>star</span>
              </button>
              <button
                onClick={onArchive}
                className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${word.is_archived ? 'text-[var(--primary)] bg-[var(--primary)]/10' : 'text-foreground/40 hover:bg-black/5'}`}
                title={word.is_archived ? "Unarchive" : "Archive"}
              >
                <span className="material-symbols-rounded text-[18px]">inventory_2</span>
              </button>
              <button
                onClick={() => {
                  if(window.confirm('Delete this word?')) onDelete();
                }}
                className="w-8 h-8 flex items-center justify-center rounded-full text-foreground/40 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Delete"
              >
                <span className="material-symbols-rounded text-[18px]">delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}
