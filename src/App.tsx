import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import Home from './pages/Home';
import ConsolidatePage from './pages/Consolidate';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/consolidate" element={<ConsolidatePage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
