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
          className={`flex items-center gap-2 px-3 py-3 rounded-2xl shadow-sm transition-all md:px-4 md:gap-3 bg-white ${
            isSelected ? 'ring-2 ring-primary/60' : ''
          } ${
            snapshot.isDragging ? 'shadow-xl scale-[1.02] z-50 ring-2 ring-primary/20' : 'hover:shadow-md hover:scale-[1.005]'
          } ${word.is_archived ? 'opacity-50 grayscale' : ''}`}
        >
          {/* Drag Handle */}
          <div
            {...provided.dragHandleProps}
            className="text-foreground/20 hover:text-foreground cursor-grab active:cursor-grabbing shrink-0 flex justify-center"
          >
            <span className="material-symbols-rounded text-xl">drag_indicator</span>
          </div>

          {/* Checkbox for Quest/Selection */}
          {onToggleSelect && (
            <button
              onClick={onToggleSelect}
              className={`w-6 h-6 rounded-md flex items-center justify-center border-2 transition-all shrink-0 ${
                isSelected 
                  ? 'bg-primary border-primary text-white' 
                  : 'border-foreground/20 hover:border-primary/50 text-transparent'
              }`}
            >
              <span className="material-symbols-rounded text-sm" style={{ fontWeight: 800 }}>check</span>
            </button>
          )}

          {/* TTS */}
          <TTSButton text={word.word} className="shrink-0 -ml-1" />

          {/* Content (Dense Layout) */}
          <div className="flex-1 flex flex-col min-w-0 py-1">
            <div className="flex flex-wrap items-center gap-1.5 leading-tight">
              <span className="font-bold text-foreground text-base break-words">
                {word.word}
              </span>
              {word.part_of_speech && (
                <span className="text-[11px] font-bold px-2 py-0.5 bg-secondary text-foreground/90 rounded-full shrink-0">
                  {word.part_of_speech}
                </span>
              )}
            </div>
            
            {(word.memo || (word.tags && word.tags.length > 0)) && (
              <div className="flex flex-wrap items-center gap-2.5 mt-1 text-xs text-foreground/80 leading-tight">
                {word.memo && <span className="break-words">{word.memo}</span>}
                {word.tags && word.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 shrink-0">
                    {word.tags.map(tag => (
                      <span key={tag} className="bg-foreground/5 border border-foreground/10 px-1.5 py-0.5 rounded-md text-foreground/80 font-medium">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center shrink-0 -mr-1">
            <button
              onClick={onEdit}
              className="w-8 h-8 flex items-center justify-center rounded-full text-foreground/40 hover:text-primary hover:bg-primary/10 transition-colors"
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
              className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${word.is_archived ? 'text-primary bg-primary/10' : 'text-foreground/40 hover:bg-black/5'}`}
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
      )}
    </Draggable>
  );
}
