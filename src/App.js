import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion } from "framer-motion";

import PokemonCard from "./components/PokemonCard";
import FilterType from "./components/FilterType";
import Footer from "./components/Footer";
import PokemonScanner from "./components/PokemonScanner";

const formatPokemonName = (rawName) => {
  if (!rawName) return "";
  let name = rawName.toLowerCase();
  
  const capitalize = (str) => {
    if (!str) return "";
    return str.split("-").map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
  };

  if (name.includes("-mega-x")) {
    const base = name.replace("-mega-x", "");
    return `Mega ${capitalize(base)} X`;
  }
  if (name.includes("-mega-y")) {
    const base = name.replace("-mega-y", "");
    return `Mega ${capitalize(base)} Y`;
  }
  if (name.includes("-mega")) {
    const base = name.replace("-mega", "");
    return `Mega ${capitalize(base)}`;
  }
  if (name.includes("-gmax")) {
    const base = name.replace("-gmax", "");
    return `Gmax ${capitalize(base)}`;
  }
  if (name.includes("-alola")) {
    const base = name.replace("-alola", "");
    return `Alolan ${capitalize(base)}`;
  }
  if (name.includes("-galar")) {
    const base = name.replace("-galar", "");
    return `Galarian ${capitalize(base)}`;
  }
  if (name.includes("-hisui")) {
    const base = name.replace("-hisui", "");
    return `Hisuian ${capitalize(base)}`;
  }
  if (name.includes("-paldea")) {
    const base = name.replace("-paldea", "");
    return `Paldean ${capitalize(base)}`;
  }
  
  return capitalize(rawName);
};

// Defines brand-accurate flat type colors with subtle 1px border for consistent rendering
const typeColors = {
  normal: "bg-[#A8A77A] text-slate-900 border-[#96956D]",
  fire: "bg-[#EE8130] text-white border-[#D67026]",
  water: "bg-[#6390F0] text-white border-[#537DCF]",
  grass: "bg-[#7AC74C] text-white border-[#68A93E]",
  electric: "bg-[#F7D02C] text-slate-900 border-[#DEC025]",
  ice: "bg-[#96D9D6] text-slate-900 border-[#83C1BF]",
  fighting: "bg-[#C22E28] text-white border-[#A52520]",
  poison: "bg-[#A33EA1] text-white border-[#8B3489]",
  ground: "bg-[#E2BF65] text-slate-900 border-[#CDB059]",
  flying: "bg-[#A98FF3] text-white border-[#947CE2]",
  psychic: "bg-[#F95587] text-white border-[#DF4876]",
  bug: "bg-[#A6B91A] text-slate-900 border-[#90A114]",
  rock: "bg-[#B6A136] text-white border-[#9C8A2C]",
  ghost: "bg-[#735797] text-white border-[#624A81]",
  dragon: "bg-[#6F35FC] text-white border-[#5B2BD8]",
  steel: "bg-[#B7B7CE] text-slate-900 border-[#9E9EAF]",
  dark: "bg-[#705746] text-white border-[#5C4739]",
  fairy: "bg-[#D685AD] text-slate-950 border-[#BD7298]",
};

// Stat configuration duplicating same colors from PokemonCard for comparison
const statMeta = {
  hp: { label: "HP", color: "bg-red-500", max: 255 },
  attack: { label: "ATK", color: "bg-orange-500", max: 190 },
  defense: { label: "DEF", color: "bg-yellow-500", max: 230 },
  "special-attack": { label: "SPA", color: "bg-blue-500", max: 194 },
  "special-defense": { label: "SPD", color: "bg-green-500", max: 230 },
  speed: { label: "SPE", color: "bg-pink-500", max: 180 },
};

function PokeBallLoader({ message }) {
  return (
    <div className="flex flex-col items-center justify-center mt-12 mb-8 select-none">
      <div className="relative w-20 h-20 animate-pokeball-spin mb-4">
        {/* Poke Ball Outer Ring */}
        <div className="absolute inset-0 rounded-full border-4 border-slate-950 bg-white overflow-hidden shadow-md">
          {/* Upper Red Half */}
          <div className="w-full h-1/2 bg-theme-accent border-b-2 border-slate-950"></div>
          {/* Lower White Half */}
          <div className="w-full h-1/2 bg-white"></div>
        </div>
        {/* Horizontal Black Band */}
        <div className="absolute top-[36px] inset-x-0 h-2.5 bg-slate-950"></div>
        {/* Center Button */}
        <div className="absolute top-[26px] left-[26px] w-7 h-7 rounded-full border-4 border-slate-950 bg-white flex items-center justify-center shadow-sm">
          <div className="w-2.5 h-2.5 rounded-full animate-btn-blink"></div>
        </div>
      </div>
      <p className="text-theme-accent font-display font-semibold text-xs tracking-wider animate-pulse">
        {message}
      </p>
    </div>
  );
}

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

  // Compare View states
  const [comparedPokemon, setComparedPokemon] = useState([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

  const pokemonToRegionMapRef = useRef({});
  const generationSpeciesCache = useRef({});

  const memoizedPokemonList = useMemo(() => pokemonList, [pokemonList]);

  // Set document root to dark theme once on mount
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "dark");
  }, []);

  // Dynamic Background style classes based on primary type
  const getBackgroundStyle = () => {
    if (!selectedPokemon) {
      return "bg-theme-bg text-theme-primary";
    }
    const type = selectedPokemon.types[0].type.name;

    const typeBgs = {
      normal: "from-slate-900/60 to-slate-950",
      fire: "from-red-950/40 to-slate-950",
      water: "from-blue-950/40 to-slate-950",
      grass: "from-green-950/40 to-slate-950",
      electric: "from-amber-950/30 to-slate-950",
      ice: "from-cyan-950/40 to-slate-950",
      fighting: "from-rose-950/40 to-slate-950",
      poison: "from-purple-950/40 to-slate-950",
      ground: "from-yellow-950/30 to-slate-950",
      flying: "from-indigo-950/30 to-slate-950",
      psychic: "from-pink-950/40 to-slate-950",
      bug: "from-lime-950/40 to-slate-950",
      rock: "from-yellow-950/40 to-slate-950",
      ghost: "from-indigo-950/40 to-slate-950",
      dragon: "from-violet-950/40 to-slate-950",
      steel: "from-slate-900 to-slate-950",
      dark: "from-neutral-900 to-slate-950",
      fairy: "from-rose-950/35 to-slate-950",
    };
    return `bg-gradient-to-b ${typeBgs[type] || typeBgs.normal}`;
  };

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
        toast.error("Failed to load initial PokeAPI mappings.");
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
      toast.error("Failed to fetch full Pokédex dataset.");
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
        : "No Pokédex entry recorded for this form.";
      setSelectedPokemonDescription(cleanedDescription);
    } catch (error) {
      setSelectedPokemonDescription("No Pokédex entry recorded for this form.");
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
        let matchesName = true;
        const queryLower = nameQuery.trim().toLowerCase();
        if (queryLower) {
          const nameMatch = pokemon.name.toLowerCase().includes(queryLower);
          
          // Generate same tag categories parsed in PokemonCard.jsx
          const tags = [];
          const name = pokemon.name.toLowerCase();
          if (name.includes("-mega")) tags.push("mega evolution", "mega");
          if (name.includes("-alola")) tags.push("alolan form", "alolan", "alola");
          if (name.includes("-galar")) tags.push("galarian form", "galarian", "galar");
          if (name.includes("-hisui")) tags.push("hisuian form", "hisuian", "hisui");
          if (name.includes("-paldea")) tags.push("paldean form", "paldean", "paldea");
          if (name.includes("-gmax")) tags.push("gigantamax", "gmax");
          if (!pokemon.is_default && !name.includes("-mega") && !name.includes("-gmax")) tags.push("special form", "special");

          const tagMatch = tags.some((tag) => tag.includes(queryLower) || queryLower.includes(tag));
          matchesName = nameMatch || tagMatch;
        }

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

  const focusSearchInput = useCallback(() => {
    const input = document.querySelector('input[placeholder="Search by name or number..."]');
    if (input) {
      input.focus();
      input.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  const handleToggleCompare = useCallback((pokemon) => {
    const exists = comparedPokemon.some((p) => p.id === pokemon.id);
    if (exists) {
      setComparedPokemon((current) => current.filter((p) => p.id !== pokemon.id));
      toast.info(`Removed ${formatPokemonName(pokemon.name)} from comparison.`);
    } else {
      if (comparedPokemon.length >= 3) {
        toast.warning("Comparative list is full! Maximum limit is 3 Pokémon.");
      } else {
        setComparedPokemon((current) => [...current, pokemon]);
        toast.success(`Registered ${formatPokemonName(pokemon.name)} for comparison.`);
      }
    }
  }, [comparedPokemon]);

  return (
    <div className={`min-h-screen flex flex-col items-center transition-all duration-350 relative overflow-hidden ${getBackgroundStyle()}`}>
      
      {/* Subtle Poké Ball Watermark (colors mapped dynamically via CSS vars) */}
      <div className="absolute top-12 right-12 w-64 h-64 text-theme-watermark pointer-events-none -z-10 select-none">
        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="6" className="w-full h-full">
          <circle cx="50" cy="50" r="45" />
          <line x1="5" y1="50" x2="95" y2="50" />
          <circle cx="50" cy="50" r="15" fill="currentColor" className="opacity-20" />
          <circle cx="50" cy="50" r="7" fill="none" />
        </svg>
      </div>

      <ToastContainer
        position="top-right"
        autoClose={2500}
        theme="dark"
        toastClassName="bg-theme-surface border-2 border-theme-accent text-theme-primary rounded-2xl font-display"
      />

      <div className="flex-grow flex flex-col items-center w-full py-8 px-4 sm:px-6 lg:px-8 max-w-7xl z-10">
        
        {/* Pokedex Header Title */}
        <h1 className="text-5xl sm:text-6xl font-display font-extrabold text-theme-primary mb-8 tracking-[-0.02em] flex items-center justify-center gap-4 select-none">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            type="button"
            onClick={handleGoHome}
            className="rounded-full focus:outline-none focus:ring-4 focus:ring-theme-accent/50 cursor-pointer"
            title="Go to main screen"
            aria-label="Go to main screen"
          >
            {/* Spinning Poke Ball logo icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 200 200"
              className="w-16 h-16 sm:w-20 sm:h-20"
            >
              <circle cx="100" cy="100" r="95" fill="#f8fafc" stroke="#0f172a" strokeWidth="12" />
              <path d="M5,100 a95,95 0 0,1 190,0" fill="var(--color-accent-red)" stroke="#0f172a" strokeWidth="12" />
              <rect x="5" y="94" width="190" height="12" fill="#0f172a" />
              <circle cx="100" cy="100" r="32" fill="#f8fafc" stroke="#0f172a" strokeWidth="12" />
              <circle cx="100" cy="100" r="16" fill="#cbd5e1" stroke="#475569" strokeWidth="4" />
            </svg>
          </motion.button>
          <span
            className="font-display font-extrabold tracking-[-0.02em] select-none"
            style={{
              backgroundImage: "linear-gradient(to right, var(--color-accent-red), var(--color-text-primary))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              display: "inline-block",
            }}
          >
            Pokedex
          </span>

        </h1>

        {/* Dashboard Control Deck */}
        <div className="w-full max-w-4xl flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4 mb-12">
          <FilterType
            key={filterResetKey}
            types={types}
            generations={generations}
            onSearchAndFilter={handleSearchAndFilter}
            isLoading={isLoading}
          />

          {/* Camera Scanner Trigger */}
          <div className="relative group flex-shrink-0">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              onClick={() => setShowScanner(true)}
              className="p-3 bg-theme-accent hover:opacity-90 text-white rounded-2xl shadow-md flex items-center justify-center w-full sm:w-14 h-14 border border-theme cursor-pointer"
              title="Scan Pokemon"
              disabled={isScanning || isLoading}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
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
            </motion.button>
            {/* Custom Tooltip */}
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900 border border-slate-700 text-[10px] font-display font-semibold text-white px-2.5 py-1 rounded shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
              SCAN POKEMON
            </span>
          </div>
        </div>

        {/* Scanner Component Modal */}
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

        {/* Custom Poké Ball loading animation */}
        {(isLoading || isScanning) && (
          <PokeBallLoader
            message={isScanning ? "DEX LENS SEARCHING ARCHIVES..." : "CONNECTING TO POKÉ-SERVERS..."}
          />
        )}

        {/* Selected Pokémon detailed view */}
        {selectedPokemon && !showScanner && (
          <div className="w-full max-w-4xl mb-8">
            <PokemonCard
              pokemon={selectedPokemon}
              layout="horizontal"
              pokemonToRegionMap={pokemonToRegionMapRef.current}
              description={selectedPokemonDescription}
            />
          </div>
        )}

        {/* Staggered result cards grid */}
        {filteredPokemon.length > 0 && !showScanner && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-4 w-full max-w-screen-xl">
            {filteredPokemon.map((pokemon, idx) => (
              <motion.div
                key={pokemon.id}
                onClick={() => handleCardClick(pokemon)}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 100,
                  damping: 15,
                  delay: Math.min(idx * 0.04, 0.5),
                }}
                className="cursor-pointer h-full"
              >
                <PokemonCard
                  pokemon={pokemon}
                  layout="vertical"
                  pokemonToRegionMap={pokemonToRegionMapRef.current}
                  onToggleCompare={handleToggleCompare}
                  isCompared={comparedPokemon.some((p) => p.id === pokemon.id)}
                />
              </motion.div>
            ))}
          </div>
        )}

        {/* Landing Home screen greeting */}
        {!isLoading &&
          !selectedPokemon &&
          filteredPokemon.length === 0 &&
          !isScanning &&
          !showScanner && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 80, damping: 15 }}
              className="flex flex-col lg:flex-row items-center justify-between w-full max-w-4xl gap-10 p-8 sm:p-10 bg-theme-surface border border-theme shadow-2xl rounded-3xl backdrop-blur-sm mt-8 relative overflow-hidden select-none"
            >
              {/* Subtle animated background element */}
              <div className="absolute inset-0 -z-10 bg-gradient-to-tr from-theme-surface via-theme-surface to-theme-accent/5 opacity-40 pointer-events-none" />
              {/* Faint rotating Poké Ball motif (motion-safe) */}
              <div className="absolute -right-20 -bottom-20 w-80 h-80 text-theme-watermark pointer-events-none opacity-40 -z-10 select-none motion-safe:animate-[poke-ball-spin_60s_infinite_linear]">
                <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3" className="w-full h-full">
                  <circle cx="50" cy="50" r="45" />
                  <line x1="5" y1="50" x2="95" y2="50" />
                  <circle cx="50" cy="50" r="15" fill="currentColor" className="opacity-15" />
                  <circle cx="50" cy="50" r="7" fill="none" />
                </svg>
              </div>

              <div className="flex-grow flex flex-col items-start text-left max-w-xl">
                <h2 className="text-4xl sm:text-5xl font-display font-extrabold text-theme-primary leading-tight tracking-[-0.02em] mb-4">
                  Explore the <span className="text-theme-accent">Infinite Universe</span> of Pokémon
                </h2>
                <p className="text-base sm:text-lg font-display text-theme-secondary tracking-normal mb-8 leading-relaxed">
                  Analyze battle statistics, map regional variants, and utilize the advanced Dex Scanner to catalog every species in real-time.
                </p>
                <div className="flex flex-wrap gap-4 w-full">
                  <button
                    onClick={focusSearchInput}
                    className="flex-1 sm:flex-initial px-6 py-3.5 bg-theme-accent text-white font-display font-bold text-sm rounded-2xl shadow-lg hover:opacity-90 transition-transform active:scale-[0.97] focus:outline-none flex items-center justify-center gap-2 border border-theme-accent"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.637 10.637Z" />
                    </svg>
                    Search Database
                  </button>
                  <button
                    onClick={() => setShowScanner(true)}
                    className="flex-1 sm:flex-initial px-6 py-3.5 bg-theme-surface border border-theme text-theme-primary font-display font-bold text-sm rounded-2xl shadow-md hover:bg-theme-surface-hover transition-transform active:scale-[0.97] focus:outline-none flex items-center justify-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15.5a2.25 2.25 0 0 0 2.25-2.25V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.053 47.745 47.745 0 0 0-3.91-.228 2.192 2.192 0 0 0-1.736 1.053l-.822 1.316z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 13.5a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5z" />
                    </svg>
                    Launch Scanner
                  </button>
                </div>
              </div>

              {/* Large Bobbing Pikachu graphic (respects reduced motion) */}
              <div className="relative w-44 h-44 sm:w-52 sm:h-52 bg-theme-input rounded-3xl p-4 border border-theme flex items-center justify-center shadow-inner flex-shrink-0 motion-safe:animate-float">
                <img
                  src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/25.gif"
                  alt="Pikachu"
                  className="w-36 h-36 object-contain"
                />
              </div>
            </motion.div>
          )}
      </div>

      {/* Floating Compare drawer bar */}
      {comparedPokemon.length > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 15 }}
          className="fixed bottom-6 z-40 bg-theme-surface/75 backdrop-blur-md border-2 border-theme rounded-3xl shadow-xl p-5 flex flex-col gap-3 max-w-full sm:max-w-xl select-none"
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 overflow-x-auto">
              {comparedPokemon.map((p) => (
                <motion.div
                  layout
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 18 }}
                  key={p.id}
                  className="relative group"
                >
                  <div className="w-12 h-12 bg-theme-input rounded-xl p-1.5 flex items-center justify-center">
                    <img
                      src={p.sprites?.other?.home?.front_default || p.sprites?.front_default}
                      alt={formatPokemonName(p.name)}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleCompare(p);
                    }}
                    className="absolute -top-1.5 -right-1.5 bg-theme-accent hover:opacity-90 rounded-full w-4.5 h-4.5 flex items-center justify-center border border-theme text-white text-[9px] font-bold"
                    title="Remove"
                  >
                    &times;
                  </button>
                </motion.div>
              ))}

              {/* Empty slots placeholders */}
              {Array.from({ length: 3 - comparedPokemon.length }).map((_, i) => (
                <div
                  key={i}
                  className="w-12 h-12 bg-theme-input/40 border-2 border-dashed border-theme rounded-xl flex items-center justify-center text-theme-secondary/40 text-xs font-display font-semibold"
                >
                  +
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-1.5 sm:flex-row">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                onClick={() => setShowCompareModal(true)}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold font-display rounded-xl shadow-md whitespace-nowrap cursor-pointer"
                disabled={comparedPokemon.length < 2}
                title={comparedPokemon.length < 2 ? "Add at least 2 Pokemon to compare" : "Open comparison charts"}
              >
                Compare ({comparedPokemon.length}/3)
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                onClick={() => setComparedPokemon([])}
                className="px-3 py-2.5 bg-theme-surface-hover hover:opacity-85 text-theme-secondary text-xs font-display rounded-xl border border-theme cursor-pointer"
              >
                Clear
              </motion.button>
            </div>
          </div>

          {/* Progress Bar under Compare count - reaches exactly 100% when 3/3 */}
          <div className="w-full">
            <div className="w-full h-1 bg-theme-input rounded-full overflow-hidden">
              <div
                className="h-full bg-theme-accent transition-all duration-300 rounded-full"
                style={{ width: `${(comparedPokemon.length / 3) * 100}%` }}
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Side-by-side Comparative Analysis modal dialog */}
      {showCompareModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 120, damping: 18 }}
            className="bg-theme-surface border-2 border-theme rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl relative"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCompareModal(false)}
              className="absolute top-4 right-4 bg-theme-surface-hover text-theme-primary font-bold p-2 rounded-full border border-theme hover:border-theme-accent flex items-center justify-center focus:outline-none cursor-pointer"
              title="Close Comparison Panel"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.button>

            <h2 className="text-2xl font-display font-extrabold text-theme-primary mb-6 tracking-[-0.015em]">
              Dex Comparative Analysis
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {comparedPokemon.map((p) => {
                const img = p.sprites?.other?.home?.front_default || p.sprites?.front_default;
                const totalStats = p.stats.reduce((sum, s) => sum + s.base_stat, 0);

                return (
                  <div
                    key={p.id}
                    className="bg-theme-bg border border-theme rounded-2xl p-5 flex flex-col items-center shadow-md relative animate-card-in"
                  >
                    <div className="absolute top-3 right-3 text-[10px] font-display font-semibold text-theme-accent">
                      #{String(p.id).padStart(3, "0")}
                    </div>

                    {/* Image container set to p-2.5 (~10px padding) to occupy 80-90% of frame without cropping */}
                    <div className="w-28 h-28 bg-theme-surface rounded-xl p-2.5 flex items-center justify-center mb-4">
                      <img
                        src={img}
                        alt={formatPokemonName(p.name)}
                        className="w-full h-full object-contain"
                      />
                    </div>

                    <h3 className="text-lg font-display font-bold text-theme-primary text-center mb-2">
                      {formatPokemonName(p.name)}
                    </h3>

                    {/* Dynamic Brand Accurate Flat Type Badges (no glossy look) */}
                    <div className="flex gap-1.5 mb-5 justify-center flex-wrap">
                      {p.types.map((t) => (
                        <span
                          key={t.type.name}
                          className={`px-3 py-0.5 rounded-full text-[10px] font-display font-bold border capitalize ${typeColors[t.type.name]}`}
                        >
                          {t.type.name}
                        </span>
                      ))}
                    </div>

                    <div className="w-full flex flex-col gap-3.5 border-t border-theme pt-4">
                      <div className="flex justify-between text-xs font-display">
                        <span className="text-theme-secondary">HEIGHT</span>
                        <span className="text-theme-primary font-semibold">{(p.height / 10).toFixed(1)} m</span>
                      </div>
                      <div className="flex justify-between text-xs font-display pb-3.5 border-b border-theme">
                        <span className="text-theme-secondary">WEIGHT</span>
                        <span className="text-theme-primary font-semibold">{(p.weight / 10).toFixed(1)} kg</span>
                      </div>

                      {/* Stat Bars Comparison */}
                      {p.stats.map((s) => {
                        const meta = statMeta[s.stat.name];
                        if (!meta) return null;
                        const pct = Math.min((s.base_stat / meta.max) * 100, 100);

                        return (
                          <div key={s.stat.name} className="flex flex-col text-[10px] font-display">
                            <div className="flex justify-between mb-1.5">
                              <span className="text-theme-secondary capitalize">{meta.label}</span>
                              <span className="text-theme-primary font-bold">{s.base_stat}</span>
                            </div>
                            <div className="w-full h-2 bg-theme-surface rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${meta.color} animate-stat-grow`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}

                      <div className="flex justify-between text-xs font-display text-theme-accent pt-2 border-t border-theme">
                        <span className="font-bold">TOTAL SCORE</span>
                        <span className="font-extrabold">{totalStats}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default App;
