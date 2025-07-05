import React, { useState } from "react";

function SearchBar({ onSearch }) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
      setQuery("");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-sm"
    >
      <input
        type="text"
        placeholder="Enter Pokémon name or Pokédex Number"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="flex-grow w-full px-5 py-2.5 border border-gray-300 rounded-xl
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                   transition-all duration-200 text-gray-800 placeholder-gray-400 text-lg"
        aria-label="Pokémon search input"
      />
      <button
        type="submit"
        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold
                   py-2.5 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200
                   transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Search
      </button>
    </form>
  );
}

export default SearchBar;
