import type { ReactNode } from "react"
import { Moon, Sun } from "@phosphor-icons/react"
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
          <NavLink to="/" className="wordmark" end>
            Satzklar
          </NavLink>
          <button
            type="button"
            className="button button-quiet theme-toggle"
            aria-pressed={theme === "dark"}
            aria-label={theme === "dark" ? "Darstellung ist dunkel, auf hell wechseln" : "Darstellung ist hell, auf dunkel wechseln"}
            onClick={() => setTheme(next)}
          >
            {theme === "dark" ? <Moon size={20} weight="regular" aria-hidden="true" /> : <Sun size={20} weight="regular" aria-hidden="true" />}
            {theme === "dark" ? "Dunkel" : "Hell"}
          </button>
          <nav className="header-nav" aria-label="Hauptnavigation">
            <NavLink to={{ pathname: "/", hash: "rechner" }} end>
              Rechner
            </NavLink>
            {studio ? (
              <>
                <NavLink to="/studio" end>
                  Übersicht
                </NavLink>
                <NavLink to="/studio/kunden">Kunden</NavLink>
                <NavLink to="/studio/einstellungen">Einstellungen</NavLink>
              </>
            ) : (
              <NavLink to="/studio">Studio</NavLink>
            )}
            <NavLink to="/preise">Preis</NavLink>
          </nav>
        </div>
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
