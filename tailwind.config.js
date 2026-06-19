/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'selector', // Activa la estrategia por clase
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {},
    },
    plugins: [],
}