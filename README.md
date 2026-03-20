# Pokedex

A React-based Pokedex web app with search, type filtering, generation filtering, and an AI-powered camera scanner. The frontend is hosted on Firebase Hosting, while the image scan backend runs on Render with the Gemini API key kept server-side.

## Features

- Search Pokemon by name
- Filter Pokemon by type
- Filter Pokemon by generation and region
- View Pokemon details and descriptions
- Scan a Pokemon image using the device camera
- Use a protected backend so the Gemini API key is not exposed in the browser
- Apply scan cooldowns to reduce repeated requests and quota issues

## Tech Stack

- React
- Create React App
- Tailwind CSS
- Axios
- React Toastify
- PokeAPI
- Express
- Render
- Firebase Hosting
- Gemini API

## Architecture

- Frontend: React app deployed on Firebase Hosting
- Backend: Express server in `backend/` deployed on Render
- Pokemon data: PokeAPI
- Image recognition: Gemini API through the backend only

## Environment Variables

Frontend `.env` in the project root:

```env
REACT_APP_SCAN_API_URL=https://your-render-service.onrender.com/scan
```

Backend environment variable on Render:

```env
GEMINI_API_KEY=your_gemini_api_key
```

Do not store the Gemini API key in the frontend.

## Run Frontend Locally

Install frontend dependencies:

```bash
npm install
```

Start the React app:

```bash
npm start
```

Create a production build:

```bash
npm run build
```

## Run Backend Locally

Install backend dependencies:

```bash
cd backend
npm install
```

Set the backend environment variable:

```env
GEMINI_API_KEY=your_gemini_api_key
```

Start the backend:

```bash
npm start
```

The backend runs on:

```text
http://localhost:5000
```

Health check:

```text
http://localhost:5000/health
```

## Deploy Backend To Render

Create a new Render Web Service with these settings:

- Root Directory: `backend`
- Environment: `Node`
- Build Command: `npm install`
- Start Command: `npm start`

Add this environment variable in Render:

```env
GEMINI_API_KEY=your_gemini_api_key
```

After deployment, copy your Render backend URL and use it in the frontend `.env` as `REACT_APP_SCAN_API_URL`.

## Deploy Frontend To Firebase Hosting

Install the Firebase CLI if needed:

```bash
npm install -g firebase-tools
```

Log in:

```bash
firebase login
```

Build and deploy:

```bash
npm run build
firebase deploy
```

## Rate Limiting

- The backend allows only one scan request every 8 seconds globally
- If the limit is hit, the backend returns HTTP `429`
- The frontend also applies a cooldown to reduce duplicate scans

## Project Structure

```text
src/
  components/
  App.js
  index.js
  index.css
backend/
  server.js
  package.json
public/
build/
firebase.json
.firebaserc
```

## Data Sources

- Pokemon data: [PokeAPI](https://pokeapi.co/)
- Image recognition: Gemini API
