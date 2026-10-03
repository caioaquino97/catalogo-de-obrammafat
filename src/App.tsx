import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CatalogoPage from './pages/CatalogoPage';
import DashboardPage from './pages/DashboardPage';
import RepetidasPage from './pages/RepetidasPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CatalogoPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/repetidas" element={<RepetidasPage />} />
      </Routes>
    </BrowserRouter>
  );
}
