# Pokedex

A React-based Pokedex web app with search, type filtering, generation filtering, and an AI-powered camera scanner for identifying Pokemon from an image.

## Features

- Search Pokemon by name
- Filter Pokemon by type
- Filter Pokemon by generation and region
- View Pokemon cards with detailed descriptions
- Scan a Pokemon using your device camera and Gemini image recognition
- Responsive UI built with Tailwind CSS

## Tech Stack

- React
- Create React App
- Tailwind CSS
- Axios
- React Toastify
- PokeAPI
- Gemini API
- Firebase Hosting

## Environment Variables

Create a `.env` file in the project root with:

```env
REACT_APP_API_KEY=your_gemini_api_key
```

This key is used by the Pokemon scanner feature.

## Run Locally

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm start
```

Create a production build:

```bash
npm run build
```

## Deploy To Firebase Hosting

This repo is already prepared for Firebase Hosting with `firebase.json`.

1. Install the Firebase CLI globally if you do not already have it:

```bash
npm install -g firebase-tools
```

2. Log in to Firebase:

```bash
firebase login
```

3. Create a Firebase project in the Firebase Console, then replace the placeholder project id in `.firebaserc`.

4. Deploy:

```bash
npm run deploy
```

The deploy command will automatically build the app first because `predeploy` runs `npm run build`.

## Firebase Notes

- Firebase Hosting is configured to serve the `build` folder
- SPA rewrites are enabled, so all routes fall back to `index.html`
- Static assets are cached aggressively, while `index.html` is not

## Project Structure

```text
src/
  components/
  App.js
  index.js
  index.css
public/
build/
firebase.json
.firebaserc
```

## Data Sources

- Pokemon data: [PokeAPI](https://pokeapi.co/)
- Image-based identification: Gemini API
