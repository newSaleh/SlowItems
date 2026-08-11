import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import SuppliersInventoryPage from './pages/SuppliersInventoryPage.jsx'

// import.meta.env.BASE_URL يطابق إعداد base في vite.config.js:
// "/" أثناء التطوير، و"/SlowItems/" عند البناء لنشره على GitHub Pages
const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

export default function App() {
  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/suppliers-inventory" replace />} />
          <Route path="/suppliers-inventory" element={<SuppliersInventoryPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
