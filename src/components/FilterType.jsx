import React, { useState } from "react";

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
      case 1:
        return "Kanto";
      case 2:
        return "Johto";
      case 3:
        return "Hoenn";
      case 4:
        return "Sinnoh";
      case 5:
        return "Unova";
      case 6:
        return "Kalos";
      case 7:
        return "Alola";
      case 8:
        return "Galar";
      case 9:
        return "Paldea";
      default:
        return "";
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full"
    >
      <input
        type="text"
        placeholder="Search by name..."
        value={nameQuery}
        onChange={(e) => setNameQuery(e.target.value)}
        className="w-full sm:flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-inter"
        aria-label="Search or filter Pokémon by name or ID"
        disabled={isLoading}
      />

      <select
        value={selectedType}
        onChange={(e) => setSelectedType(e.target.value)}
        className="w-full sm:flex-1 block px-4 py-2 border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-inter capitalize"
        aria-label="Filter by Pokémon type"
        disabled={isLoading}
      >
        <option value="">All Types</option>
        {Array.isArray(types) &&
          types.map((t) => (
            <option key={t.name} value={t.name} className="capitalize">
              {t.name}
            </option>
          ))}
      </select>

      <select
        value={selectedGeneration}
        onChange={(e) => setSelectedGeneration(e.target.value)}
        className="w-full sm:flex-1 block px-4 py-2 border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-inter capitalize"
        aria-label="Filter by Pokémon generation"
        disabled={isLoading}
      >
        <option value="">All Generations</option>
        {Array.isArray(generations) &&
          generations.map((gen) => (
            <option key={gen.id} value={gen.id} className="capitalize">
              {`Generation ${gen.name
                .split("-")[1]
                .toUpperCase()} (${getGenerationRegionName(gen.id)})`}
            </option>
          ))}
      </select>

      <button
        type="submit"
        className="w-full sm:w-36 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition font-semibold font-inter
                   shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        disabled={isLoading}
      >
        {isLoading ? "Loading..." : "Search / Filter"}
      </button>
    </form>
  );
}

export default FilterType;
