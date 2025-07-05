import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import PokemonCard from "./components/PokemonCard";
import FilterType from "./components/FilterType";

function App() {
  const [pokemonList, setPokemonList] = useState([]);
  const [types, setTypes] = useState([]);
  const [generations, setGenerations] = useState([]);
  const [filteredPokemon, setFilteredPokemon] = useState([]);
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const [selectedPokemonDescription, setSelectedPokemonDescription] =
    useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetchedAllPokemon, setHasFetchedAllPokemon] = useState(false);

  const pokemonToRegionMapRef = useRef({});
  const generationSpeciesCache = useRef({});

  // Fetches initial data like types, generations, and builds the region map
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const typeRes = await axios.get("https://pokeapi.co/api/v2/type");
        const validTypes = typeRes.data.results.filter(
          (type) =>
            type.name !== "unknown" &&
            type.name !== "shadow" &&
            type.name !== "stellar"
        );
        setTypes(validTypes);

        const genRes = await axios.get("https://pokeapi.co/api/v2/generation/");
        const formattedGenerations = genRes.data.results.map((gen) => ({
          ...gen,
          id: parseInt(gen.url.split("/").slice(-2, -1)[0]),
        }));
        setGenerations(formattedGenerations);

        const pokedexListRes = await axios.get(
          "https://pokeapi.co/api/v2/pokedex?limit=100"
        );
        const tempPokemonToRegionMap = {};

        const pokedexDetailsPromises = pokedexListRes.data.results.map((pdx) =>
          axios.get(pdx.url)
        );
        const pokedexDetails = await Promise.all(pokedexDetailsPromises);

        pokedexDetails.forEach((pdxDetail) => {
          const regionName = pdxDetail.data.region
            ? pdxDetail.data.region.name
            : null;
          if (regionName) {
            pdxDetail.data.pokemon_entries.forEach((entry) => {
              const pokemonName = entry.pokemon_species.name;
              if (!tempPokemonToRegionMap[pokemonName]) {
                tempPokemonToRegionMap[pokemonName] = new Set();
              }
              tempPokemonToRegionMap[pokemonName].add(regionName);
            });
          }
        });

        const finalPokemonToRegionMap = {};
        for (const pokemonName in tempPokemonToRegionMap) {
          finalPokemonToRegionMap[pokemonName] = Array.from(
            tempPokemonToRegionMap[pokemonName]
          );
        }
        pokemonToRegionMapRef.current = finalPokemonToRegionMap;
      } catch (err) {
        console.error("Error fetching initial data:", err);
        toast.error("Failed to load initial data. Please refresh the page.");
      }
    };
    fetchInitialData();
  }, []);

  // Fetches the entire Pokémon list from the API once
  const fetchAllPokemonData = useCallback(async () => {
    if (hasFetchedAllPokemon) return;
    setIsLoading(true);
    try {
      const res = await axios.get(
        "https://pokeapi.co/api/v2/pokemon?limit=10000"
      );
      const promises = res.data.results.map((p) =>
        axios.get(p.url).then((r) => r.data)
      );
      const results = await Promise.all(promises);
      setPokemonList(results);
      setHasFetchedAllPokemon(true);
    } catch (err) {
      console.error("Error fetching all Pokémon data:", err);
      toast.error("Failed to load all Pokémon data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [hasFetchedAllPokemon]);

  // Converts a string to sentence case
  const toSentenceCase = (text) => {
    if (!text) return "";
    return (
      text.charAt(0).toUpperCase() +
      text
        .slice(1)
        .toLowerCase()
        .replace(/([.?!]\s*)([a-z])/g, (match, p1, p2) => p1 + p2.toUpperCase())
    );
  };

  // Fetches and formats a Pokémon's description
  const fetchPokemonDescription = useCallback(async (pokemonNameOrId) => {
    try {
      const speciesRes = await axios.get(
        `https://pokeapi.co/api/v2/pokemon-species/${pokemonNameOrId.toLowerCase()}/`
      );
      const englishDescription = speciesRes.data.flavor_text_entries.find(
        (entry) => entry.language.name === "en"
      );
      const cleanedAndFormattedDescription = englishDescription
        ? toSentenceCase(englishDescription.flavor_text.replace(/\f/g, " "))
        : "No description available.";
      setSelectedPokemonDescription(cleanedAndFormattedDescription);
    } catch (err) {
      console.error("Error fetching Pokémon species data:", err);
      setSelectedPokemonDescription("Failed to load description.");
    }
  }, []);

  // Handles combined search and filter logic
  const handleSearchAndFilter = useCallback(
    async (nameQuery, typeQuery, selectedGenerationId) => {
      setIsLoading(true);
      setFilteredPokemon([]);
      setSelectedPokemon(null);
      setSelectedPokemonDescription("");

      if (!hasFetchedAllPokemon) {
        await fetchAllPokemonData();
      }

      let generationPokemonNames = null;
      if (selectedGenerationId) {
        if (pokemonList.length === 0) {
          toast.error(
            "Please wait for all Pokémon data to load before filtering by generation."
          );
          setIsLoading(false);
          return;
        }
        if (generationSpeciesCache.current[selectedGenerationId]) {
          generationPokemonNames =
            generationSpeciesCache.current[selectedGenerationId];
        } else {
          try {
            const genSpeciesRes = await axios.get(
              `https://pokeapi.co/api/v2/generation/${selectedGenerationId}/`
            );
            const speciesNames = new Set(
              genSpeciesRes.data.pokemon_species.map((s) => s.name)
            );
            generationSpeciesCache.current[selectedGenerationId] = speciesNames;
            generationPokemonNames = speciesNames;
          } catch (err) {
            console.error(
              `Error fetching Pokémon for generation ${selectedGenerationId}:`,
              err
            );
            toast.error(`Failed to load Pokémon for selected generation.`);
            setIsLoading(false);
            return;
          }
        }
      }

      // Filters the Pokémon list based on name, type, and generation
      const filtered = pokemonList.filter((p) => {
        // Name contains query (case-insensitive)
        const matchesName = nameQuery.trim()
          ? p.name.toLowerCase().includes(nameQuery.toLowerCase())
          : true;
        const matchesType = typeQuery
          ? p.types.some((t) => t.type.name === typeQuery)
          : true;
        const matchesGeneration = selectedGenerationId
          ? generationPokemonNames.has(p.name)
          : true;
        return matchesName && matchesType && matchesGeneration;
      });

      setFilteredPokemon(filtered);
      // If a single exact match is found (case-insensitive), display it as selected Pokémon
      if (
        filtered.length === 1 &&
        filtered[0].name.toLowerCase() === nameQuery.toLowerCase()
      ) {
        setSelectedPokemon(filtered[0]);
        fetchPokemonDescription(filtered[0].name);
        setFilteredPokemon([]);
      } else if (
        filtered.length === 0 &&
        (nameQuery.trim() !== "" ||
          selectedGenerationId !== "" ||
          typeQuery !== "")
      ) {
        toast.info("No Pokémon found matching your criteria.");
      }
      setIsLoading(false);
    },
    [
      pokemonList,
      hasFetchedAllPokemon,
      fetchAllPokemonData,
      fetchPokemonDescription,
    ]
  );

  // Handles clicking a Pokémon card to show its detailed view
  const handleCardClick = (pokemon) => {
    setSelectedPokemon(pokemon);
    setSelectedPokemonDescription("");
    fetchPokemonDescription(pokemon.name);
    setFilteredPokemon([]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-100 to-white flex flex-col items-center py-8 px-4 sm:px-6 lg:px-8 font-inter">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      <h1 className="text-5xl font-extrabold text-gray-900 mb-8 tracking-tight flex items-center gap-4">
        <svg
          width="48"
          height="48"
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-12 h-12"
        >
          <rect width="200" height="200" fill="white" />
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="white"
            stroke="black"
            strokeWidth="8"
          />
          <path
            d="M100 10V100H10C10 50.2944 50.2944 10 100 10Z"
            fill="url(#paint0_linear_1_2)"
          />
          <path d="M10 100H190" stroke="black" strokeWidth="8" />
          <circle
            cx="100"
            cy="100"
            r="30"
            fill="white"
            stroke="black"
            strokeWidth="8"
          />
          <circle cx="100" cy="100" r="15" fill="black" />
          <defs>
            <linearGradient
              id="paint0_linear_1_2"
              x1="100"
              y1="10"
              x2="100"
              y2="100"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#DC0A2D" />
              <stop offset="1" stopColor="#C00A2D" />
            </linearGradient>
          </defs>
        </svg>
        Pokédex
      </h1>

      <div className="w-full max-w-4xl flex flex-col md:flex-row items-center justify-center gap-6 mb-12">
        <FilterType
          types={types}
          generations={generations}
          onSearchAndFilter={handleSearchAndFilter}
          isLoading={isLoading}
        />
      </div>

      {isLoading && (
        <div className="flex items-center justify-center mt-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
          <p className="text-blue-600 text-lg ml-4 font-medium">
            {hasFetchedAllPokemon
              ? "Searching/Filtering Pokémon..."
              : "Loading all Pokémon data..."}
          </p>
        </div>
      )}

      {selectedPokemon && (
        <div className="w-full max-w-5xl mb-8">
          <PokemonCard
            pokemon={selectedPokemon}
            layout="horizontal"
            pokemonToRegionMap={pokemonToRegionMapRef.current}
            description={selectedPokemonDescription}
          />
        </div>
      )}

      {filteredPokemon.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-8 w-full max-w-screen-xl">
          {filteredPokemon.map((p) => (
            <div
              key={p.id}
              onClick={() => handleCardClick(p)}
              className="cursor-pointer"
            >
              <PokemonCard
                pokemon={p}
                layout="vertical"
                pokemonToRegionMap={pokemonToRegionMapRef.current}
              />
            </div>
          ))}
        </div>
      )}

      {!isLoading && !selectedPokemon && filteredPokemon.length === 0 && (
        <p className="mt-8 text-gray-500 text-lg">
          Enter a Pokémon name or ID, or filter by type to begin!
        </p>
      )}
    </div>
  );
}

export default App;
