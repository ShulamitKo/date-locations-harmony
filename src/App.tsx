import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Analytics } from '@vercel/analytics/react';
import HomePage from "./pages/HomePage";
import SpotDetails from "./pages/SpotDetails";
import Admin from "./pages/Admin";
import AddSpot from "./pages/AddSpot";
import Footer from '@/components/Footer'
import AdminReports from "./pages/AdminReports";
import { useState, useEffect } from "react";
import { adminTable } from "@/lib/supabase/config";

// קומפוננטת הגנה
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const hasAccess = await adminTable.checkAccess();
        setIsAuthorized(hasAccess);
      } catch (error) {
        console.error('Error checking access:', error);
        setIsAuthorized(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, []);

  if (isChecking) return null;
  return isAuthorized ? <>{children}</> : <Navigate to="/" replace />;
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/spot/:id" element={<SpotDetails />} />
          <Route path="/add" element={<AddSpot />} />
          <Route path="/admin" element={<Admin />} />
          <Route 
            path="/admin/reports" 
            element={
              <ProtectedRoute>
                <AdminReports />
              </ProtectedRoute>
            } 
          />
        </Routes>
        <Footer />
      </BrowserRouter>
      <Analytics />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;