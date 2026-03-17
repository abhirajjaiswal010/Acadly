import React from 'react';
import { Search, X } from 'lucide-react';

/**
 * SearchBar for filtering transcripts or searching full lecture
 */
const SearchBar = ({ onSearch, value, onChange, onClear }) => {
  return (
    <div className="relative group">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors">
        <Search size={18} />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSearch(value)}
        placeholder="Search keywords in lecture..."
        className="w-full bg-surface/50 border border-border group-hover:border-border-hover focus:border-primary text-text text-sm rounded-xl py-2.5 pl-12 pr-10 focus:ring-4 focus:ring-primary/5 transition-all outline-none"
      />
      {value && (
        <button
          onClick={onClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text p-1 hover:bg-white/10 rounded-full"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
