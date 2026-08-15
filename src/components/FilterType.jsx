import React, { useState } from "react";
import { motion } from "framer-motion";

function FilterType({ types, generations, onSearchAndFilter, isLoading }) {
  const [nameQuery, setNameQuery] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedGeneration, setSelectedGeneration] = useState("");

  // Handles form submission to trigger search/filter
  const handleSubmit = (e) => {
    e.preventDefault();
    onSearchAndFilter(nameQuery, selectedType, selectedGeneration);
  };

  // Helper to map generation ID to region name for display
  const getGenerationRegionName = (genId) => {
    switch (genId) {
      case 1: return "Kanto";
      case 2: return "Johto";
      case 3: return "Hoenn";
      case 4: return "Sinnoh";
      case 5: return "Unova";
      case 6: return "Kalos";
      case 7: return "Alola";
      case 8: return "Galar";
      case 9: return "Paldea";
      default: return "";
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full bg-theme-surface border border-theme p-5 sm:p-6 rounded-3xl shadow-lg relative overflow-hidden"
    >
      <div className="flex-1 relative">
        <input
          type="text"
          placeholder="Search by name or number..."
          value={nameQuery}
          onChange={(e) => setNameQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-theme-input border-2 border-theme hover:border-theme-accent rounded-2xl focus:outline-none focus:ring-2 focus:ring-theme-accent focus:border-transparent text-theme-primary placeholder-slate-500 font-display transition-all duration-200"
          aria-label="Search or filter Pokémon by name or ID"
          disabled={isLoading}
        />
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-theme-secondary pointer-events-none">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.637 10.637z"
            />
          </svg>
        </div>
      </div>

      <div className="flex-1 relative">
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="w-full px-4 py-3 bg-theme-input border-2 border-theme hover:border-theme-accent rounded-2xl text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-accent focus:border-transparent font-display capitalize cursor-pointer transition-all duration-200"
          aria-label="Filter by Pokémon type"
          disabled={isLoading}
        >
          <option value="" className="bg-theme-input text-theme-secondary">All Types</option>
          {Array.isArray(types) &&
            types.map((t) => (
              <option key={t.name} value={t.name} className="bg-theme-input text-theme-primary capitalize">
                {t.name}
              </option>
            ))}
        </select>
      </div>

      <div className="flex-1 relative">
        <select
          value={selectedGeneration}
          onChange={(e) => setSelectedGeneration(e.target.value)}
          className="w-full px-4 py-3 bg-theme-input border-2 border-theme hover:border-theme-accent rounded-2xl text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-accent focus:border-transparent font-display capitalize cursor-pointer transition-all duration-200"
          aria-label="Filter by Pokémon generation"
          disabled={isLoading}
        >
          <option value="" className="bg-theme-input text-theme-secondary">All Generations</option>
          {Array.isArray(generations) &&
            generations.map((gen) => (
              <option key={gen.id} value={gen.id} className="bg-theme-input text-theme-primary capitalize">
                {`Gen ${gen.name.split("-")[1].toUpperCase()} (${getGenerationRegionName(gen.id)})`}
              </option>
            ))}
        </select>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        type="submit"
        className="w-full md:w-44 py-3 bg-theme-accent hover:opacity-90 disabled:bg-theme-surface-hover disabled:text-theme-secondary text-white rounded-2xl font-bold font-display shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-theme-accent flex items-center justify-center gap-2"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Analyzing...</span>
          </>
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.637 10.637z" />
            </svg>
            <span>Search</span>
          </>
        )}
      </motion.button>
    </form>
  );
}

export default FilterType;
