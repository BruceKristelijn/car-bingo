export const LANGUAGES = ['nl', 'en']

// Inline SVGs instead of flag emoji: Windows' system emoji font has no flag
// glyphs, so browsers there fall back to showing raw two-letter codes.
export const FLAG_SVG = {
  en: `<svg viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect width="60" height="30" fill="#012169"/>
    <path d="M0,0 L60,30 M60,0 L0,30" stroke="#FFFFFF" stroke-width="6"/>
    <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" stroke-width="2.4"/>
    <path d="M30,0 V30 M0,15 H60" stroke="#FFFFFF" stroke-width="10"/>
    <path d="M30,0 V30 M0,15 H60" stroke="#C8102E" stroke-width="6"/>
  </svg>`,
  nl: `<svg viewBox="0 0 9 6" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect y="0" width="9" height="2" fill="#AE1C28"/>
    <rect y="2" width="9" height="2" fill="#FFFFFF"/>
    <rect y="4" width="9" height="2" fill="#21468B"/>
  </svg>`,
}

export const UI_STRINGS = {
  en: {
    langName: 'English',
    markedOf: 'marked',
    line: 'line',
    lines: 'lines',
    newCard: 'New Card',
    bingo: 'BINGO!',
    fullCard: 'FULL CARD!',
    confirmTitle: 'Start a new card?',
    confirmBody: (n) => `You have ${n} squares marked. This will clear your progress.`,
    cancel: 'Cancel',
  },
  nl: {
    langName: 'Nederlands',
    markedOf: 'aangevinkt',
    line: 'lijn',
    lines: 'lijnen',
    newCard: 'Nieuwe kaart',
    bingo: 'BINGO!',
    fullCard: 'VOLLE KAART!',
    confirmTitle: 'Nieuwe kaart starten?',
    confirmBody: (n) => `Je hebt ${n} vakjes aangevinkt. Dit wist je voortgang.`,
    cancel: 'Annuleren',
  },
}

export function detectLanguage() {
  const candidates = navigator.languages && navigator.languages.length
    ? navigator.languages
    : [navigator.language]
  for (const locale of candidates) {
    if (locale && locale.toLowerCase().startsWith('nl')) return 'nl'
  }
  return 'en'
}
