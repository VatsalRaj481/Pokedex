import React from "react";

// Defines Tailwind color classes for different Pokémon types
const typeColors = {
  normal: "bg-gray-300 text-gray-800",
  fire: "bg-red-400 text-white",
  water: "bg-blue-400 text-white",
  grass: "bg-green-400 text-white",
  electric: "bg-yellow-300 text-yellow-900",
  ice: "bg-blue-200 text-blue-800",
  fighting: "bg-red-600 text-white",
  poison: "bg-purple-500 text-white",
  ground: "bg-yellow-600 text-white",
  flying: "bg-indigo-300 text-indigo-900",
  psychic: "bg-pink-400 text-white",
  bug: "bg-lime-400 text-lime-900",
  rock: "bg-yellow-700 text-white",
  ghost: "bg-purple-700 text-white",
  dragon: "bg-indigo-600 text-white",
  steel: "bg-gray-400 text-white",
  dark: "bg-gray-700 text-white",
  fairy: "bg-pink-300 text-pink-900",
};

function PokemonCard({ pokemon, layout, pokemonToRegionMap, description }) {
  if (!pokemon) return null;

  // Determines the best available sprite image source
  const mainImageSrc =
    pokemon.sprites?.other?.home?.front_default ||
    pokemon.sprites?.other?.["official-artwork"]?.front_default ||
    pokemon.sprites?.front_default;

  const homeShinyImageSrc = pokemon.sprites?.other?.home?.front_shiny;

  // Calculates total base stats
  const totalBaseStat = pokemon.stats.reduce((sum, s) => sum + s.base_stat, 0);

  // Converts height from decimetres to meters
  const heightInMeters = (pokemon.height / 10).toFixed(1);

  // Converts weight from hectograms to kilograms
  const weightInKilograms = (pokemon.weight / 10).toFixed(1);

  // Gets regions for the current Pokémon
  const pokemonRegions = pokemonToRegionMap[pokemon.name] || [];

  // Base card styling
  const cardBase = `bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200`;

  // Tailwind classes for horizontal layout (detailed view) - Adjusted for responsiveness
  const horizontalLayout = `flex flex-col md:flex-row p-4 sm:p-8 items-center md:items-start gap-8`;
  const horizontalMainImageClasses =
    "w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-[32rem] h-auto object-contain"; // Adjusted
  const horizontalAltImageClasses =
    "w-full max-w-[12rem] sm:max-w-[16rem] h-auto object-contain"; // Adjusted
  const horizontalNameClasses =
    "text-4xl md:text-5xl font-bold capitalize mb-2 text-gray-800";
  const horizontalIdClasses = "text-xl md:text-2xl ml-2 text-gray-500";
  const horizontalTypeClasses =
    "px-4 py-1 rounded-full text-sm md:text-base font-semibold";
  const horizontalSectionTitleClasses =
    "font-semibold text-gray-700 mb-2 text-lg md:text-xl";
  const horizontalListItemClasses = "text-base md:text-lg";

  // Tailwind classes for vertical layout (grid view) - Adjusted for responsiveness
  const verticalLayout = `p-4 flex flex-col items-center`;
  const verticalImageClasses =
    "w-full max-w-[12rem] h-auto object-contain mb-4"; // Adjusted
  const verticalNameClasses =
    "text-3xl font-bold capitalize mb-2 text-gray-800 min-h-[4rem] flex items-center justify-center text-center";
  const verticalIdClasses = "text-sm ml-2 text-gray-500";
  const verticalTypeClasses = "px-3 py-0.5 rounded-full text-xs font-semibold";
  const verticalSectionTitleClasses = "font-semibold text-gray-700 mb-1";
  const verticalListItemClasses = "text-sm";

  const abilitiesMinHeightClass = layout === "vertical" ? "min-h-[5rem]" : "";

  return (
    <div
      className={`${cardBase} ${
        layout === "horizontal" ? horizontalLayout : verticalLayout
      } font-inter`}
    >
      <div className="flex flex-col items-center gap-4">
        <img
          src={mainImageSrc}
          alt={pokemon.name}
          className={`${
            layout === "horizontal"
              ? horizontalMainImageClasses
              : verticalImageClasses
          } drop-shadow-md`}
          style={{ imageRendering: "pixelated" }}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = `https://placehold.co/${
              layout === "horizontal" ? "512x512" : "256x256"
            }/cccccc/ffffff?text=No+Image`;
          }}
        />

        {layout === "horizontal" && (
          <div className="flex flex-wrap justify-center gap-2">
            {homeShinyImageSrc && (
              <img
                src={homeShinyImageSrc}
                alt={`${pokemon.name} home shiny`}
                title={`${pokemon.name} Home Shiny`}
                className={`${horizontalAltImageClasses} drop-shadow-sm`}
                style={{ imageRendering: "pixelated" }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `https://placehold.co/256x256/cccccc/ffffff?text=Shiny`;
                }}
              />
            )}
          </div>
        )}
      </div>

      <div className={`${layout === "horizontal" ? "flex-grow" : ""}`}>
        <h2
          className={`${
            layout === "horizontal"
              ? horizontalNameClasses
              : verticalNameClasses
          }`}
        >
          {pokemon.name}
          <span
            className={`${
              layout === "horizontal" ? horizontalIdClasses : verticalIdClasses
            }`}
          >
            #{pokemon.id}
          </span>
        </h2>

        <div className="flex flex-wrap gap-2 mb-3">
          {pokemon.types.map((t) => (
            <span
              key={t.type.name}
              className={`capitalize ${
                layout === "horizontal"
                  ? horizontalTypeClasses
                  : verticalTypeClasses
              } ${typeColors[t.type.name]}`}
            >
              {t.type.name}
            </span>
          ))}
        </div>

        {layout === "horizontal" && description && (
          <div className="mb-3">
            <h3 className={`${horizontalSectionTitleClasses}`}>Description:</h3>
            <p className={`text-gray-700 ${horizontalListItemClasses}`}>
              {description}
            </p>
          </div>
        )}

        {layout === "horizontal" && pokemonRegions.length > 0 && (
          <div className="mb-3">
            <h3 className={`${horizontalSectionTitleClasses}`}>Regions:</h3>
            <ul className="list-disc list-inside text-gray-600">
              {pokemonRegions.map((regionName) => (
                <li
                  key={regionName}
                  className={`capitalize ${horizontalListItemClasses}`}
                >
                  {regionName}
                </li>
              ))}
            </ul>
          </div>
        )}

        {layout === "horizontal" && (
          <div className="mb-3">
            <h3 className={`${horizontalSectionTitleClasses}`}>
              Physical Attributes:
            </h3>
            <ul className="text-gray-600">
              <li
                className={`flex justify-between ${horizontalListItemClasses}`}
              >
                <span>Height:</span>
                <span>{heightInMeters} m</span>
              </li>
              <li
                className={`flex justify-between ${horizontalListItemClasses}`}
              >
                <span>Weight:</span>
                <span>{weightInKilograms} kg</span>
              </li>
            </ul>
          </div>
        )}

        <div className={`mb-3 ${abilitiesMinHeightClass}`}>
          <h3 className={`${horizontalSectionTitleClasses}`}>Abilities:</h3>
          <ul className="list-disc list-inside text-gray-600">
            {pokemon.abilities.map((a) => (
              <li
                key={a.ability.name}
                className={`capitalize ${
                  layout === "horizontal"
                    ? horizontalListItemClasses
                    : verticalListItemClasses
                }`}
              >
                {a.ability.name}{" "}
                {a.is_hidden && (
                  <span className="text-gray-500 text-xs">(Hidden)</span>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-2">
          <h3 className={`${horizontalSectionTitleClasses}`}>Base Stats:</h3>
          <ul className="text-gray-600">
            {pokemon.stats.map((s) => (
              <li
                key={s.stat.name}
                className={`flex justify-between ${
                  layout === "horizontal"
                    ? horizontalListItemClasses
                    : verticalListItemClasses
                }`}
              >
                <span className="capitalize">{s.stat.name}:</span>
                <span>{s.base_stat}</span>
              </li>
            ))}
            <li
              className={`flex justify-between font-bold text-gray-700 mt-2 ${
                layout === "horizontal"
                  ? horizontalListItemClasses
                  : verticalListItemClasses
              }`}
            >
              <span>Total:</span>
              <span>{totalBaseStat}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default PokemonCard;
