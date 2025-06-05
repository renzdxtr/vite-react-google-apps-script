import Home from "./pages/Home";
import Menu from "./pages/Menu"
import ScanQR from "./pages/ScanQR";
import SeedManagementPage from "./pages/SeedManagementPage";
import MonitorInventoryPage from './pages/MonitorInventoryPage';
import Dashboard from "./pages/Dashboard";

export const routes = [
  {
    title: "Home",
    url: "/",
    component: Home,
  },
  {
    title: "Menu",
    url: "/menu",
    component: Menu,
  },
  {
    title: "Scan QR",
    url: "/scan-qr",
    component: ScanQR,
  },
  {
    title: "Seed Management",
    url: "/scan-qr/details",
    component: SeedManagementPage,
  },
  {
    title: "Monitor Inventory",
    url: "/monitor-inventory",
    component: MonitorInventoryPage,
  },
  {
    title: "Dashboard",
    url: "/dashboard",
    component: Dashboard,
  },
];
