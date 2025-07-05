import React, { useState, useEffect } from "react";
import axios from "axios";
import SearchBar from "./components/SearchBar"; // Corrected casing
import PokemonCard from "./components/PokemonCard";
import FilterType from "./components/FilterType";

function App() {
  const [pokemon, setPokemon] = useState(null);
  const [error, setError] = useState("");
  const [types, setTypes] = useState([]);
  const [filteredPokemon, setFilteredPokemon] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch all Pokémon types for filter dropdown
  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const res = await axios.get("https://pokeapi.co/api/v2/type");
        // Filter out "unknown" and "shadow" types as they often don't have associated Pokemon
        const validTypes = res.data.results.filter(
          (type) => type.name !== "unknown" && type.name !== "shadow"
        );
        setTypes(validTypes);
      } catch (err) {
        console.error("Error fetching types:", err);
        setError("Failed to load Pokémon types. Please refresh the page.");
      }
    };
    fetchTypes();
  }, []); // Empty dependency array means this runs once on mount

  // Fetch Pokémon by name or ID
  const fetchPokemon = async (query) => {
    setIsLoading(true);
    setError("");
    setFilteredPokemon([]); // Clear any previous filtered results
    setPokemon(null); // Clear previous single pokemon
    try {
      const response = await axios.get(
        `https://pokeapi.co/api/v2/pokemon/${query.toLowerCase()}`
      );
      setPokemon(response.data);
    } catch (err) {
      console.error("Error fetching single Pokémon:", err);
      setError("Pokémon not found. Please check the name or ID.");
    } finally {
      setIsLoading(false); // Always stop loading
    }
  };

  // Filter Pokémon by type
  const filterByType = async (type) => {
    setIsLoading(true);
    setError("");
    setPokemon(null); // Clear any previously searched single pokemon
    setFilteredPokemon([]); // Clear previous filtered results

    if (type === "") {
      // User selected the default "Select Type to Filter" option
      setIsLoading(false);
      return;
    }

    try {
      const res = await axios.get(`https://pokeapi.co/api/v2/type/${type}`);
      // Limit to a reasonable number, e.g., 20-30, as some types have hundreds
      const pokemonList = res.data.pokemon.slice(0, 24); // Limit to 24 for a nice grid on various screens

      // Fetch detailed data for each Pokémon in parallel
      const promises = pokemonList.map((p) =>
        axios.get(p.pokemon.url).then((r) => r.data)
      );
      const results = await Promise.all(promises);
      setFilteredPokemon(results);
    } catch (err) {
      console.error("Error fetching Pokémon by type:", err);
      setError("Error fetching Pokémon by type. Please try again.");
      setFilteredPokemon([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-8 px-4 sm:px-6 lg:px-8">
      <h1 className="text-5xl font-extrabold text-gray-900 mb-8 tracking-tight">
        Pokédex
      </h1>

      <div className="w-full max-w-4xl flex flex-col md:flex-row items-center justify-center gap-6 mb-12">
        <SearchBar onSearch={fetchPokemon} />
        <FilterType types={types} onFilter={filterByType} />
      </div>

      {isLoading && (
        <p className="text-blue-600 text-lg mt-8 font-medium">
          Loading Pokémon data...
        </p>
      )}
      {error && (
        <p className="text-red-600 text-lg mt-8 font-medium">{error}</p>
      )}
      {filteredPokemon.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-8 w-full max-w-screen-xl">
          {filteredPokemon.map((p) => (
            <PokemonCard key={p.id} pokemon={p} />
          ))}
        </div>
      ) : pokemon ? (
        <div className="mt-8">
          <PokemonCard pokemon={pokemon} />
        </div>
      ) : (
        !isLoading &&
        !error && (
          <p className="mt-8 text-gray-500 text-lg">
            Search for a Pokémon by name or ID, or filter by type!
          </p>
        )
      )}
    </div>
  );
}

export default App;
