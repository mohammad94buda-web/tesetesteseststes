import { Route, Routes } from "react-router-dom"
import { Clients } from "./pages/Clients"
import { Dashboard } from "./pages/Dashboard"
import { Editor } from "./pages/Editor"
import { Landing } from "./pages/Landing"
import { Pricing } from "./pages/Pricing"
import { Settings } from "./pages/Settings"

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/preise" element={<Pricing />} />
      <Route path="/studio" element={<Dashboard />} />
      <Route path="/studio/kunden" element={<Clients />} />
      <Route path="/studio/einstellungen" element={<Settings />} />
      <Route path="/studio/dokument/:id" element={<Editor />} />
    </Routes>
  )
}
