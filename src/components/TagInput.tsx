import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  availableTags: string[];
  disabled?: boolean;
}

export default function TagInput({ tags, onChange, availableTags, disabled = false }: TagInputProps) {
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAddTag = (tagToAdd: string) => {
    const trimmed = tagToAdd.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInput('');
    inputRef.current?.focus();
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onChange(tags.filter(t => t !== tagToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag(input);
    } else if (e.key === 'Backspace' && input === '' && tags.length > 0) {
      handleRemoveTag(tags[tags.length - 1]);
    }
  };

  // Filter available tags: exclude already selected, match input text
  const suggestions = availableTags.filter(t => 
    !tags.includes(t) && t.toLowerCase().includes(input.toLowerCase())
  );

  // Close suggestions if clicked outside
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div 
        className={`cute-input min-h-[48px] w-full p-2 flex flex-wrap gap-2 items-center cursor-text transition-colors ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        } ${isFocused ? 'ring-2 ring-primary/20 border-primary' : ''}`}
        onClick={() => !disabled && inputRef.current?.focus()}
      >
        {tags.map(tag => (
          <span 
            key={tag} 
            className="flex items-center gap-1 bg-primary/10 text-primary px-2.5 py-1 rounded-lg text-sm font-bold"
          >
            {tag}
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveTag(tag);
                }}
                className="hover:text-primary-hover flex items-center justify-center rounded-full w-4 h-4 transition-colors"
              >
                <span className="material-symbols-rounded text-[14px]">close</span>
              </button>
            )}
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setIsFocused(true);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          disabled={disabled}
          placeholder={tags.length === 0 ? "Add tags..." : ""}
          className="flex-1 min-w-[120px] bg-transparent outline-none text-foreground placeholder:text-foreground/30 py-1 font-bold"
        />
      </div>

      {/* Suggestions Dropdown */}
      {isFocused && !disabled && (input.trim() || suggestions.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-md rounded-xl shadow-lg border border-black/5 overflow-hidden z-50 max-h-48 overflow-y-auto">
          {input.trim() && !tags.includes(input.trim()) && !availableTags.includes(input.trim()) && (
            <button
              type="button"
              className="w-full text-left px-4 py-3 hover:bg-black/5 flex items-center gap-2 border-b border-black/5"
              onMouseDown={(e) => {
                e.preventDefault(); // prevent input blur
                handleAddTag(input);
              }}
            >
              <span className="material-symbols-rounded text-[20px] text-primary">add_circle</span>
              <span className="font-bold text-foreground">Create "{input.trim()}"</span>
            </button>
          )}
          {suggestions.map(tag => (
            <button
              key={tag}
              type="button"
              className="w-full text-left px-4 py-2.5 hover:bg-black/5 flex items-center gap-2 text-foreground/80 font-bold transition-colors"
              onMouseDown={(e) => {
                e.preventDefault(); // prevent input blur
                handleAddTag(tag);
              }}
            >
              <span className="material-symbols-rounded text-[20px] text-foreground/30">sell</span>
              {tag}
            </button>
          ))}
          {suggestions.length === 0 && !input.trim() && (
            <div className="px-4 py-3 text-sm text-foreground/40 text-center font-bold">
              No existing tags available
            </div>
          )}
        </div>
      )}
    </div>
  );
}
