
import { BrowserRouter, Routes, Route } from "react-router-dom";

import MainLayout from "../components/layout/MainLayout";

import DashboardMain from "../pages/DashboardMain";
import Dashboard from "../pages/Dashboard";
import Prediction from "../pages/Prediction";
import DashboardMap from "../pages/DashboardMap";
import DashboardApiRun from "../pages/DashboardApiRun";
import Climate from "../pages/Climate";
import Agriculture from "../pages/Agriculture";
import Map from "../pages/Map";
import Forecasts from "../pages/Forecasts";
import Alerts from "../pages/Alerts";
import Stations from "../pages/Stations";
import Analytics from "../pages/Analytics";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Layout commun */}
        <Route path="/" element={<MainLayout />}>
          {/* Page d'accueil */}
          <Route index element={<DashboardMain />} />

          {/* Tableaux de bord */}
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="supervision" element={<DashboardApiRun />} />

          {/* Prévisions et climat */}
          <Route path="prediction" element={<Prediction />} />
          <Route path="climate" element={<Climate />} />
          <Route path="agriculture" element={<Agriculture />} />
          <Route path="forecasts" element={<Forecasts />} />
          <Route path="alerts" element={<Alerts />} />

          {/* Cartographie */}
          <Route path="cartographie" element={<DashboardMap />} />
          <Route path="map" element={<Map />} />

          {/* Stations et analyses */}
          <Route path="stations" element={<Stations />} />
          <Route path="analytics" element={<Analytics />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
