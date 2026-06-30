import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import TTSButton from '@/components/TTSButton';
import { Word } from '@/contexts/StoreContext';

interface Props {
  word: Word;
  index: number;
  isSelected: boolean;
  onToggleSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleArchive: () => void;
  onTogglePriority: () => void;
  onGenerateAI: () => void;
  isGenerating: boolean;
  isEditing: boolean;
  editForm: { word: string; meaning: string; part_of_speech?: string; scene?: string; example?: string };
  setEditForm: (form: { word: string; meaning: string; part_of_speech?: string; scene?: string; example?: string }) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
}

export default function SortableWordItem({
  word,
  index,
  isSelected,
  onToggleSelect,
  onEdit,
  onDelete,
  onToggleArchive,
  onTogglePriority,
  onGenerateAI,
  isGenerating,
  isEditing,
  editForm,
  setEditForm,
  onSaveEdit,
  onCancelEdit
}: Props) {
  return (
    <Draggable draggableId={word.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          style={{
            ...provided.draggableProps.style,
          }}
          className={`cute-card p-3 bg-white hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_#2D3748] transition-all flex flex-col gap-1.5 ${isSelected ? 'border-2 border-[var(--primary)] bg-[var(--background)]' : ''} ${snapshot.isDragging ? 'shadow-[5px_5px_0px_0px_var(--primary)] border-[var(--primary)] z-50' : 'z-10'}`}
        >
          {isEditing ? (
            <div className="flex flex-col gap-3">
              <div {...provided.dragHandleProps} style={{ display: 'none' }} />
              <div>
                <label className="block text-[10px] font-bold text-[#4A5568] uppercase tracking-wider mb-1">Word / 単語</label>
                <input
                  type="text"
                  value={editForm.word}
                  onChange={e => setEditForm({ ...editForm, word: e.target.value })}
                  className="w-full cute-input px-3 py-2 text-sm font-semibold"
                  placeholder="Word"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#4A5568] uppercase tracking-wider mb-1">Part of Speech / 品詞</label>
                <input
                  type="text"
                  value={editForm.part_of_speech || ''}
                  onChange={e => setEditForm({ ...editForm, part_of_speech: e.target.value })}
                  className="w-full cute-input px-3 py-2 text-sm font-semibold"
                  placeholder="Part of Speech (e.g. Noun, Verb, Adj)"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#4A5568] uppercase tracking-wider mb-1">Meaning / 意味</label>
                <input
                  type="text"
                  value={editForm.meaning}
                  onChange={e => setEditForm({ ...editForm, meaning: e.target.value })}
                  className="w-full cute-input px-3 py-2 text-sm font-semibold"
                  placeholder="Meaning"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#4A5568] uppercase tracking-wider mb-1">Usage Scene / 使用シーン</label>
                <input
                  type="text"
                  value={editForm.scene || ''}
                  onChange={e => setEditForm({ ...editForm, scene: e.target.value })}
                  className="w-full cute-input px-3 py-2 text-sm font-semibold"
                  placeholder="Usage Scene"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#4A5568] uppercase tracking-wider mb-1">Example Sentence / 例文</label>
                <textarea
                  value={editForm.example || ''}
                  onChange={e => setEditForm({ ...editForm, example: e.target.value })}
                  className="w-full cute-input px-3 py-2 text-sm font-semibold min-h-[60px] max-h-[150px] resize-y"
                  placeholder="Example Sentence"
                  rows={2}
                />
              </div>
              <div className="flex justify-end gap-2 mt-1">
                <button onClick={onCancelEdit} className="cute-btn-secondary px-4 py-2 text-xs">Cancel</button>
                <button onClick={onSaveEdit} className="cute-btn px-4 py-2 text-xs">Save</button>
              </div>
            </div>
          ) : (
          <div className="flex items-start gap-2">
            {/* Drag Handle */}
            <div 
              className="flex items-center justify-center p-1 mt-1 cursor-grab active:cursor-grabbing text-[#A0AEC0] hover:text-[#4A5568]"
              {...provided.dragHandleProps}
            >
              <span className="material-symbols-rounded text-[20px]">drag_indicator</span>
            </div>

            <div className="flex flex-col items-center pt-1.5 gap-1.5">
              <input 
                type="checkbox"
                checked={isSelected}
                onChange={onToggleSelect}
                className="cute-checkbox"
              />
              <button
                onClick={onTogglePriority}
                className={`${word.is_priority ? 'text-[#D69E2E]' : 'text-[#A0AEC0]'} hover:text-[#D69E2E] transition-colors p-1 flex items-center justify-center`}
                title={word.is_priority ? "Remove Priority" : "Set Priority"}
              >
                <span 
                  className="material-symbols-rounded text-[20px]"
                  style={{ fontVariationSettings: word.is_priority ? "'FILL' 1" : "'FILL' 0" }}
                >
                  star
                </span>
              </button>
            </div>
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-lg font-extrabold text-[#2C5282] tracking-tight">{word.word}</h4>
                  <TTSButton text={word.word} />
                </div>
                {word.part_of_speech && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-[var(--secondary)]/70 text-[var(--foreground)] border border-[var(--primary)]/30">
                    {word.part_of_speech}
                  </span>
                )}
                <p className="text-[#4A5568] font-bold text-sm bg-gray-50 px-2 py-0.5 rounded-md">{word.meaning.replace(/\n/g, ' ')}</p>
              </div>
              {word.scene && (
                <div className="flex mt-0.5">
                  <span className="inline-flex text-left items-center gap-1.5 text-[13px] text-[#4A5568] font-bold">
                    <span className="material-symbols-rounded text-[16px] text-[#F6E05E]">lightbulb</span>
                    <span className="leading-relaxed break-words">{word.scene}</span>
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex flex-col gap-1.5 items-end flex-shrink-0">
              <div className="flex gap-1">
                <button
                  onClick={onEdit}
                  className="text-[#A0AEC0] hover:text-[#58A498] transition-colors p-1"
                  title="Edit"
                >
                  <span className="material-symbols-rounded text-[18px]">edit</span>
                </button>
                <button
                  onClick={onDelete}
                  className="text-[#A0AEC0] hover:text-red-400 transition-colors p-1"
                  title="Delete"
                >
                  <span className="material-symbols-rounded text-[18px]">delete</span>
                </button>
                <button
                  onClick={onToggleArchive}
                  className="text-[#A0AEC0] hover:text-[#D69E2E] transition-colors p-1"
                  title={word.is_archived ? "Unarchive" : "Archive"}
                >
                  <span className="material-symbols-rounded text-[18px]">
                    {word.is_archived ? 'unarchive' : 'archive'}
                  </span>
                </button>
              </div>
              {!word.scene && (
                <button
                  onClick={onGenerateAI}
                  disabled={isGenerating}
                  className="cute-btn-outline px-3 py-1.5 text-[10px] disabled:opacity-50 mt-1"
                >
                  Generate AI
                </button>
              )}
            </div>
          </div>
          )}
          {!isEditing && word.example && (
            <div className="text-[12px] text-[#718096] font-semibold border-t border-dashed border-[#2D3748]/20 pt-1.5 mt-0.5 ml-8 leading-relaxed flex items-start gap-1">
              <div className="flex items-center gap-1 shrink-0 mt-[-2px]">
                <span className="text-[#A0AEC0] font-bold">Ex:</span>
                <TTSButton text={word.example} className="scale-75 origin-left" />
              </div>
              <span>{word.example.replace(/\n/g, ' ')}</span>
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}
