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
import { cleanupExpiredRateLimits } from "@/lib/rateLimit";

// קומפוננטת הגנה
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('בודק הרשאות...');
        const hasAccess = await adminTable.checkAccess();
        console.log('תוצאת בדיקת הרשאות:', hasAccess);
        setIsAuthorized(hasAccess);
      } catch (error) {
        console.error('שגיאה בבדיקת הרשאות:', error);
        setIsAuthorized(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, []);

  if (isChecking) {
    console.log('בודק...');
    return null;
  }
  
  console.log('סטטוס הרשאות:', isAuthorized);
  return isAuthorized ? <>{children}</> : <Navigate to="/" replace />;
};

const queryClient = new QueryClient();

const App = () => {
  // ניקוי אוטומטי של רשומות ישנות
  useEffect(() => {
    // ניקוי ראשוני
    cleanupExpiredRateLimits();

    // ניקוי כל שעה
    const cleanup = setInterval(() => {
      cleanupExpiredRateLimits();
    }, 60 * 60 * 1000); // שעה במילישניות

    return () => clearInterval(cleanup);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/spot/:id" element={<SpotDetails />} />
            <Route path="/add-spot" element={<AddSpot />} />
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
};

export default App;