import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import PokemonCard from "./components/PokemonCard";
import FilterType from "./components/FilterType";
import Footer from "./components/Footer";
import PokemonScanner from "./components/PokemonScanner";

function App() {
  const [pokemonList, setPokemonList] = useState([]);
  const [types, setTypes] = useState([]);
  const [generations, setGenerations] = useState([]);
  const [filteredPokemon, setFilteredPokemon] = useState([]);
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const [selectedPokemonDescription, setSelectedPokemonDescription] =
    useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [hasFetchedAllPokemon, setHasFetchedAllPokemon] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [filterResetKey, setFilterResetKey] = useState(0);

  const pokemonToRegionMapRef = useRef({});
  const generationSpeciesCache = useRef({});

  const memoizedPokemonList = useMemo(() => pokemonList, [pokemonList]);

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
          id: parseInt(gen.url.split("/").slice(-2, -1)[0], 10),
        }));
        setGenerations(formattedGenerations);

        const pokedexListRes = await axios.get(
          "https://pokeapi.co/api/v2/pokedex"
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
      } catch (error) {
        console.error("Error fetching initial data:", error);
        toast.error("Failed to load initial data. Please refresh.");
      }
    };

    fetchInitialData();
  }, []);

  const fetchAllPokemonData = useCallback(async () => {
    if (hasFetchedAllPokemon) {
      return;
    }

    setIsLoading(true);
    try {
      const res = await axios.get(
        "https://pokeapi.co/api/v2/pokemon?limit=10000"
      );
      const promises = res.data.results.map((pokemon) =>
        axios.get(pokemon.url).then((response) => response.data)
      );
      const results = await Promise.all(promises);
      setPokemonList(results);
      setHasFetchedAllPokemon(true);
    } catch (error) {
      toast.error("Failed to load Pokemon data.");
      setHasFetchedAllPokemon(false);
    } finally {
      setIsLoading(false);
    }
  }, [hasFetchedAllPokemon]);

  const toSentenceCase = (text) => {
    if (!text) {
      return "";
    }

    return (
      text.charAt(0).toUpperCase() +
      text
        .slice(1)
        .toLowerCase()
        .replace(/([.?!]\s*)([a-z])/g, (match, prefix, letter) => {
          return prefix + letter.toUpperCase();
        })
    );
  };

  const fetchPokemonDescription = useCallback(async (pokemonNameOrId) => {
    try {
      const speciesRes = await axios.get(
        `https://pokeapi.co/api/v2/pokemon-species/${pokemonNameOrId.toLowerCase()}/`
      );
      const englishDescription = speciesRes.data.flavor_text_entries.find(
        (entry) => entry.language.name === "en"
      );
      const cleanedDescription = englishDescription
        ? toSentenceCase(englishDescription.flavor_text.replace(/\f/g, " "))
        : "No description available.";
      setSelectedPokemonDescription(cleanedDescription);
    } catch (error) {
      setSelectedPokemonDescription("Description unavailable.");
    }
  }, []);

  const handleSearchAndFilter = useCallback(
    async (nameQuery, typeQuery, selectedGenerationId) => {
      setIsLoading(true);
      setFilteredPokemon([]);
      setSelectedPokemon(null);
      setSelectedPokemonDescription("");
      setShowScanner(false);

      if (!hasFetchedAllPokemon) {
        await fetchAllPokemonData();
      }

      let generationPokemonNames = null;
      if (selectedGenerationId) {
        if (generationSpeciesCache.current[selectedGenerationId]) {
          generationPokemonNames =
            generationSpeciesCache.current[selectedGenerationId];
        } else {
          const genSpeciesRes = await axios.get(
            `https://pokeapi.co/api/v2/generation/${selectedGenerationId}/`
          );
          const speciesNames = new Set(
            genSpeciesRes.data.pokemon_species.map((species) => species.name)
          );
          generationSpeciesCache.current[selectedGenerationId] = speciesNames;
          generationPokemonNames = speciesNames;
        }
      }

      const filtered = pokemonList.filter((pokemon) => {
        const matchesName = nameQuery.trim()
          ? pokemon.name.toLowerCase().includes(nameQuery.toLowerCase())
          : true;
        const matchesType = typeQuery
          ? pokemon.types.some((type) => type.type.name === typeQuery)
          : true;
        const matchesGeneration = selectedGenerationId
          ? generationPokemonNames.has(pokemon.name)
          : true;

        return matchesName && matchesType && matchesGeneration;
      });

      setFilteredPokemon(filtered);

      if (
        filtered.length === 1 &&
        filtered[0].name.toLowerCase() === nameQuery.toLowerCase()
      ) {
        setSelectedPokemon(filtered[0]);
        fetchPokemonDescription(filtered[0].name);
        setFilteredPokemon([]);
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

  const handleCardClick = (pokemon) => {
    setSelectedPokemon(pokemon);
    setSelectedPokemonDescription("");
    fetchPokemonDescription(pokemon.name);
    setFilteredPokemon([]);
    setShowScanner(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePokemonScanned = useCallback((pokemon) => {
    setSelectedPokemon(pokemon);
    setFilteredPokemon([]);
    setShowScanner(false);
  }, []);

  const handleScanningChange = useCallback((scanning) => {
    setIsScanning(scanning);
  }, []);

  const handleCloseScanner = useCallback(() => {
    setShowScanner(false);
    setIsScanning(false);
  }, []);

  const handleGoHome = useCallback(() => {
    setFilteredPokemon([]);
    setSelectedPokemon(null);
    setSelectedPokemonDescription("");
    setShowScanner(false);
    setIsScanning(false);
    setIsLoading(false);
    setFilterResetKey((currentKey) => currentKey + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-100 to-white flex flex-col items-center font-inter">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="flex-grow flex flex-col items-center w-full py-8 px-4 sm:px-6 lg:px-8">
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-black drop-shadow-sm mb-8 tracking-tight flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={handleGoHome}
            className="rounded-full transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            title="Go to home page"
            aria-label="Go to home page"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 200 200"
              width="80"
              height="80"
              className="w-20 h-20"
            >
              <circle
                cx="100"
                cy="100"
                r="95"
                fill="white"
                stroke="black"
                strokeWidth="10"
              />
              <path
                d="M5,100 a95,95 0 0,1 190,0"
                fill="red"
                stroke="black"
                strokeWidth="10"
              />
              <rect x="5" y="90" width="190" height="20" fill="black" />
              <circle
                cx="100"
                cy="100"
                r="25"
                fill="white"
                stroke="black"
                strokeWidth="8"
              />
              <circle cx="100" cy="100" r="12" fill="lightgrey" />
            </svg>
          </button>
          Pokedex
        </h1>

        <div className="w-full max-w-4xl flex flex-col md:flex-row items-center justify-center gap-6 mb-12">
          <FilterType
            key={filterResetKey}
            types={types}
            generations={generations}
            onSearchAndFilter={handleSearchAndFilter}
            isLoading={isLoading}
          />

          <button
            onClick={() => setShowScanner(true)}
            className="p-3 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition transform hover:scale-110 flex items-center justify-center w-12 h-12 flex-shrink-0"
            title="Open Pokemon Scanner"
            disabled={isScanning || isLoading}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15.5a2.25 2.25 0 002.25-2.25V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.053 47.745 47.745 0 00-3.91-.228 2.192 2.192 0 00-1.736 1.053l-.822 1.316z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 13.5a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z"
              />
            </svg>
          </button>
        </div>

        {showScanner && (
          <PokemonScanner
            pokemonList={memoizedPokemonList}
            onPokemonScanned={handlePokemonScanned}
            onScanningChange={handleScanningChange}
            fetchPokemonDescription={fetchPokemonDescription}
            isVisible={showScanner}
            onClose={handleCloseScanner}
          />
        )}

        {(isLoading || isScanning) && (
          <div className="flex items-center justify-center mt-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
            <p className="text-blue-600 text-lg ml-4 font-medium">
              {isScanning ? "Analyzing image..." : "Loading..."}
            </p>
          </div>
        )}

        {selectedPokemon && !showScanner && (
          <div className="w-full max-w-5xl mb-8">
            <PokemonCard
              pokemon={selectedPokemon}
              layout="horizontal"
              pokemonToRegionMap={pokemonToRegionMapRef.current}
              description={selectedPokemonDescription}
            />
          </div>
        )}

        {filteredPokemon.length > 0 && !showScanner && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-8 w-full max-w-screen-xl">
            {filteredPokemon.map((pokemon) => (
              <div
                key={pokemon.id}
                onClick={() => handleCardClick(pokemon)}
                className="cursor-pointer"
              >
                <PokemonCard
                  pokemon={pokemon}
                  layout="vertical"
                  pokemonToRegionMap={pokemonToRegionMapRef.current}
                />
              </div>
            ))}
          </div>
        )}

        {!isLoading &&
          !selectedPokemon &&
          filteredPokemon.length === 0 &&
          !isScanning &&
          !showScanner && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-8 text-center sm:text-left max-w-2xl">
              <p className="text-xl sm:text-2xl lg:text-3xl text-gray-700 font-medium">
                Start your Pokemon journey: Search or filter to begin!
              </p>
              <img
                src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/25.gif"
                alt="Pikachu"
                className="w-24 h-24 sm:w-32 sm:h-32 object-contain"
              />
            </div>
          )}
      </div>
      <Footer />
    </div>
  );
}

export default App;
