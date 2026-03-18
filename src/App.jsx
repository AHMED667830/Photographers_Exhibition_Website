import { Routes, Route } from "react-router-dom";
import "./index.css";

import Header from "./components/header";
import Footer from "./components/Footer";

// Components / Pages
import ScrollToTopButton from "./components/ScrollToTopButton";
import Services from "./components/Services";
import Commentcards from "./components/Commentcards";
import Corporatecards from "./components/Corporatecards";
import SiteCredit from "./components/SiteCredit";

import AboutMe from "./pages/AboutMe";
import ServiceOccasions from "./pages/ServiceOccasions";
import OccasionDetails from "./pages/OccasionDetails";

import AdminPage from "./pages/AdminPage";
import AdminLogin from "./pages/AdminLogin";
import AdminGuard from "./routes/AdminGuard";

// --------------------
// Pages
// --------------------
function Home() {
  return (
    <>
      <Services />
      <Commentcards />
      <Corporatecards />
    </>
  );
}

// --------------------
// Layouts
// --------------------
function SiteLayout({ children }) {
  return (
    <>
      <Header />
      {children}
      <Footer />
      <SiteCredit />
       <ScrollToTopButton />
    </>
  );
}

function AdminLayout({ children }) {
  return (
    <>
      <Header />
      {children}
    </>
  );
}

// --------------------
// App
// --------------------
function App() {
  return (
    <Routes>
      {/* صفحات المستخدم */}
      <Route
        path="/"
        element={
          <SiteLayout>
            <Home />
          </SiteLayout>
        }
      />

      <Route
        path="/AboutMe"
        element={
          <SiteLayout>
            <AboutMe />
          </SiteLayout>
        }
      />

      <Route
        path="/services"
        element={
          <SiteLayout>
            <Services />
          </SiteLayout>
        }
      />

      <Route
        path="/services/:serviceId"
        element={
          <SiteLayout>
            <ServiceOccasions />
          </SiteLayout>
        }
      />

      <Route
        path="/services/:serviceId/occasions/:occasionId"
        element={
          <SiteLayout>
            <OccasionDetails />
          </SiteLayout>
        }
      />

      {/* تسجيل دخول الأدمن (تقدر تخليه بدون هيدر أو مع هيدر حسب رغبتك) */}
      <Route path="/admin-login" element={<AdminLogin />} />

      {/* صفحة الأدمن: فيها هيدر ومحمية */}
      <Route
        path="/AdminPage"
        element={
          <AdminGuard>
            <AdminLayout>
              <AdminPage />
            </AdminLayout>
          </AdminGuard>
        }
      />
    </Routes>
  );
}

export default App;