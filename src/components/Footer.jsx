import React from "react";

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-gray-800 text-white text-center text-sm sm:text-base m-0">
      <div className="w-full">
        <p className="py-4 m-0">
          &copy; {currentYear} Pokédex App created by
          <a
            href="https://github.com/VatsalRaj481"
            className="text-blue-400 hover:text-blue-300 transition-colors underline ml-1"
          >
            Casy
          </a>
          . All rights reserved.
        </p>

        {/* <p>
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
        </p> */}
      </div>
    </footer>
  );
}

export default Footer;
