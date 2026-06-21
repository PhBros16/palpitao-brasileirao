import type { Config } from 'tailwindcss'

/**
 * tailwind.config.ts — Palpitão Brasileirão
 *
 * Expõe os tokens definidos em styles/tokens.css como classes utilitárias.
 * As cores apontam para as CSS custom properties (não hex direto) para que
 * qualquer ajuste de paleta aconteça em um único lugar: tokens.css.
 *
 * Uso esperado:
 *   bg-couro-300        → capa do álbum
 *   bg-papel-100         → fundo de figurinha
 *   text-tinta-300       → texto sobre papel
 *   border-dourado-300   → borda de raridade lendária
 *   bg-campo-noturno     → cena de abertura/login
 *   bg-madeira-200       → prateleira da sala de troféus
 *
 * Ver CLAUDE.md Seção 4 (identidade visual) e Seção 8 (estrutura de pastas).
 */

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        couro: {
          50: 'var(--couro-50)',
          100: 'var(--couro-100)',
          200: 'var(--couro-200)',
          300: 'var(--couro-300)',
          400: 'var(--couro-400)',
          500: 'var(--couro-500)',
          600: 'var(--couro-600)',
        },
        lombada: {
          100: 'var(--lombada-100)',
          200: 'var(--lombada-200)',
          300: 'var(--lombada-300)',
        },
        papel: {
          50: 'var(--papel-50)',
          100: 'var(--papel-100)',
          200: 'var(--papel-200)',
          300: 'var(--papel-300)',
          400: 'var(--papel-400)',
        },
        'papel-borda': {
          100: 'var(--papel-borda-100)',
          200: 'var(--papel-borda-200)',
          300: 'var(--papel-borda-300)',
          400: 'var(--papel-borda-400)',
        },
        tinta: {
          100: 'var(--tinta-100)',
          200: 'var(--tinta-200)',
          300: 'var(--tinta-300)',
        },
        dourado: {
          50: 'var(--dourado-50)',
          100: 'var(--dourado-100)',
          200: 'var(--dourado-200)',
          300: 'var(--dourado-300)',
          400: 'var(--dourado-400)',
          500: 'var(--dourado-500)',
          600: 'var(--dourado-600)',
          700: 'var(--dourado-700)',
          800: 'var(--dourado-800)',
        },
        campo: {
          noturno: 'var(--campo-noturno)',
          50: 'var(--campo-50)',
          100: 'var(--campo-100)',
          200: 'var(--campo-200)',
          300: 'var(--campo-300)',
        },
        'verde-badge': {
          DEFAULT: 'var(--verde-badge)',
          bg: 'var(--verde-badge-bg)',
        },
        madeira: {
          50: 'var(--madeira-50)',
          100: 'var(--madeira-100)',
          200: 'var(--madeira-200)',
          300: 'var(--madeira-300)',
          400: 'var(--madeira-400)',
        },
        parede: {
          100: 'var(--parede-100)',
          200: 'var(--parede-200)',
        },
        latao: {
          50: 'var(--latao-50)',
          100: 'var(--latao-100)',
          200: 'var(--latao-200)',
        },
        ouro: {
          50: 'var(--ouro-50)',
          100: 'var(--ouro-100)',
          200: 'var(--ouro-200)',
        },
        prata: {
          50: 'var(--prata-50)',
          100: 'var(--prata-100)',
          200: 'var(--prata-200)',
        },
        bronze: {
          50: 'var(--bronze-50)',
          100: 'var(--bronze-100)',
          200: 'var(--bronze-200)',
        },
        'trofeu-tier1': {
          50: 'var(--trofeu-tier1-50)',
          100: 'var(--trofeu-tier1-100)',
          200: 'var(--trofeu-tier1-200)',
        },
        'trofeu-tier2': {
          50: 'var(--trofeu-tier2-50)',
          100: 'var(--trofeu-tier2-100)',
          200: 'var(--trofeu-tier2-200)',
        },
        'trofeu-tier3': {
          50: 'var(--trofeu-tier3-50)',
          100: 'var(--trofeu-tier3-100)',
          200: 'var(--trofeu-tier3-200)',
        },
        'trofeu-tier4': {
          50: 'var(--trofeu-tier4-50)',
          100: 'var(--trofeu-tier4-100)',
          200: 'var(--trofeu-tier4-200)',
        },
        raridade: {
          lendaria: 'var(--raridade-lendaria)',
          'lendaria-bg': 'var(--raridade-lendaria-bg)',
          'rara-borda': 'var(--raridade-rara-borda)',
          'comum-borda': 'var(--raridade-comum-borda)',
          frango: 'var(--raridade-frango)',
          'frango-selo': 'var(--raridade-frango-selo)',
        },
      },
      fontFamily: {
        display: ['var(--font-display)'],
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
      },
    },
  },
  plugins: [],
}

export default config
