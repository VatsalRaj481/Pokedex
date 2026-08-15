import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";

// Defines brand-accurate flat type colors with subtle 1px border for definition (no gradients, no glossy highlights)
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

// Stat configurations with Game-specific colors
const statMeta = {
  hp: { label: "HP", color: "bg-red-500", max: 255 },
  attack: { label: "ATK", color: "bg-orange-500", max: 190 },
  defense: { label: "DEF", color: "bg-yellow-500", max: 230 },
  "special-attack": { label: "SPA", color: "bg-blue-500", max: 194 },
  "special-defense": { label: "SPD", color: "bg-green-500", max: 230 },
  speed: { label: "SPE", color: "bg-pink-500", max: 180 },
};

// Global in-memory caches to prevent PokeAPI redundant calls
const abilityCache = {};
const typeRelationsCache = {};

function PokemonCard({
  pokemon,
  layout = "vertical",
  pokemonToRegionMap = {},
  description = "",
  onToggleCompare,
  isCompared = false,
}) {
  const [abilityDetails, setAbilityDetails] = useState({});
  const [expandedAbility, setExpandedAbility] = useState(null);
  const [loadingAbilityName, setLoadingAbilityName] = useState(null);
  const [typeEffectiveness, setTypeEffectiveness] = useState({
    weak: [],
    resistant: [],
    immune: [],
  });
  const [loadingEffects, setLoadingEffects] = useState(false);

  const mainType = pokemon?.types?.[0]?.type?.name || "normal";

  // Determine form badge info
  const getFormBadge = () => {
    if (!pokemon) return null;
    const name = pokemon.name.toLowerCase();
    if (name.includes("-mega")) return "Mega Evolution";
    if (name.includes("-alola")) return "Alolan Form";
    if (name.includes("-galar")) return "Galarian Form";
    if (name.includes("-hisui")) return "Hisuian Form";
    if (name.includes("-paldea")) return "Paldean Form";
    if (name.includes("-gmax")) return "Gigantamax";
    if (!pokemon.is_default && !name.includes("-mega") && !name.includes("-gmax")) return "Special Form";
    return null;
  };

  const formBadge = getFormBadge();

  // Load type effectiveness on layout=horizontal
  useEffect(() => {
    if (!pokemon || layout !== "horizontal") return;

    const fetchMatchups = async () => {
      setLoadingEffects(true);
      try {
        // Fetch type details for compound matchups
        const typePromises = pokemon.types.map(async (t) => {
          const typeName = t.type.name;
          if (typeRelationsCache[typeName]) {
            return typeRelationsCache[typeName];
          } else {
            const res = await axios.get(`https://pokeapi.co/api/v2/type/${typeName}`);
            typeRelationsCache[typeName] = res.data;
            return res.data;
          }
        });

        const typeDetails = await Promise.all(typePromises);

        // Calculate combined multipliers
        const typeNames = Object.keys(typeColors);
        const multipliers = {};
        typeNames.forEach((t) => (multipliers[t] = 1));

        typeDetails.forEach((details) => {
          const rels = details.damage_relations;
          rels.double_damage_from.forEach((t) => {
            if (multipliers[t.name] !== undefined) multipliers[t.name] *= 2;
          });
          rels.half_damage_from.forEach((t) => {
            if (multipliers[t.name] !== undefined) multipliers[t.name] *= 0.5;
          });
          rels.no_damage_from.forEach((t) => {
            if (multipliers[t.name] !== undefined) multipliers[t.name] *= 0;
          });
        });

        const weak = [];
        const resistant = [];
        const immune = [];

        Object.keys(multipliers).forEach((tName) => {
          const mult = multipliers[tName];
          if (mult > 1) {
            weak.push({ name: tName, multiplier: mult });
          } else if (mult === 0) {
            immune.push({ name: tName, multiplier: 0 });
          } else if (mult < 1) {
            resistant.push({ name: tName, multiplier: mult });
          }
        });

        setTypeEffectiveness({ weak, resistant, immune });
      } catch (error) {
        console.error("Error loading card matchups details:", error);
      } finally {
        setLoadingEffects(false);
      }
    };

    fetchMatchups();
  }, [pokemon, layout]);

  // Handles smooth collapsible on-demand ability description fetching
  const handleAbilityClick = async (abName, abUrl) => {
    const isExpanded = expandedAbility === abName;
    if (isExpanded) {
      setExpandedAbility(null);
      return;
    }

    setExpandedAbility(abName);

    // If already in component state or global cache, do nothing
    if (abilityDetails[abName]) {
      return;
    }
    if (abilityCache[abName]) {
      setAbilityDetails((prev) => ({
        ...prev,
        [abName]: abilityCache[abName],
      }));
      return;
    }

    setLoadingAbilityName(abName);
    try {
      const secureUrl = abUrl.replace(/^http:/, "https:");
      const res = await axios.get(secureUrl);
      const englishEntry = res.data.effect_entries.find(
        (eff) => eff.language.name === "en"
      );
      const effectText = englishEntry
        ? englishEntry.short_effect
        : "No details available in database.";

      abilityCache[abName] = effectText;
      setAbilityDetails((prev) => ({
        ...prev,
        [abName]: effectText,
      }));
    } catch (err) {
      console.error("Failed to load ability:", err);
      setAbilityDetails((prev) => ({
        ...prev,
        [abName]: "Failed to load description from the Dex servers.",
      }));
    } finally {
      setLoadingAbilityName(null);
    }
  };

  if (!pokemon) return null;

  const mainImageSrc =
    pokemon.sprites?.other?.home?.front_default ||
    pokemon.sprites?.other?.["official-artwork"]?.front_default ||
    pokemon.sprites?.front_default;

  const homeShinyImageSrc = pokemon.sprites?.other?.home?.front_shiny;
  const totalBaseStat = pokemon.stats.reduce((sum, s) => sum + s.base_stat, 0);
  const heightInMeters = (pokemon.height / 10).toFixed(1);
  const weightInKilograms = (pokemon.weight / 10).toFixed(1);
  const getBaseName = (name) => {
    let lower = name.toLowerCase();
    lower = lower.replace("-mega-x", "");
    lower = lower.replace("-mega-y", "");
    lower = lower.replace("-mega", "");
    lower = lower.replace("-gmax", "");
    lower = lower.replace("-alola", "");
    lower = lower.replace("-galar", "");
    lower = lower.replace("-hisui", "");
    lower = lower.replace("-paldea", "");
    return lower;
  };
  const baseName = getBaseName(pokemon.name);
  let pokemonRegions = pokemonToRegionMap[pokemon.name] || pokemonToRegionMap[baseName] || [];
  const nameLower = pokemon.name.toLowerCase();
  if (
    nameLower.includes("-hisui") ||
    nameLower.includes("basculegion") ||
    nameLower.includes("sneasler") ||
    nameLower.includes("dialga-origin") ||
    nameLower.includes("palkia-origin")
  ) {
    pokemonRegions = ["hisui"];
  } else if (nameLower.includes("-gmax")) {
    if (!pokemonRegions.includes("galar")) {
      pokemonRegions = [...pokemonRegions, "galar"];
    }
  }

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

  // Compact layout (vertical result cards)
  if (layout === "vertical") {
    return (
      <motion.div
        whileHover={{ y: -6, scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className={`bg-theme-surface border rounded-3xl p-6 flex flex-col items-center relative group overflow-hidden shadow-md select-none cursor-pointer h-full`}
        style={{
          borderColor: isCompared ? "var(--color-accent-red)" : "var(--color-border)",
          borderWidth: isCompared ? "3px" : "1px",
        }}
      >
        {/* Compare Checkbox */}
        {onToggleCompare && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleCompare(pokemon);
            }}
            className={`absolute top-4 right-4 z-10 p-2 rounded-full border border-theme flex items-center justify-center transition-all duration-200 hover:scale-110 ${
              isCompared
                ? "bg-theme-accent text-white border-red-500 shadow-md"
                : "bg-theme-surface-hover text-theme-secondary hover:text-theme-primary"
            }`}
            title="Toggle Comparison"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4"
            >
              <path d="M9 2a1 1 0 0 0-2 0v8H3a1 1 0 1 0 0 2h4v6a1 1 0 1 0 2 0v-6h4a1 1 0 1 0 0-2H9V2Z" />
            </svg>
          </motion.button>
        )}



        {/* Image Frame - p-2 padding and object-contain ensures the sprite renders in full without cropping */}
        <div className="relative w-full aspect-square max-w-[12rem] flex items-center justify-center bg-theme-input/40 rounded-2xl p-2 mb-4 transition-all duration-200">
          <img
            src={mainImageSrc}
            alt={pokemon.name}
            className="w-full h-full object-contain drop-shadow-md group-hover:scale-110 transition-transform duration-200"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = `https://placehold.co/256x256/1e293b/ffffff?text=No+Image`;
            }}
          />
        </div>

        {/* Name and ID */}
        <h2 className="text-xl font-display font-extrabold text-theme-primary text-center mb-1 tracking-tight flex items-center gap-1.5 justify-center flex-wrap">
          {formatPokemonName(pokemon.name)}
          <span className="text-sm font-display text-theme-accent font-bold">
            #{String(pokemon.id).padStart(3, "0")}
          </span>
          {formBadge && (
            <span className="px-1.5 py-0.5 rounded-md bg-theme-gold-bg text-theme-gold border border-theme-gold text-[8px] font-display font-bold shadow-sm uppercase">
              {formBadge}
            </span>
          )}
        </h2>

        {/* Brand Accurate Flat Types */}
        <div className="flex gap-2 mb-4 justify-center">
          {pokemon.types.map((t) => (
            <span
              key={t.type.name}
              className={`px-3 py-0.5 rounded-full text-[10px] font-display font-semibold tracking-wide border capitalize ${
                typeColors[t.type.name]
              }`}
            >
              {t.type.name}
            </span>
          ))}
        </div>

        {/* Compact Stat Bars - mt-auto ensures stats align perfectly at the bottom of uniform cards */}
        <div className="w-full border-t border-theme pt-3 flex flex-col gap-1.5 mt-auto">
          {pokemon.stats.map((s) => {
            const meta = statMeta[s.stat.name];
            if (!meta) return null;
            const pct = Math.min((s.base_stat / meta.max) * 100, 100);
            return (
              <div key={s.stat.name} className="flex items-center text-[10px] font-display">
                <span className="w-8 text-theme-secondary font-medium capitalize">{meta.label}</span>
                <span className="w-7 text-right pr-2 text-theme-primary font-bold">{s.base_stat}</span>
                <div className="flex-1 h-1.5 bg-theme-input rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${meta.color} animate-stat-grow`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    );
  }

  // Full Details Layout (horizontal layout / main selected card)
  const dexDescription = description || "No Pokédex entry recorded for this form.";

  return (
    <div className="bg-theme-surface border-4 border-theme-accent rounded-3xl p-6 sm:p-8 pt-16 sm:pt-20 flex flex-col lg:flex-row gap-8 shadow-xl relative animate-card-in overflow-hidden">
      {/* Gold Alternate Form Tag absolute-positioned on the top-left of the entire card */}
      {formBadge && (
        <span className="absolute top-6 left-6 sm:top-8 sm:left-8 z-10 px-2.5 py-1 rounded-lg bg-theme-gold-bg text-theme-gold border border-theme-gold text-[10px] font-display font-bold shadow-sm uppercase">
          {formBadge}
        </span>
      )}

      {/* Pokedex number in the top right of the card in white */}
      <div className="absolute top-6 right-6 sm:top-8 sm:right-8 text-2xl sm:text-3xl font-display font-extrabold text-white select-none opacity-90 tracking-tight z-10">
        #{String(pokemon.id).padStart(3, "0")}
      </div>
      
      {/* Subtle type indicator color wash */}
      <div
        className={`absolute -inset-[300px] opacity-5 bg-[radial-gradient(circle_at_center,rgba(var(--glow-rgb),0.5)_0%,transparent_70%)] -z-10`}
        style={{
          "--glow-rgb":
            mainType === "fire"
              ? "239, 68, 68"
              : mainType === "water"
              ? "59, 130, 246"
              : mainType === "grass"
              ? "16, 185, 129"
              : mainType === "electric"
              ? "245, 158, 11"
              : mainType === "poison"
              ? "139, 92, 246"
              : "100, 116, 139",
        }}
      />
      <div className="flex flex-col gap-8 lg:w-[40%] flex-shrink-0 self-stretch justify-between">
        <div className="flex-1 w-full bg-theme-input/20 rounded-2xl p-2 flex items-center justify-center min-h-[220px]">
          <img
            src={mainImageSrc}
            alt={pokemon.name}
            className="w-full h-full object-contain drop-shadow-md transform hover:scale-110 transition-transform duration-200"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = `https://placehold.co/512x512/1e293b/ffffff?text=No+Image`;
            }}
          />
        </div>

        {homeShinyImageSrc && (
          <div className="flex-1 w-full bg-theme-input/20 rounded-2xl p-2 flex items-center justify-center min-h-[220px] relative">
            {/* Absolute positioning for ✨ top-right, out of the way of the sprite */}
            <span className="absolute top-4 right-4 text-xl select-none" title="Shiny Form">
              ✨
            </span>

            <img
              src={homeShinyImageSrc}
              alt={`${pokemon.name} home shiny`}
              className="w-full h-full object-contain drop-shadow-md transform hover:scale-110 transition-transform duration-200"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `https://placehold.co/512x512/1e293b/ffffff?text=No+Image`;
              }}
            />
          </div>
        )}
      </div>

      {/* Info Deck */}
      <div className="flex-grow flex flex-col gap-6">
        <div>
          <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-theme-primary tracking-[-0.02em] flex items-center gap-2.5 flex-wrap">
            {formatPokemonName(pokemon.name)}
          </h2>

          {/* Brand Accurate Flat Types */}
          <div className="flex flex-wrap gap-2 mt-3.5">
            {pokemon.types.map((t) => (
              <span
                key={t.type.name}
                className={`px-4 py-1 rounded-full text-xs font-display font-semibold tracking-wider border capitalize shadow-sm ${
                  typeColors[t.type.name]
                }`}
              >
                {t.type.name}
              </span>
            ))}
          </div>
        </div>

        {/* Pokedex Description Entry */}
        <div className="bg-theme-bg border border-theme rounded-2xl p-4 relative">
          <span className="absolute -top-2.5 left-4 px-2 py-0.5 rounded bg-theme-accent text-[10px] font-display font-bold text-white border border-theme-accent shadow-sm">
            ABOUT
          </span>
          <p className="text-sm font-display text-theme-primary leading-relaxed mt-1">
            {dexDescription}
          </p>
        </div>

        {/* Region & Size Profiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-theme-bg border border-theme rounded-2xl p-4">
            <h3 className="text-xs font-display font-bold text-theme-secondary mb-2.5">BIOMETRIC SPECS</h3>
            <div className="flex flex-col gap-2 text-sm font-display">
              <div className="flex justify-between border-b border-theme pb-1.5">
                <span className="text-theme-secondary">HEIGHT</span>
                <span className="text-theme-primary font-semibold">{heightInMeters} m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-theme-secondary">WEIGHT</span>
                <span className="text-theme-primary font-semibold">{weightInKilograms} kg</span>
              </div>
            </div>
          </div>

          <div className="bg-theme-bg border border-theme rounded-2xl p-4">
            <h3 className="text-xs font-display font-bold text-theme-secondary mb-2.5">KNOWN REGIONS</h3>
            <div className="max-h-20 overflow-y-auto flex flex-wrap gap-1.5">
              {pokemonRegions.length > 0 ? (
                pokemonRegions.map((regionName) => (
                  <span
                    key={regionName}
                    className="px-2.5 py-1 bg-theme-surface text-theme-primary border border-theme text-xs font-display rounded-lg capitalize"
                  >
                    {regionName}
                  </span>
                ))
              ) : (
                <span className="text-xs font-display text-theme-secondary italic">
                  Unknown or undocumented habitat
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Animated Base Stats graph */}
        <div className="bg-theme-bg border border-theme rounded-2xl p-4 sm:p-5">
          <h3 className="text-xs font-display font-bold text-theme-secondary mb-4 flex justify-between">
            <span>BASE STAT PROFILE</span>
            <span className="text-theme-accent font-extrabold">TOTAL: {totalBaseStat}</span>
          </h3>

          <div className="flex flex-col gap-3">
            {pokemon.stats.map((s) => {
              const meta = statMeta[s.stat.name];
              if (!meta) return null;
              const pct = Math.min((s.base_stat / meta.max) * 100, 100);
              return (
                <div key={s.stat.name} className="flex flex-col sm:flex-row sm:items-center text-xs font-display gap-1 sm:gap-4">
                  <span className="w-16 text-theme-secondary font-medium capitalize">{meta.label}</span>
                  <div className="flex-1 flex items-center gap-3">
                    <div className="flex-1 h-3 bg-theme-input rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${meta.color} animate-stat-grow`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-theme-primary font-bold">{s.base_stat}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Compound Type Effectiveness Matchups */}
        <div className="bg-theme-bg border border-theme rounded-2xl p-4 sm:p-5">
          <h3 className="text-xs font-display font-bold text-theme-secondary mb-4">TACTICAL DEFENSIVE MATCHUPS</h3>
          {loadingEffects ? (
            <div className="flex items-center gap-2 text-theme-secondary text-xs font-display">
              <svg className="animate-spin h-4 w-4 text-theme-accent" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Calculating compound elements...
            </div>
          ) : (
            <div className="flex flex-col gap-4 text-xs font-display">
              {typeEffectiveness.weak.length > 0 && (
                <div>
                  <span className="text-red-500 font-bold block mb-2">WEAK TO</span>
                  <div className="flex flex-wrap gap-1.5">
                    {typeEffectiveness.weak.map((wt) => (
                      <span
                        key={wt.name}
                        className={`px-2.5 py-0.5 rounded-md text-[10px] uppercase font-bold border text-white ${typeColors[wt.name]}`}
                      >
                        {wt.name} <span className="opacity-80">({wt.multiplier}x)</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {typeEffectiveness.resistant.length > 0 && (
                <div>
                  <span className="text-green-500 font-bold block mb-2">RESISTANT TO</span>
                  <div className="flex flex-wrap gap-1.5">
                    {typeEffectiveness.resistant.map((rt) => (
                      <span
                        key={rt.name}
                        className={`px-2.5 py-0.5 rounded-md text-[10px] uppercase font-bold border text-white ${typeColors[rt.name]}`}
                      >
                        {rt.name} <span className="opacity-80">({rt.multiplier}x)</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {typeEffectiveness.immune.length > 0 && (
                <div>
                  <span className="text-blue-500 font-bold block mb-2">IMMUNE TO</span>
                  <div className="flex flex-wrap gap-1.5">
                    {typeEffectiveness.immune.map((it) => (
                      <span
                        key={it.name}
                        className={`px-2.5 py-0.5 rounded-md text-[10px] uppercase font-bold border text-white ${typeColors[it.name]}`}
                      >
                        {it.name} <span className="opacity-80">(0x)</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Collapsible Ability Accordion with smooth transitions */}
        <div className="bg-theme-bg border border-theme rounded-2xl p-4 sm:p-5">
          <h3 className="text-xs font-display font-bold text-theme-secondary mb-3">ABILITIES</h3>
          <div className="flex flex-col gap-2.5">
            {pokemon.abilities.map((a) => {
              const abName = a.ability.name;
              const isExpanded = expandedAbility === abName;
              const desc = abilityDetails[abName] || abilityCache[abName];

              return (
                <div
                  key={abName}
                  className="bg-theme-input border border-theme rounded-2xl overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => handleAbilityClick(abName, a.ability.url)}
                    className="w-full px-4 py-3 flex justify-between items-center text-left hover:bg-theme-surface-hover text-theme-primary transition-colors duration-200 focus:outline-none"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-display font-semibold text-theme-primary capitalize text-sm">
                        {abName.replace("-", " ")}
                      </span>
                      {a.is_hidden && (
                        /* Gold foil hidden ability badge */
                        <span className="px-2.5 py-0.5 rounded-md text-[8px] font-display font-bold bg-theme-gold-bg text-theme-gold border border-theme-gold shadow-sm">
                          HIDDEN ABILITY
                        </span>
                      )}
                    </div>

                    <motion.svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-5 h-5 text-theme-secondary"
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ type: "spring", stiffness: 180, damping: 20 }}
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                        clipRule="evenodd"
                      />
                    </motion.svg>
                  </button>

                  {/* Smooth height expand transition panel (framer-motion, interruptible) */}
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{
                      height: isExpanded ? "auto" : 0,
                      opacity: isExpanded ? 1 : 0,
                    }}
                    transition={{ type: "spring", stiffness: 180, damping: 22 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-3.5 text-xs font-display text-theme-secondary leading-relaxed border-t border-theme pt-2.5">
                      {loadingAbilityName === abName ? (
                        <span className="italic animate-pulse text-theme-accent">Accessing Dex data...</span>
                      ) : (
                        desc || "No description available."
                      )}
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PokemonCard;
