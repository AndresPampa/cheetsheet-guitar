import './Credits.css'

const REPO_URL = 'https://github.com/AndresPampa/cheetsheet-guitar'
const INSTAGRAM_URL = 'https://www.instagram.com/andrespampa/'

// GitHub mark from Simple Icons (CC0). Inline, not an <img>: the CSP only allows same-origin
// images, and `currentColor` follows the theme.
function GitHubIcon() {
  return (
    <svg className="credits-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
      />
    </svg>
  )
}

// The Instagram glyph drawn from primitives: rounded square, lens and flash.
function InstagramIcon() {
  return (
    <svg className="credits-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect
        x="2.5"
        y="2.5"
        width="19"
        height="19"
        rx="5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="12" cy="12" r="4.25" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.5" cy="6.5" r="1.25" fill="currentColor" />
    </svg>
  )
}

/**
 * Closing credits: author, source code and Instagram. Always in English whatever the app
 * language, so the footer declares its own `lang` for screen readers.
 */
export function Credits() {
  return (
    <footer className="credits" lang="en">
      <span>Made by Andrés Pampa</span>
      <a
        href={REPO_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Code on GitHub (opens in a new tab)"
      >
        <GitHubIcon />
        Code on GitHub
      </a>
      <a
        href={INSTAGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Instagram @andrespampa (opens in a new tab)"
      >
        <InstagramIcon />
        @andrespampa
      </a>
    </footer>
  )
}
