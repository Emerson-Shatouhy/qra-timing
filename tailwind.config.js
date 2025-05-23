module.exports = {
    theme: {
        extend: {
            animation: {
                'blink': 'blink 1.5s ease-in-out infinite',
            },
            keyframes: {
                'blink': {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.7' },
                },
            },
        },
    },
}