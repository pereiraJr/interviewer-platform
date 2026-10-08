import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { JobDetail } from './pages/JobDetail';
import { JobsDashboard } from './pages/JobsDashboard';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<JobsDashboard />} />
        <Route path="/jobs/:id" element={<JobDetail />} />
      </Routes>
    </BrowserRouter>
  );
}
