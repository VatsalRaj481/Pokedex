import React from "react";

function FilterType({ types, onFilter }) {
  return (
    <div className="relative w-full max-w-sm">
      <select
        onChange={(e) => onFilter(e.target.value)}
        defaultValue=""
        className="block w-full px-5 py-2.5 border border-gray-300 rounded-xl
                   bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                   transition-all duration-200 text-gray-800 text-lg cursor-pointer"
        aria-label="Filter Pokémon by type"
      >
        <option value="" disabled>
          Select Type to Filter
        </option>
        {types.map((t) => (
          <option key={t.name} value={t.name} className="capitalize">
            {t.name}
          </option>
        ))}
      </select>
      {/* Custom arrow for select dropdown */}
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
        <svg
          className="fill-current h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
        >
          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.096 6.924 4.682 8.338l4.611 4.612z" />
        </svg>
      </div>
    </div>
  );
}

export default FilterType;
