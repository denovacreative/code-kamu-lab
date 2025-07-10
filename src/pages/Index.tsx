import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import Dashboard from "./Dashboard";
import Landing from "./Landing";

const Index = () => {
  const { user } = useAuth();

  // If user is not logged in, show landing page
  if (!user) {
    return <Landing />;
  }

  // If user is logged in, show dashboard
  return <Dashboard />;
};

export default Index;
