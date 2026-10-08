import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppHeader } from './components/AppHeader';
import { JobDetail } from './pages/JobDetail';
import { JobsDashboard } from './pages/JobsDashboard';

export function App() {
  return (
    <BrowserRouter>
      <AppHeader />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<JobsDashboard />} />
          <Route path="/jobs/:id" element={<JobDetail />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
