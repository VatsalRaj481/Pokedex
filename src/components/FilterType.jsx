import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

// Helper to map generation ID to region name for display
const getGenerationRegionName = (genId) => {
  switch (genId) {
    case 1: return "Kanto";
    case 2: return "Johto";
    case 3: return "Hoenn";
    case 4: return "Sinnoh";
    case 5: return "Unova";
    case 6: return "Kalos";
    case 7: return "Alola";
    case 8: return "Galar";
    case 9: return "Paldea";
    default: return "";
  }
};

function FilterType({ types, generations, regions, onSearchAndFilter, isLoading, compact = false }) {
  const [nameQuery, setNameQuery] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedGeneration, setSelectedGeneration] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [popoverCoords, setPopoverCoords] = useState(null);

  const popoverRef = useRef(null);
  const filtersButtonRef = useRef(null);

  const updatePopoverPosition = useCallback(() => {
    if (!filtersButtonRef.current) return;
    const rect = filtersButtonRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const isMobile = vw < 640;

    if (isMobile) {
      setPopoverCoords({
        top: `${rect.bottom + 8}px`,
        left: "12px",
        right: "12px",
        width: "auto",
        maxWidth: "calc(100vw - 24px)",
      });
    } else {
      const popoverWidth = 320;
      const rightAlignedLeft = rect.right - popoverWidth;
      const clampedLeft = Math.max(16, Math.min(rightAlignedLeft, vw - popoverWidth - 16));
      setPopoverCoords({
        top: `${rect.bottom + 8}px`,
        left: `${clampedLeft}px`,
        right: "auto",
        width: `${popoverWidth}px`,
        maxWidth: `${popoverWidth}px`,
      });
    }
  }, []);

  const categoryOptions = [
    { value: "", label: "All Form Tags" },
    { value: "mega", label: "Mega Evolution" },
    { value: "gmax", label: "Gigantamax" },
    { value: "alola", label: "Alolan Form" },
    { value: "galar", label: "Galarian Form" },
    { value: "hisui", label: "Hisuian Form" },
    { value: "paldea", label: "Paldean Form" },
    { value: "special", label: "Special Form" },
  ];

  // Count of active filters for the badge
  const activeFilterCount = [selectedType, selectedRegion, selectedGeneration, selectedCategory].filter(Boolean).length;

  // Recalculate position on resize or scroll when open
  useEffect(() => {
    if (!isPopoverOpen) return;
    updatePopoverPosition();
    const handleScrollOrResize = () => updatePopoverPosition();
    window.addEventListener("resize", handleScrollOrResize);
    window.addEventListener("scroll", handleScrollOrResize, true);
    return () => {
      window.removeEventListener("resize", handleScrollOrResize);
      window.removeEventListener("scroll", handleScrollOrResize, true);
    };
  }, [isPopoverOpen, updatePopoverPosition]);

  // Close popover on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isPopoverOpen) {
        setIsPopoverOpen(false);
        filtersButtonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isPopoverOpen]);

  // Close popover on click/tap outside
  useEffect(() => {
    const handlePointerDown = (e) => {
      if (
        isPopoverOpen &&
        popoverRef.current &&
        !popoverRef.current.contains(e.target) &&
        filtersButtonRef.current &&
        !filtersButtonRef.current.contains(e.target)
      ) {
        setIsPopoverOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [isPopoverOpen]);

  // Focus trap inside the popover
  const handlePopoverKeyDown = (e) => {
    if (e.key !== "Tab") return;

    const focusableEls = popoverRef.current?.querySelectorAll(
      'select, button, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusableEls || focusableEls.length === 0) return;

    const firstEl = focusableEls[0];
    const lastEl = focusableEls[focusableEls.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      }
    } else {
      if (document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    }
  };

  // Handles form submission to trigger search/filter
  const handleSubmit = (e) => {
    e.preventDefault();
    onSearchAndFilter(nameQuery, selectedType, selectedRegion, selectedGeneration, selectedCategory);
    setIsPopoverOpen(false);
  };

  const handleClearAll = () => {
    setSelectedType("");
    setSelectedRegion("");
    setSelectedGeneration("");
    setSelectedCategory("");
  };

  const selectClasses =
    "w-full px-4 py-2.5 bg-theme-input border-2 border-theme hover:border-theme-accent rounded-xl text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-accent focus:border-transparent font-display capitalize cursor-pointer transition-all duration-200";

  const labelClasses =
    "block text-xs font-display font-semibold text-theme-secondary uppercase tracking-wide mb-1.5";

  return (
    <form
      onSubmit={handleSubmit}
      className={
        compact
          ? "flex flex-row items-center gap-1.5 sm:gap-2 w-full relative overflow-visible"
          : "flex flex-row items-center gap-2 sm:gap-3 w-full bg-theme-surface border border-theme p-2.5 sm:p-5 rounded-2xl sm:rounded-3xl shadow-lg relative overflow-visible"
      }
    >
      {/* Search Input */}
      <div className="flex-1 relative min-w-0">
        <input
          type="text"
          placeholder="Search by name or number..."
          value={nameQuery}
          onChange={(e) => setNameQuery(e.target.value)}
          className={
            compact
              ? "w-full pl-8 sm:pl-9 pr-3 py-2 bg-theme-input border border-theme hover:border-theme-accent rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent focus:border-transparent text-theme-primary placeholder-slate-400 font-display text-xs sm:text-sm transition-all duration-200"
              : "w-full pl-9 sm:pl-11 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-theme-input border-2 border-theme hover:border-theme-accent rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-theme-accent focus:border-transparent text-theme-primary placeholder-slate-400 font-display text-sm sm:text-base transition-all duration-200"
          }
          aria-label="Search or filter Pokémon by name or ID"
          disabled={isLoading}
        />
        <div className={`absolute top-1/2 -translate-y-1/2 text-theme-secondary pointer-events-none ${compact ? "left-2.5" : "left-3 sm:left-3.5"}`}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className={compact ? "w-4 h-4" : "w-4 h-4 sm:w-5 sm:h-5"}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.637 10.637z"
            />
          </svg>
        </div>
      </div>

      {/* Filters Button + Popover */}
      <div className="relative flex-shrink-0">
        <motion.button
          ref={filtersButtonRef}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          type="button"
          onClick={() => {
            if (!isPopoverOpen) {
              updatePopoverPosition();
            }
            setIsPopoverOpen((prev) => !prev);
          }}
          className={
            compact
              ? "flex items-center gap-1.5 px-2.5 sm:px-3 py-2 bg-theme-surface-hover border border-theme text-theme-primary rounded-xl font-display font-semibold text-xs sm:text-sm cursor-pointer transition-all duration-200 hover:border-theme-accent focus:outline-none focus:ring-2 focus:ring-theme-accent min-h-[36px]"
              : "flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-theme-surface-hover border border-theme text-theme-primary rounded-xl sm:rounded-2xl font-display font-semibold text-xs sm:text-sm cursor-pointer transition-all duration-200 hover:border-theme-accent focus:outline-none focus:ring-2 focus:ring-theme-accent min-h-[42px]"
          }
          aria-label="Toggle filter options"
          aria-expanded={isPopoverOpen}
          aria-haspopup="dialog"
          disabled={isLoading}
        >
          {/* Funnel icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-4 h-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z"
            />
          </svg>
          <span className="font-display hidden sm:inline">Filters</span>
          {activeFilterCount > 0 && (
            <span className="flex items-center justify-center min-w-[18px] h-4.5 px-1 text-[10px] sm:text-[11px] font-bold text-white bg-theme-accent rounded-full font-display leading-none">
              {activeFilterCount}
            </span>
          )}
        </motion.button>

        {/* Popover Panel (Portaled to body to guarantee perfect viewport-aligned positioning) */}
        {typeof document !== "undefined" &&
          createPortal(
            <AnimatePresence>
              {isPopoverOpen && (
                <motion.div
                  ref={popoverRef}
                  role="dialog"
                  aria-label="Filter options"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  onKeyDown={handlePopoverKeyDown}
                  style={popoverCoords || {}}
                  className="fixed bg-theme-surface border border-theme rounded-2xl shadow-2xl p-4 z-[9999] max-h-[calc(100vh-5rem)] overflow-y-auto"
                >
                  <div className="flex flex-col gap-3 sm:gap-4">
                    {/* Type Select */}
                    <div>
                      <label htmlFor="filter-type" className={labelClasses}>
                        Type
                      </label>
                      <select
                        id="filter-type"
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className={selectClasses}
                        aria-label="Filter by Pokémon type"
                        disabled={isLoading}
                      >
                        <option value="" className="bg-theme-input text-theme-secondary">
                          All Types
                        </option>
                        {Array.isArray(types) &&
                          types.map((t) => (
                            <option
                              key={t.name}
                              value={t.name}
                              className="bg-theme-input text-theme-primary capitalize"
                            >
                              {t.name.charAt(0).toUpperCase() + t.name.slice(1)}
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* Form Tag / Special Category Select */}
                    <div>
                      <label htmlFor="filter-category" className={labelClasses}>
                        Form Tag / Category
                      </label>
                      <select
                        id="filter-category"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className={selectClasses}
                        aria-label="Filter by form tag or category"
                        disabled={isLoading}
                      >
                        {categoryOptions.map((opt) => (
                          <option
                            key={opt.value}
                            value={opt.value}
                            className="bg-theme-input text-theme-primary"
                          >
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Region Select */}
                    <div>
                      <label htmlFor="filter-region" className={labelClasses}>
                        Region
                      </label>
                      <select
                        id="filter-region"
                        value={selectedRegion}
                        onChange={(e) => setSelectedRegion(e.target.value)}
                        className={selectClasses}
                        aria-label="Filter by native region"
                        disabled={isLoading}
                      >
                        <option value="" className="bg-theme-input text-theme-secondary">
                          All Regions
                        </option>
                        {Array.isArray(regions) &&
                          regions.map((region) => (
                            <option
                              key={region}
                              value={region.toLowerCase()}
                              className="bg-theme-input text-theme-primary capitalize"
                            >
                              {region.charAt(0).toUpperCase() + region.slice(1)}
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* Generation Select */}
                    <div>
                      <label htmlFor="filter-generation" className={labelClasses}>
                        Generation
                      </label>
                      <select
                        id="filter-generation"
                        value={selectedGeneration}
                        onChange={(e) => setSelectedGeneration(e.target.value)}
                        className={selectClasses}
                        aria-label="Filter by Pokémon generation"
                        disabled={isLoading}
                      >
                        <option value="" className="bg-theme-input text-theme-secondary">
                          All Generations
                        </option>
                        {Array.isArray(generations) &&
                          generations.map((gen) => (
                            <option
                              key={gen.id}
                              value={gen.id}
                              className="bg-theme-input text-theme-primary capitalize"
                            >
                              {`Gen ${gen.name.split("-")[1].toUpperCase()} (${getGenerationRegionName(gen.id)})`}
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* Action Buttons: Clear All & Apply */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleClearAll}
                        disabled={activeFilterCount === 0}
                        className="flex-1 py-2 text-xs sm:text-sm font-display font-semibold text-theme-accent hover:text-theme-primary bg-transparent border border-theme hover:border-theme-accent rounded-xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus:ring-2 focus:ring-theme-accent"
                        aria-label="Clear all filters"
                      >
                        Clear All
                      </button>
                      <button
                        type="button"
                        onClick={handleSubmit}
                        className="flex-1 py-2 text-xs sm:text-sm font-display font-bold text-white bg-theme-accent hover:opacity-90 rounded-xl transition-all duration-200 cursor-pointer shadow-sm focus:outline-none focus:ring-2 focus:ring-theme-accent"
                        aria-label="Apply filters"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>,
            document.body
          )}
      </div>

      {/* Search Submit Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        type="submit"
        className={
          compact
            ? "flex-shrink-0 px-3 sm:px-4 py-2 bg-theme-accent hover:opacity-90 disabled:bg-theme-surface-hover disabled:text-theme-secondary text-white rounded-xl font-bold font-display text-xs sm:text-sm shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-theme-accent flex items-center justify-center gap-1.5 cursor-pointer min-h-[36px]"
            : "flex-shrink-0 px-3.5 sm:px-5 py-2.5 sm:py-3 w-auto md:w-36 bg-theme-accent hover:opacity-90 disabled:bg-theme-surface-hover disabled:text-theme-secondary text-white rounded-xl sm:rounded-2xl font-bold font-display text-xs sm:text-sm shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-theme-accent flex items-center justify-center gap-2 cursor-pointer min-h-[42px]"
        }
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="font-display hidden sm:inline">Analyzing...</span>
          </>
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              className="w-4 h-4 sm:w-4.5 sm:h-4.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.637 10.637z" />
            </svg>
            <span className="font-display hidden sm:inline">Search</span>
          </>
        )}
      </motion.button>
    </form>
  );
}

export default FilterType;
