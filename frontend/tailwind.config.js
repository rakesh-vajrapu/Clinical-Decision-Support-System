/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['Poppins', 'sans-serif'],
                'google-sans': ['"Google Sans"', 'sans-serif'],
                'josefin-sans': ['"Josefin Sans"', 'sans-serif'],
            },
            colors: {
                brand: {
                    dark: '#0B0F19',
                    card: 'rgba(22, 30, 45, 0.7)',
                    accent: '#00D4FF',
                    accentHover: '#00E5FF',
                    error: '#EF4444',
                    success: '#10B981',
                    gradientStart: '#00D4FF',
                    gradientEnd: '#FF0080',
                },
            },
            animation: {
                'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
                'pulse-border': 'pulseBorder 3s infinite',
                'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'float': 'float 3s ease-in-out infinite',
                'spin-slow': 'spin 8s linear infinite',
                'shimmer-fast': 'shimmer 2s linear infinite',
            },
            keyframes: {
                fadeInUp: {
                    '0%': { opacity: 0, transform: 'translateY(30px)' },
                    '100%': { opacity: 1, transform: 'translateY(0)' },
                },
                pulseBorder: {
                    '0%, 100%': { borderColor: 'rgba(0, 212, 255, 0.2)', boxShadow: '0 0 0 0 rgba(0, 212, 255, 0)' },
                    '50%': { borderColor: 'rgba(0, 212, 255, 0.8)', boxShadow: '0 0 20px 0 rgba(0, 212, 255, 0.3)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-8px)' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
            }
        },
    },
    plugins: [],
}
