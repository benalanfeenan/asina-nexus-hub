import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";

import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Participants from "./pages/Participants";
import Staff from "./pages/Staff";
import StaffDetail from "./pages/StaffDetail";
import ParticipantDetail from "./pages/ParticipantDetail";
import SILHouses from "./pages/SILHouses";
import SILHouseDetail from "./pages/SILHouseDetail";
import Rostering from "./pages/Rostering";
import Timesheets from "./pages/Timesheets";
import ProgressNotes from "./pages/ProgressNotes";
import Invoicing from "./pages/Invoicing";
import Incidents from "./pages/Incidents";
import Complaints from "./pages/Complaints";
import RiskRegister from "./pages/RiskRegister";
import Hazards from "./pages/Hazards";
import RestrictivePractices from "./pages/RestrictivePractices";
import QualityImprovement from "./pages/QualityImprovement";
import ComplianceDashboard from "./pages/ComplianceDashboard";
import Documents from "./pages/Documents";
import NDISPriceList from "./pages/NDISPriceList";
import Settings from "./pages/Settings";
import Feedback from "./pages/Feedback";
import FireSafety from "./pages/FireSafety";
import ConflictOfInterest from "./pages/ConflictOfInterest";
import LegislativeCompliance from "./pages/LegislativeCompliance";
import Insurance from "./pages/Insurance";
import MeetingMinutes from "./pages/MeetingMinutes";
import ReportIncidentTrends from "./pages/ReportIncidentTrends";
import ReportRPTrends from "./pages/ReportRPTrends";
import ReportMonthlySummary from "./pages/ReportMonthlySummary";
import InternalAudits from "./pages/InternalAudits";
import Safeguarding from "./pages/Safeguarding";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedPage = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <AppLayout>{children}</AppLayout>
  </ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/" element={<ProtectedPage><Dashboard /></ProtectedPage>} />
            <Route path="/participants" element={<ProtectedPage><Participants /></ProtectedPage>} />
            <Route path="/participants/:id" element={<ProtectedPage><ParticipantDetail /></ProtectedPage>} />
            <Route path="/staff" element={<ProtectedPage><Staff /></ProtectedPage>} />
            <Route path="/staff/:id" element={<ProtectedPage><StaffDetail /></ProtectedPage>} />
            <Route path="/sil-houses" element={<ProtectedPage><SILHouses /></ProtectedPage>} />
            <Route path="/sil-houses/:id" element={<ProtectedPage><SILHouseDetail /></ProtectedPage>} />
            <Route path="/rostering" element={<ProtectedPage><Rostering /></ProtectedPage>} />
            <Route path="/timesheets" element={<ProtectedPage><Timesheets /></ProtectedPage>} />
            <Route path="/progress-notes" element={<ProtectedPage><ProgressNotes /></ProtectedPage>} />
            <Route path="/invoicing" element={<ProtectedPage><Invoicing /></ProtectedPage>} />
            <Route path="/incidents" element={<ProtectedPage><Incidents /></ProtectedPage>} />
            <Route path="/complaints" element={<ProtectedPage><Complaints /></ProtectedPage>} />
            <Route path="/feedback" element={<ProtectedPage><Feedback /></ProtectedPage>} />
            <Route path="/fire-safety" element={<ProtectedPage><FireSafety /></ProtectedPage>} />
            <Route path="/risk-register" element={<ProtectedPage><RiskRegister /></ProtectedPage>} />
            <Route path="/hazards" element={<ProtectedPage><Hazards /></ProtectedPage>} />
            <Route path="/restrictive-practices" element={<ProtectedPage><RestrictivePractices /></ProtectedPage>} />
            <Route path="/quality-improvement" element={<ProtectedPage><QualityImprovement /></ProtectedPage>} />
            <Route path="/compliance-dashboard" element={<ProtectedPage><ComplianceDashboard /></ProtectedPage>} />
            <Route path="/conflict-of-interest" element={<ProtectedPage><ConflictOfInterest /></ProtectedPage>} />
            <Route path="/legislative-compliance" element={<ProtectedPage><LegislativeCompliance /></ProtectedPage>} />
            <Route path="/insurance" element={<ProtectedPage><Insurance /></ProtectedPage>} />
            <Route path="/meetings" element={<ProtectedPage><MeetingMinutes /></ProtectedPage>} />
            <Route path="/reports/incidents" element={<ProtectedPage><ReportIncidentTrends /></ProtectedPage>} />
            <Route path="/reports/restrictive-practices" element={<ProtectedPage><ReportRPTrends /></ProtectedPage>} />
            <Route path="/reports/summary" element={<ProtectedPage><ReportMonthlySummary /></ProtectedPage>} />
            <Route path="/documents" element={<ProtectedPage><Documents /></ProtectedPage>} />
            <Route path="/ndis-price-list" element={<ProtectedPage><NDISPriceList /></ProtectedPage>} />
            <Route path="/settings" element={<ProtectedPage><Settings /></ProtectedPage>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
