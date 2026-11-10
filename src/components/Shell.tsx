import type { ReactNode } from "react"
import { NavLink } from "react-router-dom"
import { useStore } from "../store"

export function Shell({ children, studio = false }: { children: ReactNode; studio?: boolean }) {
  const { theme, setTheme } = useStore()
  const next = theme === "dark" ? "light" : "dark"
  return (
    <>
      <a className="skip" href="#inhalt">
        Zum Inhalt
      </a>
      <header className="site-header no-print">
        <div className="header-row">
          <NavLink to="/" className="wordmark">
            Satzklar
          </NavLink>
          <nav className="header-nav" aria-label="Hauptnavigation">
            <NavLink to={{ pathname: "/", hash: "rechner" }}>Rechner</NavLink>
            <NavLink to="/studio">Studio</NavLink>
            <NavLink to="/preise">Preis</NavLink>
          </nav>
          <button
            type="button"
            className="button button-quiet"
            aria-pressed={theme === "dark"}
            aria-label={theme === "dark" ? "Darstellung ist dunkel, auf hell wechseln" : "Darstellung ist hell, auf dunkel wechseln"}
            onClick={() => setTheme(next)}
          >
            {theme === "dark" ? "Dunkel" : "Hell"}
          </button>
        </div>
        {studio ? (
          <nav className="studio-nav" aria-label="Studio">
            <NavLink to="/studio" end>
              Übersicht
            </NavLink>
            <NavLink to="/studio/kunden">Kunden</NavLink>
            <NavLink to="/studio/einstellungen">Einstellungen</NavLink>
          </nav>
        ) : null}
      </header>
      <main id="inhalt" className={studio ? "studio-main" : "page-main"}>
        {children}
      </main>
      {studio ? null : (
        <footer className="site-footer no-print">
          <p>Satzklar. Daten bleiben in diesem Browser.</p>
        </footer>
      )}
    </>
  )
}
