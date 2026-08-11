import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import SuppliersInventoryPage from './pages/SuppliersInventoryPage.jsx'

// GitHub Pages لا يدعم إعادة توجيه المسارات من جهة الخادم، فتحديث الصفحة على
// مسار فرعي (مثل /suppliers-inventory) كان يُرجع خطأ 404. HashRouter يضع المسار
// بعد # في الرابط، وهو جزء لا يُرسَل للخادم أبدًا، فلا يحدث الخطأ عند التحديث.
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/suppliers-inventory" replace />} />
          <Route path="/suppliers-inventory" element={<SuppliersInventoryPage />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
