import { HashRouter, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Chores from "./pages/Chores";
import Bills from "./pages/Bills";
import Renovations from "./pages/Renovations";
import Financials from "./pages/Financials";
import Admin from "./pages/Admin";

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="chores" element={<Chores />} />
          <Route path="bills" element={<Bills />} />
          <Route path="renovations" element={<Renovations />} />
          <Route path="financials" element={<Financials />} />
          <Route path="admin" element={<Admin />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
