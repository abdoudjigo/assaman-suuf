import { BrowserRouter, Routes, Route } from "react-router-dom";

import Dashboard from "../pages/Dashboard";
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
                <Route path="/" element={<Dashboard />} />
                <Route path="/climate" element={<Climate />} />
                <Route path="/agriculture" element={<Agriculture />} />
                <Route path="/map" element={<Map />} />
                <Route path="/forecasts" element={<Forecasts />} />
                <Route path="/alerts" element={<Alerts />} />
                <Route path="/stations" element={<Stations />} />
                <Route path="/analytics" element={<Analytics />} />
            </Routes>
        </BrowserRouter>
    );
};

export default AppRoutes;