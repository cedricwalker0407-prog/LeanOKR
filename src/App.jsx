import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Builder from './pages/Builder'
import Monitor from './pages/Monitor'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/builder" element={<Builder />} />
        <Route path="/monitor" element={<Monitor />} />
      </Routes>
    </BrowserRouter>
  )
}
