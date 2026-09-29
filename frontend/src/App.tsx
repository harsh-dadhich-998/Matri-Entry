import { useState, lazy, Suspense } from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { User, MatrimonialRecord, ActivityLog } from './types';
import {
  getStoredUsers,
  getStoredRecords,
  getStoredLogs,
  loadWorkspace,
  saveRecord,
  deleteRecord,
} from './services/storage';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { ToastProvider, useToast } from './components/common/Toast';
import { LoadingOverlay } from './components/common/LoadingOverlay';
const DatabaseSettingsModal = lazy(() =>
  import('./components/settings/DatabaseSettingsModal').then((module) => ({
    default: module.DatabaseSettingsModal,
  })),
);
const RecordDetailModal = lazy(() =>
  import('./components/common/RecordDetailModal').then((module) => ({
    default: module.RecordDetailModal,
  })),
);
import { AuthGate } from './components/auth/AuthGate';
import { apiRequest, errorMessage } from './services/api';
import { useAppearance } from './services/appearance';

// Operator Views
import { OperatorDashboard } from './components/operator/OperatorDashboard';
const DataEntryForm = lazy(() =>
  import('./components/operator/DataEntryForm').then((module) => ({
    default: module.DataEntryForm,
  })),
);
import { MyRecords } from './components/operator/MyRecords';
import { MyProfile } from './components/operator/MyProfile';

// Admin Views
const AdminDashboard = lazy(() =>
  import('./components/admin/AdminDashboard').then((module) => ({
    default: module.AdminDashboard,
  })),
);
const UserManagement = lazy(() =>
  import('./components/admin/UserManagement').then((module) => ({
    default: module.UserManagement,
  })),
);
const AllRecords = lazy(() =>
  import('./components/admin/AllRecords').then((module) => ({
    default: module.AllRecords,
  })),
);
const LiveMonitoring = lazy(() =>
  import('./components/admin/LiveMonitoring').then((module) => ({
    default: module.LiveMonitoring,
  })),
);

export function MainApp({ authenticatedUser }: { authenticatedUser: User }) {
  useAppearance(authenticatedUser.id);
  const { showToast } = useToast();

  // Core application state
  const [users, setUsers] = useState<User[]>(getStoredUsers);
  const [records, setRecords] = useState<MatrimonialRecord[]>(getStoredRecords);
  const [logs, setLogs] = useState<ActivityLog[]>(getStoredLogs);
  const [currentUser, setCurrentUserState] = useState<User>(authenticatedUser);

  const navigate = useNavigate();
  const location = useLocation();
  const currentRole = currentUser.role;
  const activeTab = location.pathname.split('/')[2] || 'dashboard';

  // Active Slot Number for Data Entry
  const [activeSlotNumber, setActiveSlotNumber] = useState<number>(1);

  // Modals
  const [isDbSettingsOpen, setIsDbSettingsOpen] = useState(false);

  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [selectedRecordForModal, setSelectedRecordForModal] =
    useState<MatrimonialRecord | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const reloadData = async () => {
    try {
      const user = await loadWorkspace();
      setCurrentUserState(user);
      setUsers(getStoredUsers());
      setRecords(getStoredRecords());
      setLogs(getStoredLogs());
    } catch (error) {
      showToast('error', 'Refresh failed', errorMessage(error));
      throw error;
    }
  };
  const handleLogout = async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
      window.location.reload();
    } catch (error) {
      showToast('error', 'Sign out failed', errorMessage(error));
    }
  };
  const handleSaveRecordFromModal = async (record: MatrimonialRecord) => {
    await saveRecord(record);
    setRecords(getStoredRecords());
    showToast('success', 'Profile updated', 'Changes saved to your workspace.');
  };
  const handleDeleteRecordFromModal = async (id: string) => {
    await deleteRecord(id);
    setRecords(getStoredRecords());
    showToast('success', 'Record deleted', 'The record has been removed.');
  };

  const goToTab = (tab: string) => navigate(`/${currentRole}/${tab}`);

  // Header Titles
  const getHeaderInfo = () => {
    if (currentRole === 'operator') {
      switch (activeTab) {
        case 'dashboard':
          return { title: 'Dashboard', subtitle: 'Your daily workspace' };
        case 'data-entry':
          return {
            title: 'Data Entry',
            subtitle: `Matrimonial Slot #${activeSlotNumber} Entry Form`,
          };
        case 'my-records':
          return {
            title: 'My Records',
            subtitle: 'View and manage all assigned slots',
          };
        case 'profile':
          return {
            title: 'My Profile',
            subtitle: 'Account statistics and countdown',
          };
        default:
          return { title: 'Workspace', subtitle: '' };
      }
    } else {
      switch (activeTab) {
        case 'dashboard':
          return { title: 'Dashboard', subtitle: 'Your team at a glance' };
        case 'users':
          return {
            title: 'User Management',
            subtitle: 'Registered data entry operators',
          };
        case 'records':
          return {
            title: 'Matrimonial Records',
            subtitle: 'Central matrimonial database',
          };
        case 'monitoring':
          return {
            title: 'Live Monitoring',
            subtitle: 'Team activity and assignment progress',
          };
        case 'settings':
          return {
            title: 'Database & Settings',
            subtitle: 'PostgreSQL Supabase configuration',
          };
        default:
          return { title: 'Workspace', subtitle: '' };
      }
    }
  };

  const headerInfo = getHeaderInfo();

  return (
    <div className="app-shell min-h-screen bg-slate-50 flex flex-col md:flex-row antialiased text-slate-800">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      {/* Left Sidebar */}
      <Sidebar
        currentRole={currentRole}
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (currentRole === 'admin') {
            if (tab === 'settings') {
              setIsDbSettingsOpen(true);
            } else {
              goToTab(tab);
            }
          } else {
            goToTab(tab);
          }
        }}
        currentUser={currentUser}
        onLogout={handleLogout}
        timeRemainingTarget={currentUser.expiryDate}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="workspace flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Sticky Header */}
        <Header
          title={headerInfo.title}
          subtitle={headerInfo.subtitle}
          currentUser={currentUser}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenDatabaseSettings={() => setIsDbSettingsOpen(true)}
        />

        {/* Content Body */}
        <main
          id="main-content"
          tabIndex={-1}
          className="workspace-content flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto"
        >
          <Suspense
            fallback={
              <p role="status" className="text-indigo-700">
                Loading page…
              </p>
            }
          >
            <Routes>
              <Route
                path="/admin/dashboard"
                element={
                  currentRole === 'admin' ? (
                    <AdminDashboard
                      users={users}
                      records={records}
                      logs={logs}
                      onNavigate={goToTab}
                      onOpenCreateUser={() => {
                        goToTab('users');
                        setIsCreateUserModalOpen(true);
                      }}
                    />
                  ) : (
                    <Navigate replace to="/operator/dashboard" />
                  )
                }
              />
              <Route
                path="/admin/users"
                element={
                  currentRole === 'admin' ? (
                    <UserManagement
                      users={users}
                      onUsersUpdated={() => {
                        void reloadData().catch(() => {});
                      }}
                      isCreateModalOpen={isCreateUserModalOpen}
                      onCloseCreateModal={() => setIsCreateUserModalOpen(false)}
                    />
                  ) : (
                    <Navigate replace to="/operator/dashboard" />
                  )
                }
              />
              <Route
                path="/admin/records"
                element={
                  currentRole === 'admin' ? (
                    <AllRecords
                      records={records}
                      onRecordsUpdated={() => {
                        void reloadData().catch(() => {});
                      }}
                      onOpenRecordModal={setSelectedRecordForModal}
                    />
                  ) : (
                    <Navigate replace to="/operator/dashboard" />
                  )
                }
              />
              <Route
                path="/admin/monitoring"
                element={
                  currentRole === 'admin' ? (
                    <LiveMonitoring
                      users={users}
                      records={records}
                      onRefreshNow={reloadData}
                    />
                  ) : (
                    <Navigate replace to="/operator/dashboard" />
                  )
                }
              />
              <Route
                path="/operator/dashboard"
                element={
                  currentRole === 'operator' ? (
                    <OperatorDashboard
                      currentUser={currentUser}
                      records={records}
                      onNavigateToDataEntry={(slot) => {
                        if (slot) setActiveSlotNumber(slot);
                        goToTab('data-entry');
                      }}
                      onNavigateToRecords={() => goToTab('my-records')}
                    />
                  ) : (
                    <Navigate replace to="/admin/dashboard" />
                  )
                }
              />
              <Route
                path="/operator/data-entry"
                element={
                  currentRole === 'operator' ? (
                    <DataEntryForm
                      currentUser={currentUser}
                      slotNumber={activeSlotNumber}
                      onSlotChange={setActiveSlotNumber}
                      onRecordSaved={reloadData}
                    />
                  ) : (
                    <Navigate replace to="/admin/dashboard" />
                  )
                }
              />
              <Route
                path="/operator/my-records"
                element={
                  currentRole === 'operator' ? (
                    <MyRecords
                      currentUser={currentUser}
                      onSelectSlot={(slot) => {
                        setActiveSlotNumber(slot);
                        goToTab('data-entry');
                      }}
                      onViewRecordModal={setSelectedRecordForModal}
                    />
                  ) : (
                    <Navigate replace to="/admin/dashboard" />
                  )
                }
              />
              <Route
                path="/operator/profile"
                element={
                  currentRole === 'operator' ? (
                    <MyProfile currentUser={currentUser} records={records} />
                  ) : (
                    <Navigate replace to="/admin/dashboard" />
                  )
                }
              />
              <Route
                path="*"
                element={<Navigate replace to={`/${currentRole}/dashboard`} />}
              />
            </Routes>
          </Suspense>
        </main>
      </div>

      {/* Database & Supabase Modal */}
      {currentRole === 'admin' && (
        <Suspense fallback={null}>
          <DatabaseSettingsModal
            isOpen={isDbSettingsOpen}
            onClose={() => setIsDbSettingsOpen(false)}
            userId={currentUser.id}
          />
        </Suspense>
      )}

      {/* Record View / Edit Modal */}
      <Suspense fallback={null}>
        <RecordDetailModal
          isOpen={Boolean(selectedRecordForModal)}
          onClose={() => setSelectedRecordForModal(null)}
          record={selectedRecordForModal}
          userRole={currentRole}
          onSave={handleSaveRecordFromModal}
          onDelete={handleDeleteRecordFromModal}
        />
      </Suspense>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <LoadingOverlay />
        <AuthGate>
          {(user) => <MainApp key={user.id} authenticatedUser={user} />}
        </AuthGate>
      </ToastProvider>
    </BrowserRouter>
  );
}
