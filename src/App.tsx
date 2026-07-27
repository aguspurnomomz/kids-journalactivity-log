import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Auth } from './components/Auth';
import { ProtectedRoute } from './components/ProtectedRoute';
import { MainLayout } from './layouts/MainLayout';
import { DashboardPage } from './pages/DashboardPage';
import { ChildrenPage } from './pages/ChildrenPage';
import { InputActivityPage } from './pages/InputActivityPage';
import { AIConsultPage } from './pages/AIConsultPage';
import { RemindersPage } from './pages/RemindersPage';


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<Auth />} />

        {/* Protected Routes dengan Layout Sidebar */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/children" element={<ChildrenPage />} />
            <Route path="/input-aktivitas" element={<InputActivityPage />} />
            <Route path="/ai-konsultasi" element={<AIConsultPage />} />
            <Route path="/pengingat" element={<RemindersPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}