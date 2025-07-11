import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import AuthPage from "./pages/AuthPage";
import PyNotebook from "./pages/PyNotebook";
import PythonEditor from "./pages/PythonEditor";
import VisualCoding from "./pages/VisualCoding";
import ClassroomDashboard from "./pages/ClassroomDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/landing" element={<Landing />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/py-notebook" 
              element={
                <ProtectedRoute>
                  <PyNotebook />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/python-editor" 
              element={
                <ProtectedRoute>
                  <PythonEditor />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/visual-coding" 
              element={
                <ProtectedRoute>
                  <VisualCoding />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/classroom" 
              element={
                <ProtectedRoute>
                  <ClassroomDashboard />
                </ProtectedRoute>
              } 
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
