import React from "react";
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
                    p-6 flex flex-col items-center text-center border border-gray-100
                    transform hover:-translate-y-2 hover:scale-102"
    >
      <h2 className="text-4xl font-extrabold text-gray-900 capitalize mb-3 tracking-tight">
        {pokemon.name}
      </h2>

      {pokemon.sprites?.other?.["official-artwork"]?.front_default ? (
        <img
          src={pokemon.sprites.other["official-artwork"].front_default}
          alt={pokemon.name}
          className="w-48 h-48 object-contain mx-auto mb-4 drop-shadow-lg"
        />
      ) : pokemon.sprites?.front_default ? (
        <img
          src={pokemon.sprites.front_default}
          alt={pokemon.name}
          className="w-40 h-40 object-contain mx-auto mb-4 drop-shadow-md"
        />
      ) : (
        <div className="w-40 h-40 flex items-center justify-center bg-gray-100 rounded-lg mb-4 text-gray-400">
          No Image
        </div>
      )}

      <div className="mb-4 w-full">
        <h3 className="font-bold text-gray-700 text-xl mb-2 border-b pb-1 border-gray-200">
          Types:
        </h3>
        <div className="flex flex-wrap justify-center gap-2">
          {pokemon.types.map((t) => (
            <span
              key={t.type.name}
              className={`capitalize px-4 py-1.5 rounded-full text-sm font-semibold
                          ${getTypeColors(t.type.name)}`}
            >
              {t.type.name}
            </span>
          ))}
        </div>
      </div>

      <div className="w-full text-left mt-4">
        <h3 className="font-bold text-gray-700 text-xl mb-2 border-b pb-1 border-gray-200">
          Abilities:
        </h3>
        <ul className="list-disc list-inside text-base text-gray-700 space-y-1">
          {pokemon.abilities.map((a) => (
            <li key={a.ability.name} className="capitalize">
              {a.ability.name}
            </li>
          ))}
        </ul>
      </div>

      <div className="w-full text-left mt-4">
        <h3 className="font-bold text-gray-700 text-xl mb-2 border-b pb-1 border-gray-200">
          Stats:
        </h3>
        <ul className="text-base text-gray-700 space-y-1">
          {pokemon.stats.map((s) => (
            <li key={s.stat.name} className="flex justify-between items-center">
              <span className="capitalize font-medium text-gray-600">
                {s.stat.name}:
              </span>
              <span className="font-semibold text-gray-800">{s.base_stat}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default PokemonCard;
