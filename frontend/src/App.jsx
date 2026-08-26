import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import useStore from './store/useStore';
import { Loader2 } from 'lucide-react';

// Common Components
import Navbar from './components/common/Navbar';
import Sidebar from './components/common/Sidebar';
import NeuralDock from './components/common/NeuralDock';

// Auth Components
import LoginPage from './components/auth/LoginPage';
import SignupSelect from './components/auth/SignupSelect';
import PatientRegister from './components/auth/PatientRegister';
import DoctorRegister from './components/auth/DoctorRegister';
import ForgotPassword from './components/auth/ForgotPassword';

// Patient Components
import PatientDashboard from './components/patient/PatientDashboard';
import PatientProfile from './components/patient/PatientProfile';
import UploadReport from './components/patient/UploadReport';
import AIAnalysis from './components/patient/AIAnalysis';
import FindDoctor from './components/patient/FindDoctor';
import DoctorSearch from './components/patient/SpecialistDiscovery';
import CostEstimator from './components/patient/CostEstimator';
import BookOP from './components/patient/BookOP';
import MedicineReminder from './components/patient/MedicineReminder';
import MedicineSearch from './components/patient/MedicineSearch';
import HealthProgress from './components/patient/HealthProgress';
import GiveReview from './components/patient/GiveReview';
import Bills from './components/patient/Bills';
import EmergencyQR from './components/patient/EmergencyQR';
import AIChat from './components/patient/AIChat';
import PatientVideoConsult from './components/patient/VideoConsultation';
import PatientVoiceConsult from './components/common/VoiceConsultation';
import PatientPrescriptions from './components/patient/Prescriptions';
import PatientHistory from './components/patient/PatientHistory';
import PatientDiagnosisHub from './components/patient/PatientDiagnosisHub';
import ConsultationDetails from './components/common/ConsultationDetails';
import GlobalCallListener from './components/common/GlobalCallListener';
import GeneralSettings from './components/common/GeneralSettings';
import ChatSystem from './components/common/ChatSystem';

// Doctor Components
import DocDashboard from './components/doctor/DocDashboard';
import PatientQueue from './components/doctor/PatientQueue';
import SearchPatient from './components/doctor/SearchPatient';
import PatientDetails from './components/doctor/PatientDetails';
import DoctorVideoConsult from './components/doctor/VideoConsultation';
import DoctorVoiceConsult from './components/common/VoiceConsultation';
import AIReportReview from './components/doctor/AIReportReview';
import ReportComparison from './components/doctor/ReportComparison';
import WritePrescription from './components/doctor/WritePrescription';
import DoctorPrescriptions from './components/doctor/Prescriptions';
import Followups from './components/doctor/Followups';
import Referral from './components/doctor/Referral';
import RecoveryMonitoring from './components/doctor/RecoveryMonitoring';
import DocProfile from './components/doctor/DocProfile';
import DocSettings from './components/doctor/DocSettings';
import DoctorHistory from './components/doctor/DoctorHistory';
import DoctorDiagnosisHub from './components/doctor/DoctorDiagnosisHub';
import DoctorAIChat from './components/doctor/AIChat';
import DoctorNetwork from './components/doctor/DoctorNetwork';

// Admin Components
import AdminDashboard from './components/admin/AdminDashboard';
import ManageDoctors from './components/admin/ManageDoctors';
import DoctorApprovals from './components/admin/DoctorApprovals';
import DoctorDetails from './components/admin/DoctorDetails';
import ManagePatients from './components/admin/ManagePatients';
import OPTokenManagement from './components/admin/OPTokenManagement';
import ManageAppointments from './components/admin/ManageAppointments';
import DepartmentManagement from './components/admin/DepartmentManagement';
import EmergencyManagement from './components/admin/EmergencyManagement';
import AIMonitoring from './components/admin/AIMonitoring';
import ReportsBills from './components/admin/ReportsBills';
import DoctorReviews from './components/admin/DoctorReviews';
import NotificationManagement from './components/admin/NotificationManagement';
import UserAccessControl from './components/admin/UserAccessControl';
import SubAdminRoles from './components/admin/SubAdminRoles';
import AuditLogs from './components/admin/AuditLogs';
import BulkUpload from './components/admin/BulkUpload';
import DataExport from './components/admin/DataExport';
import BackupRestore from './components/admin/BackupRestore';
import SystemSettings from './components/admin/SystemSettings';
import HospitalSettings from './components/admin/HospitalSettings';
import AdminProfile from './components/admin/AdminProfile';
import ProfileGovernance from './components/admin/ProfileGovernance';

const ProtectedRoute = ({ children, role }) => {
  const { user } = useStore();
  const location = useLocation();

  if (!user || !user.role) return <Navigate to="/" state={{ from: location }} replace />;

  if (role && user.role !== role) {
    if (user.role === 'admin' && location.pathname !== '/admin-dashboard') return <Navigate to="/admin-dashboard" replace />;
    if (user.role === 'doctor' && location.pathname !== '/doc-dashboard') return <Navigate to="/doc-dashboard" replace />;
    if (user.role === 'patient' && !location.pathname.startsWith('/patient')) return <Navigate to="/patient/dashboard" replace />;

    if (location.pathname === '/admin-dashboard' || location.pathname === '/doc-dashboard' || location.pathname.startsWith('/patient')) {
      return children;
    }

    return <Navigate to="/" replace />;
  }
  return children;
};

const LayoutWrapper = ({ children }) => {
  const { user, theme, showNeuralDock, showSidebar: sidebarPref, sidebarExpanded } = useStore();
  const location = useLocation();

  const isPublicPage = location.pathname === '/' ||
    location.pathname.startsWith('/register') ||
    location.pathname === '/forgot-password';

  const showSidebar = sidebarPref && user && !isPublicPage;

  const showDock = showNeuralDock &&
    user &&
    (user.role === 'patient' || user.role === 'doctor' || user.role === 'admin') &&
    !isPublicPage &&
    !location.pathname.toLowerCase().includes('consult') &&
    !location.pathname.toLowerCase().includes('chat');

  return (
    <div className={`${theme === 'dark' ? 'dark' : 'light'} min-h-screen flex`}>
      {showSidebar && <Sidebar />}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-500">
        <GlobalCallListener />
        {children}
        {showDock && <NeuralDock />}
      </div>
    </div>
  );
};

const RootRedirect = () => {
  const { user } = useStore();
  if (!user || !user.role) return <LoginPage />;
  if (user.role === 'admin') return <Navigate to="/admin-dashboard" replace />;
  if (user.role === 'doctor') return <Navigate to="/doc-dashboard" replace />;
  return <Navigate to="/patient/dashboard" replace />;
};

function App() {
  const store = useStore();
  const theme = store.theme || 'dark';

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      document.body.style.backgroundColor = '#050505';
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
      document.body.style.backgroundColor = '#F8FAFC';
    }
  }, [theme]);

  return (
    <Router>
      <LayoutWrapper>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/register" element={<SignupSelect />} />
          <Route path="/register/patient" element={<PatientRegister />} />
          <Route path="/register/doctor" element={<DoctorRegister />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Patient Routes */}
          <Route path="/patient/dashboard" element={<ProtectedRoute role="patient"><PatientDashboard /></ProtectedRoute>} />
          <Route path="/patient/profile" element={<ProtectedRoute role="patient"><PatientProfile /></ProtectedRoute>} />
          <Route path="/patient/reports/upload" element={<ProtectedRoute role="patient"><UploadReport /></ProtectedRoute>} />
          <Route path="/patient/ai-analysis" element={<ProtectedRoute role="patient"><AIAnalysis /></ProtectedRoute>} />
          <Route path="/patient/find-doctor" element={<ProtectedRoute role="patient"><FindDoctor /></ProtectedRoute>} />
          <Route path="/patient/doctor-search" element={<ProtectedRoute role="patient"><DoctorSearch /></ProtectedRoute>} />
          <Route path="/patient/cost-estimator" element={<ProtectedRoute role="patient"><CostEstimator /></ProtectedRoute>} />
          <Route path="/patient/book-op" element={<ProtectedRoute role="patient"><BookOP /></ProtectedRoute>} />
          <Route path="/patient/medicine" element={<ProtectedRoute role="patient"><MedicineReminder /></ProtectedRoute>} />
          <Route path="/patient/medicine-search" element={<ProtectedRoute role="patient"><MedicineSearch /></ProtectedRoute>} />
          <Route path="/patient/health" element={<ProtectedRoute role="patient"><HealthProgress /></ProtectedRoute>} />
          <Route path="/patient/review" element={<ProtectedRoute role="patient"><GiveReview /></ProtectedRoute>} />
          <Route path="/patient/bills" element={<ProtectedRoute role="patient"><Bills /></ProtectedRoute>} />
          <Route path="/patient/emergency-qr" element={<ProtectedRoute role="patient"><EmergencyQR /></ProtectedRoute>} />
          <Route path="/patient/ai-chat" element={<ProtectedRoute role="patient"><AIChat /></ProtectedRoute>} />
          <Route path="/patient/chat" element={<ProtectedRoute role="patient"><ChatSystem /></ProtectedRoute>} />
          <Route path="/patient/consultation-details" element={<ProtectedRoute role="patient"><ConsultationDetails /></ProtectedRoute>} />
          <Route path="/patient/video-consult" element={<ProtectedRoute role="patient"><PatientVideoConsult /></ProtectedRoute>} />
          <Route path="/patient/voice-consult" element={<ProtectedRoute role="patient"><PatientVoiceConsult /></ProtectedRoute>} />
          <Route path="/patient/prescriptions" element={<ProtectedRoute role="patient"><PatientPrescriptions /></ProtectedRoute>} />
          <Route path="/patient/history" element={<ProtectedRoute role="patient"><PatientHistory /></ProtectedRoute>} />
          <Route path="/patient/diagnoses" element={<ProtectedRoute role="patient"><PatientDiagnosisHub /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><GeneralSettings /></ProtectedRoute>} />

          {/* Doctor Routes */}
          <Route path="/doc-dashboard" element={<ProtectedRoute role="doctor"><DocDashboard /></ProtectedRoute>} />
          <Route path="/doctor/queue" element={<ProtectedRoute role="doctor"><PatientQueue /></ProtectedRoute>} />
          <Route path="/doctor/search" element={<ProtectedRoute role="doctor"><SearchPatient /></ProtectedRoute>} />
          <Route path="/doctor/patient/:patientId" element={<ProtectedRoute role="doctor"><PatientDetails /></ProtectedRoute>} />
          <Route path="/doctor/consultation-details" element={<ProtectedRoute role="doctor"><ConsultationDetails /></ProtectedRoute>} />
          <Route path="/doctor/video-consult" element={<ProtectedRoute role="doctor"><DoctorVideoConsult /></ProtectedRoute>} />
          <Route path="/doctor/voice-consult" element={<ProtectedRoute role="doctor"><DoctorVoiceConsult /></ProtectedRoute>} />
          <Route path="/doctor/ai-report" element={<ProtectedRoute role="doctor"><AIReportReview /></ProtectedRoute>} />
          <Route path="/doctor/comparison" element={<ProtectedRoute role="doctor"><ReportComparison /></ProtectedRoute>} />
          <Route path="/doctor/prescription" element={<ProtectedRoute role="doctor"><WritePrescription /></ProtectedRoute>} />
          <Route path="/doctor/prescriptions" element={<ProtectedRoute role="doctor"><DoctorPrescriptions /></ProtectedRoute>} />
          <Route path="/doctor/followups" element={<ProtectedRoute role="doctor"><Followups /></ProtectedRoute>} />
          <Route path="/doctor/referral" element={<ProtectedRoute role="doctor"><Referral /></ProtectedRoute>} />
          <Route path="/doctor/analytics" element={<ProtectedRoute role="doctor"><RecoveryMonitoring /></ProtectedRoute>} />
          <Route path="/doctor/profile" element={<ProtectedRoute role="doctor"><DocProfile /></ProtectedRoute>} />
          <Route path="/doctor/settings" element={<ProtectedRoute role="doctor"><DocSettings /></ProtectedRoute>} />
          <Route path="/doctor/history" element={<ProtectedRoute role="doctor"><DoctorHistory /></ProtectedRoute>} />
          <Route path="/doctor/diagnoses" element={<ProtectedRoute role="doctor"><DoctorDiagnosisHub /></ProtectedRoute>} />
          <Route path="/doctor/ai-chat" element={<ProtectedRoute role="doctor"><DoctorAIChat /></ProtectedRoute>} />
          <Route path="/doctor/chat" element={<ProtectedRoute role="doctor"><ChatSystem /></ProtectedRoute>} />
          <Route path="/doctor/network" element={<ProtectedRoute role="doctor"><DoctorNetwork /></ProtectedRoute>} />

          {/* Admin Routes */}
          <Route path="/admin-dashboard" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/doctors" element={<ProtectedRoute role="admin"><ManageDoctors /></ProtectedRoute>} />
          <Route path="/admin/approvals" element={<ProtectedRoute role="admin"><DoctorApprovals /></ProtectedRoute>} />
          <Route path="/admin/doctor/:doctorId" element={<ProtectedRoute role="admin"><DoctorDetails /></ProtectedRoute>} />
          <Route path="/admin/patients" element={<ProtectedRoute role="admin"><ManagePatients /></ProtectedRoute>} />
          <Route path="/admin/op-tokens" element={<ProtectedRoute role="admin"><OPTokenManagement /></ProtectedRoute>} />
          <Route path="/admin/appointments" element={<ProtectedRoute role="admin"><ManageAppointments /></ProtectedRoute>} />
          <Route path="/admin/departments" element={<ProtectedRoute role="admin"><DepartmentManagement /></ProtectedRoute>} />
          <Route path="/admin/emergency" element={<ProtectedRoute role="admin"><EmergencyManagement /></ProtectedRoute>} />
          <Route path="/admin/ai-monitoring" element={<ProtectedRoute role="admin"><AIMonitoring /></ProtectedRoute>} />
          <Route path="/admin/billing" element={<ProtectedRoute role="admin"><ReportsBills /></ProtectedRoute>} />
          <Route path="/admin/reviews" element={<ProtectedRoute role="admin"><DoctorReviews /></ProtectedRoute>} />
          <Route path="/admin/notifications" element={<ProtectedRoute role="admin"><NotificationManagement /></ProtectedRoute>} />
          <Route path="/admin/access" element={<ProtectedRoute role="admin"><UserAccessControl /></ProtectedRoute>} />
          <Route path="/admin/sub-admins" element={<ProtectedRoute role="admin"><SubAdminRoles /></ProtectedRoute>} />
          <Route path="/admin/audit-logs" element={<ProtectedRoute role="admin"><AuditLogs /></ProtectedRoute>} />
          <Route path="/admin/patient/:patientId" element={<ProtectedRoute role="admin"><PatientDetails /></ProtectedRoute>} />
          <Route path="/admin/bulk-upload" element={<ProtectedRoute role="admin"><BulkUpload /></ProtectedRoute>} />
          <Route path="/admin/export" element={<ProtectedRoute role="admin"><DataExport /></ProtectedRoute>} />
          <Route path="/admin/hospital-settings" element={<ProtectedRoute role="admin"><HospitalSettings /></ProtectedRoute>} />
          <Route path="/admin/system-settings" element={<ProtectedRoute role="admin"><SystemSettings /></ProtectedRoute>} />
          <Route path="/admin/profile-governance" element={<ProtectedRoute role="admin"><ProfileGovernance /></ProtectedRoute>} />
          <Route path="/admin/profile" element={<ProtectedRoute role="admin"><AdminProfile /></ProtectedRoute>} />
          <Route path="/admin/profile" element={<ProtectedRoute role="admin"><AdminProfile /></ProtectedRoute>} />
          <Route path="/admin/backup" element={<ProtectedRoute role="admin"><BackupRestore /></ProtectedRoute>} />
          <Route path="/admin/backup" element={<ProtectedRoute role="admin"><BackupRestore /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </LayoutWrapper>
    </Router>
  );
}

export default App;
