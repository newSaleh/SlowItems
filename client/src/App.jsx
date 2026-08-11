import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import SuppliersInventoryPage from './pages/SuppliersInventoryPage.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/suppliers-inventory" replace />} />
          <Route path="/suppliers-inventory" element={<SuppliersInventoryPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
