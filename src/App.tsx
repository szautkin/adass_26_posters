import { BrowserRouter, Route, Routes } from "react-router"
import { BrowsePage } from "./components/browse-page.tsx"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<BrowsePage />} />
        <Route path="/p/:code" element={<BrowsePage />} />
      </Routes>
    </BrowserRouter>
  )
}
