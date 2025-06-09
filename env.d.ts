
// This file provides type definitions for Node.js environment variables
// that are made available in the client-side code through Vite's `define` feature.

declare namespace NodeJS {
  interface ProcessEnv {
    /**
     * The API key for accessing the Gemini API.
     * This is injected at build time by Vite.
     * Ensure this environment variable is set in the environment where Vite builds the project.
     */
    readonly API_KEY?: string;
  }
}
