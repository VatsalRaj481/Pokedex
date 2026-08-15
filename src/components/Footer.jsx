import React from "react";

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-theme-surface text-theme-primary border-t border-theme py-4 mt-16 sm:mt-24 text-center text-sm sm:text-base shadow-inner">
      <div className="container mx-auto px-4">
        {" "}
        {/* Container for horizontal padding on larger screens */}
        <p className="mb-2">
          &copy; {currentYear} Pokédex App created by
          <a
            href="https://github.com/VatsalRaj481"
            target="_blank" // Opens link in a new tab
            rel="noopener noreferrer" // Security best practice for target="_blank"
            className="text-blue-400 hover:text-blue-300 transition-colors underline ml-1"
          >
            Casy
          </a>
          . All rights reserved.
        </p>
        {/*
        <p>
          Data provided by{' '}
          <a
            href="https://pokeapi.co/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 transition-colors underline"
          >
            PokeAPI
          </a>
          .
        </p>
        */}
      </div>
    </footer>
  );
}

export default Footer;
