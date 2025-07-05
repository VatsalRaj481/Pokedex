import React from "react";

// Helper function to get Tailwind classes for Pokémon types
const getTypeColors = (typeName) => {
  switch (typeName) {
    case "normal":
      return "bg-gray-400 text-gray-800";
    case "fire":
      return "bg-red-500 text-white";
    case "water":
      return "bg-blue-500 text-white";
    case "grass":
      return "bg-green-500 text-white";
    case "electric":
      return "bg-yellow-400 text-yellow-900";
    case "ice":
      return "bg-blue-200 text-blue-800";
    case "fighting":
      return "bg-red-700 text-white";
    case "poison":
      return "bg-purple-600 text-white";
    case "ground":
      return "bg-yellow-700 text-white";
    case "flying":
      return "bg-indigo-300 text-indigo-900";
    case "psychic":
      return "bg-pink-500 text-white";
    case "bug":
      return "bg-lime-500 text-lime-900";
    case "rock":
      return "bg-yellow-800 text-white";
    case "ghost":
      return "bg-purple-800 text-white";
    case "dragon":
      return "bg-indigo-700 text-white";
    case "steel":
      return "bg-gray-500 text-white";
    case "dark":
      return "bg-gray-700 text-white";
    case "fairy":
      return "bg-pink-300 text-pink-900";
    default:
      return "bg-gray-300 text-gray-700"; // Default color for unknown types
  }
};

function PokemonCard({ pokemon }) {
  if (!pokemon) {
    return null; // Don't render anything if pokemon data is not available
  }

  return (
    <div
      className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300
                 flex flex-col md:flex-row items-center md:items-stretch
                 p-4 md:p-6 border border-gray-100 transform hover:-translate-y-2 hover:scale-102
                 min-h-[14rem] md:min-h-[12rem] overflow-hidden"
    >
      {/* Image Section */}
      <div className="flex-shrink-0 w-full md:w-1/3 flex items-center justify-center mb-4 md:mb-0 md:mr-6">
        {pokemon.sprites?.other?.["official-artwork"]?.front_default ? (
          <img
            src={pokemon.sprites.other["official-artwork"].front_default}
            alt={pokemon.name}
            className="w-full h-full object-contain max-w-[12rem] max-h-[12rem] md:max-w-none md:max-h-none drop-shadow-lg"
            style={{ imageRendering: "pixelated" }}
          />
        ) : pokemon.sprites?.front_default ? (
          <img
            src={pokemon.sprites.front_default}
            alt={pokemon.name}
            className="w-full h-full object-contain max-w-[10rem] max-h-[10rem] md:max-w-none md:max-h-none drop-shadow-md"
            style={{ imageRendering: "pixelated" }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg text-gray-400 text-sm">
            No Image
          </div>
        )}
      </div>

      {/* Details Section */}
      <div className="flex-grow w-full md:w-2/3 flex flex-col items-center md:items-start text-center md:text-left">
        <h2 className="text-3xl font-extrabold text-gray-900 capitalize mb-2 tracking-tight">
          {pokemon.name}{" "}
          <span className="text-gray-500 text-xl font-semibold">
            #{pokemon.id}
          </span>
        </h2>

        {/* Types */}
        <div className="mb-3 w-full">
          <h3 className="font-bold text-gray-700 text-lg mb-1">Types:</h3>
          <div className="flex flex-wrap justify-center md:justify-start gap-1">
            {pokemon.types.map((t) => (
              <span
                key={t.type.name}
                className={`capitalize px-3 py-0.5 rounded-full text-xs font-semibold ${getTypeColors(
                  t.type.name
                )}`}
              >
                {t.type.name}
              </span>
            ))}
          </div>
        </div>

        {/* Abilities */}
        <div className="w-full text-left mt-2">
          <h3 className="font-bold text-gray-700 text-lg mb-1">Abilities:</h3>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-0.5">
            {pokemon.abilities.slice(0, 2).map((a) => (
              <li key={a.ability.name} className="capitalize">
                {a.ability.name}
              </li>
            ))}
            {/* {pokemon.abilities.length > 2 && (
              <li className="text-xs text-gray-500">...and more</li>
            )} */}
          </ul>
        </div>

        {/* Stats */}
        <div className="w-full text-left mt-2">
          <h3 className="font-bold text-gray-700 text-lg mb-1">Base Stats:</h3>
          <ul className="text-sm text-gray-700 space-y-0.5">
            {pokemon.stats.map((s) => (
              <li
                key={s.stat.name}
                className="flex justify-between items-center"
              >
                <span className="capitalize font-medium text-gray-600">
                  {s.stat.name}:
                </span>
                <span className="font-semibold text-gray-800">
                  {s.base_stat}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default PokemonCard;
