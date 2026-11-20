import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppProvider } from './AppContext';
import Gate from './components/Gate';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import DataClient from './pages/DataClient';
import DetailClient from './pages/DetailClient';
import Kalender from './pages/Kalender';
import Pengaturan from './pages/Pengaturan';

export default function App() {
  return (
    <Gate>
      <AppProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="client" element={<DataClient />} />
              <Route path="client/:id" element={<DetailClient />} />
              <Route path="kalender" element={<Kalender />} />
              <Route path="pengaturan" element={<Pengaturan />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </Gate>
  );
}
