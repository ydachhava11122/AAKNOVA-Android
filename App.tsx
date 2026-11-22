import {
  Award,
  BarChart3,
  Bell,
  BookOpen,
  Briefcase,
  Building2,
  Bus,
  Calendar,
  CheckCheck,
  ClipboardCheck,
  Crown,
  Database,
  FileSpreadsheet,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Moon,
  Search,
  Settings,
  Shield,
  Sun,
  UserCheck,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { AuthPortal } from './components/AuthPortal';
import { BrandMark } from './components/BrandMark';
import { OfflineIndicator, PWAInstallButton } from './components/PWAInstallButton';
import {
  apiRequest,
  formatDateTime,
  setActiveInstitutionHeader,
  setCsrfToken,
} from './lib/api';
import { AttendanceModule } from './modules/AttendanceModule';
import { BackupsAndHealthModule } from './modules/BackupsAndHealthModule';
import { CommunicationsModule } from './modules/CommunicationsModule';
import { DashboardView } from './modules/DashboardView';
import { ExamsModule } from './modules/ExamsModule';
import { FinanceModule } from './modules/FinanceModule';
import { FounderDashboardModule } from './modules/FounderDashboardModule';
import { GovernanceModule } from './modules/GovernanceModule';
import {
  CertificatesModule,
  LibraryModule,
  ParentsModule,
  StaffModule,
  TimetableModule,
  TransportModule,
} from './modules/OperationsModules';
import { SettingsModule } from './modules/SettingsModule';
import { StudentsModule } from './modules/StudentsModule';
import { TeachersModule } from './modules/TeachersModule';
import type {
  AuthUser,
  InstitutionSummary,
  ModuleKey,
  NotificationRecord,
  ProvisionedInstitutionCred,
} from './types';

interface NavItem {
  key: ModuleKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  section: 'founder' | 'institution' | 'governance';
  founderOnly?: boolean;
  permission?: string;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'founder_dashboard', label: 'Founder Overview', icon: Crown, section: 'founder', founderOnly: true },
  { key: 'institutions', label: 'Institutions', icon: Building2, section: 'founder', founderOnly: true },
  { key: 'dashboard', label: 'Institution Home', icon: LayoutDashboard, section: 'institution' },
  { key: 'students', label: 'Students', icon: GraduationCap, section: 'institution', permission: 'students.view' },
  { key: 'teachers', label: 'Teachers', icon: UserCheck, section: 'institution', permission: 'teachers.view' },
  { key: 'staff', label: 'Staff', icon: Briefcase, section: 'institution', permission: 'staff.view' },
  { key: 'attendance', label: 'Attendance', icon: ClipboardCheck, section: 'institution', permission: 'attendance.view' },
  { key: 'fees', label: 'Fees & Finance', icon: Wallet, section: 'institution', permission: 'fees.view' },
  { key: 'exams', label: 'Exams & Results', icon: FileSpreadsheet, section: 'institution', permission: 'exams.view' },
  { key: 'timetable', label: 'Timetable', icon: Calendar, section: 'institution', permission: 'timetable.view' },
  { key: 'notices', label: 'Notices', icon: Megaphone, section: 'institution', permission: 'notices.view' },
  { key: 'library', label: 'Library', icon: BookOpen, section: 'institution', permission: 'library.view' },
  { key: 'transport', label: 'Transport', icon: Bus, section: 'institution', permission: 'transport.view' },
  { key: 'parents', label: 'Parents', icon: Users, section: 'institution', permission: 'parents.view' },
  { key: 'certificates', label: 'Certificates', icon: Award, section: 'institution', permission: 'certificates.view' },
  { key: 'reports', label: 'Reports & Analytics', icon: BarChart3, section: 'institution', permission: 'reports.view' },
  { key: 'governance', label: 'Users & Audit', icon: Shield, section: 'governance', permission: 'users.manage' },
  { key: 'backups', label: 'Backups & ZIP', icon: Database, section: 'governance', founderOnly: true },
  { key: 'settings', label: 'Settings', icon: Settings, section: 'governance' },
];

export default function App() {
  const [booting, setBooting] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [institutions, setInstitutions] = useState<InstitutionSummary[]>([]);
  const [activeInstId, setActiveInstId] = useState<number | null>(null);
  const [tenantVersion, setTenantVersion] = useState(0);
  const [activeModule, setActiveModule] = useState<ModuleKey>('founder_dashboard');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [quickSearch, setQuickSearch] = useState('');
  const [provisionedCreds, setProvisionedCreds] = useState<ProvisionedInstitutionCred[]>([]);

  // Sync HTML .dark class strictly
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const loadSessionAndInstitutions = useCallback(async () => {
    setBooting(true);
    try {
      const setup = await apiRequest<{ needsSetup: boolean }>('/api/auth/setup-status');
      setNeedsSetup(setup.needsSetup);
      if (setup.needsSetup) {
        setUser(null);
        return;
      }
      try {
        const me = await apiRequest<{ user: AuthUser; institutions: InstitutionSummary[] }>('/api/auth/me');
        setCsrfToken(me.user.csrfToken);
        setUser(me.user);
        setInstitutions(me.institutions);
        const defaultInst = me.user.institutionId || me.institutions[0]?.id || null;
        setActiveInstId(defaultInst);
        setActiveInstitutionHeader(defaultInst);
        setActiveModule(me.user.isFounder ? 'founder_dashboard' : 'dashboard');
        if (me.user.theme === 'light' || me.user.theme === 'dark') {
          setTheme(me.user.theme);
        }
      } catch {
        setUser(null);
      }
    } finally {
      setBooting(false);
    }
  }, []);

  useEffect(() => {
    loadSessionAndInstitutions();
  }, [loadSessionAndInstitutions]);

  const refreshInstitutions = useCallback(async () => {
    if (!user) return;
    try {
      const res = await apiRequest<{ institutions: InstitutionSummary[] }>('/api/institutions');
      setInstitutions(res.institutions);
      if (!activeInstId && res.institutions[0]) {
        setActiveInstId(res.institutions[0].id);
        setActiveInstitutionHeader(res.institutions[0].id);
      }
    } catch {
      // ignore
    }
  }, [user, activeInstId]);

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await apiRequest<{ notifications: NotificationRecord[]; unreadCount: number }>(
        '/api/communications/notifications'
      );
      setNotifications(res.notifications);
      setUnreadCount(res.unreadCount);
    } catch {
      // ignore
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user, loadNotifications, activeModule]);

  const handleSelectInstitution = (id: number) => {
    setActiveInstId(id);
    setActiveInstitutionHeader(id);
    setTenantVersion((v) => v + 1);
  };

  const handleLogout = async () => {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    setUser(null);
    setCsrfToken('');
    setActiveInstitutionHeader(null);
    setProvisionedCreds([]);
  };

  if (booting) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#050B16] text-white gap-4">
        <BrandMark size={48} />
        <p className="text-xs text-slate-400">Initializing AAKNOVA Enterprise Workspace...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <AuthPortal
          needsSetup={needsSetup}
          onAuthenticated={(authUser, provisioned) => {
            setNeedsSetup(false);
            setUser(authUser);
            if (provisioned && provisioned.length > 0) {
              setProvisionedCreds(provisioned);
            }
            apiRequest<{ institutions: InstitutionSummary[] }>('/api/institutions')
              .then((r) => {
                setInstitutions(r.institutions);
                const firstId = authUser.institutionId || r.institutions[0]?.id || null;
                setActiveInstId(firstId);
                setActiveInstitutionHeader(firstId);
              })
              .catch(() => {});
            setActiveModule(authUser.isFounder ? 'founder_dashboard' : 'dashboard');
          }}
        />
        <OfflineIndicator />
      </>
    );
  }

  const hasPerm = (perm?: string) => !perm || user.isFounder || user.permissions.includes(perm);
  const visibleNav = NAV_ITEMS.filter((item) => {
    if (item.founderOnly && !user.isFounder) return false;
    if (!hasPerm(item.permission)) return false;
    if (quickSearch.trim()) {
      return item.label.toLowerCase().includes(quickSearch.trim().toLowerCase());
    }
    return true;
  });

  const activeInst = institutions.find((i) => i.id === activeInstId) || institutions[0] || null;
  const currencySymbol = activeInst?.currency_symbol || '$';
  const currentNavLabel = NAV_ITEMS.find((n) => n.key === activeModule)?.label || 'Workspace';

  const renderModule = () => {
    switch (activeModule) {
      case 'founder_dashboard':
        return (
          <FounderDashboardModule
            mode="overview"
            onEnterInstitution={(id) => {
              handleSelectInstitution(id);
              setActiveModule('dashboard');
            }}
            onInstitutionsChanged={refreshInstitutions}
          />
        );
      case 'institutions':
        return (
          <FounderDashboardModule
            mode="institutions"
            onEnterInstitution={(id) => {
              handleSelectInstitution(id);
              setActiveModule('dashboard');
            }}
            onInstitutionsChanged={refreshInstitutions}
          />
        );
      case 'dashboard':
        return <DashboardView mode="dashboard" tenantVersion={tenantVersion} />;
      case 'reports':
        return <DashboardView mode="reports" tenantVersion={tenantVersion} />;
      case 'students':
        return <StudentsModule tenantVersion={tenantVersion} canManage={hasPerm('students.manage')} />;
      case 'teachers':
        return <TeachersModule tenantVersion={tenantVersion} canManage={hasPerm('teachers.manage')} />;
      case 'staff':
        return <StaffModule tenantVersion={tenantVersion} canManage={hasPerm('staff.manage')} currencySymbol={currencySymbol} />;
      case 'attendance':
        return <AttendanceModule tenantVersion={tenantVersion} canMark={hasPerm('attendance.mark')} />;
      case 'fees':
        return <FinanceModule tenantVersion={tenantVersion} canManage={hasPerm('fees.manage')} currencySymbol={currencySymbol} />;
      case 'exams':
        return <ExamsModule tenantVersion={tenantVersion} canManage={hasPerm('exams.manage')} />;
      case 'timetable':
        return <TimetableModule tenantVersion={tenantVersion} canManage={hasPerm('timetable.manage')} />;
      case 'notices':
        return <CommunicationsModule tenantVersion={tenantVersion} canManage={hasPerm('notices.manage')} />;
      case 'library':
        return <LibraryModule tenantVersion={tenantVersion} canManage={hasPerm('library.manage')} />;
      case 'transport':
        return <TransportModule tenantVersion={tenantVersion} canManage={hasPerm('transport.manage')} currencySymbol={currencySymbol} />;
      case 'parents':
        return <ParentsModule tenantVersion={tenantVersion} canManage={hasPerm('parents.manage')} />;
      case 'certificates':
        return <CertificatesModule tenantVersion={tenantVersion} canManage={hasPerm('certificates.manage')} />;
      case 'governance':
        return <GovernanceModule user={user} institutions={institutions} tenantVersion={tenantVersion} />;
      case 'backups':
        return <BackupsAndHealthModule />;
      case 'settings':
        return (
          <SettingsModule
            user={user}
            theme={theme}
            onThemeChange={setTheme}
            onUserUpdated={setUser}
          />
        );
      default:
        return <DashboardView mode="dashboard" tenantVersion={tenantVersion} />;
    }
  };

  const renderSidebarLinks = (closeDrawer?: () => void) => {
    const sections: { id: NavItem['section']; title: string }[] = [
      ...(user.isFounder ? [{ id: 'founder' as const, title: 'Founder Control' }] : []),
      { id: 'institution', title: 'Institution Operations' },
      { id: 'governance', title: 'System & Security' },
    ];

    return (
      <div className="space-y-5">
        {sections.map((sec) => {
          const items = visibleNav.filter((i) => i.section === sec.id);
          if (items.length === 0) return null;
          return (
            <div key={sec.id}>
              <p className="px-3 mb-1.5 text-[11px] font-semibold tracking-wider text-slate-400 dark:text-slate-500">
                {sec.title}
              </p>
              <div className="space-y-0.5">
                {items.map((item) => {
                  const Icon = item.icon;
                  const active = activeModule === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => {
                        setActiveModule(item.key);
                        closeDrawer?.();
                      }}
                      className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                        active
                          ? 'bg-[#0B192C] dark:bg-[#132946] text-[#E8CC72] font-semibold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-[#D4AF37]' : 'text-slate-400'}`} />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#050B16] text-slate-900 dark:text-slate-100">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#060E1D] no-print">
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
          <BrandMark size={32} />
        </div>

        {/* Multi-Tenant Context Selector */}
        {institutions.length > 0 && (
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
            <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
              {user.isFounder ? 'Active Institution Tenant' : 'Assigned Institution'}
            </label>
            {user.isFounder ? (
              <select
                value={activeInstId ?? ''}
                onChange={(e) => handleSelectInstitution(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0B192C] px-2.5 py-1.5 text-xs font-medium text-slate-900 dark:text-white focus:border-[#D4AF37] focus:outline-none"
              >
                {institutions.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.name} ({inst.institution_code})
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                {activeInst?.name || user.institutionName}
              </p>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-3 py-4">{renderSidebarLinks()}</div>

        <div className="p-3 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between gap-2 px-2 py-1.5">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{user.fullName}</p>
              <p className="text-[11px] text-[#B89223] dark:text-[#D4AF37] truncate">{user.roleName}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              title="Sign out"
              className="p-2 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400 cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-72 max-w-[82vw] bg-white dark:bg-[#060E1D] h-full flex flex-col border-r border-slate-200 dark:border-slate-800 z-10">
            <div className="h-14 px-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
              <BrandMark size={28} compact />
              <button type="button" onClick={() => setMobileMenuOpen(false)} className="p-1.5 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            {user.isFounder && institutions.length > 0 && (
              <div className="p-3 border-b border-slate-200 dark:border-slate-800">
                <select
                  value={activeInstId ?? ''}
                  onChange={(e) => handleSelectInstitution(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0B192C] px-2.5 py-1.5 text-xs"
                >
                  {institutions.map((i) => (
                    <option key={i.id} value={i.id}>{i.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex-1 overflow-y-auto px-3 py-4">{renderSidebarLinks(() => setMobileMenuOpen(false))}</div>
            <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-medium truncate">{user.fullName}</span>
              <button type="button" onClick={handleLogout} className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 cursor-pointer">
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Shell */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-16 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#060E1D]/95 backdrop-blur px-4 sm:px-6 flex items-center justify-between gap-4 no-print">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer"
              aria-label="Open navigation"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 truncate">
              <span className="font-semibold text-slate-900 dark:text-white whitespace-nowrap">{currentNavLabel}</span>
              {activeInst && activeModule !== 'founder_dashboard' && activeModule !== 'institutions' && (
                <>
                  <span aria-hidden="true">/</span>
                  <span className="truncate">{activeInst.name}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <div className="hidden md:flex items-center relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3" />
              <input
                value={quickSearch}
                onChange={(e) => setQuickSearch(e.target.value)}
                placeholder="Filter modules..."
                className="w-44 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0B192C] pl-8 pr-3 py-1.5 text-xs focus:border-[#D4AF37] focus:outline-none"
              />
            </div>

            <PWAInstallButton />

            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Toggle color theme"
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-[#D4AF37]" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => setNotifOpen(!notifOpen)}
              aria-label="Notifications"
              className="relative p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#D4AF37] text-[#050B16] font-mono text-[10px] font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Notification Drawer */}
        {notifOpen && (
          <div className="fixed right-4 top-18 z-40 w-80 sm:w-96 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B192C] shadow-2xl overflow-hidden no-print">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="font-display text-sm font-bold">Notifications</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    await apiRequest('/api/communications/notifications/read-all', { method: 'POST' });
                    await loadNotifications();
                  }}
                  className="inline-flex items-center gap-1 text-xs text-[#B89223] dark:text-[#D4AF37] cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" /> Read all
                </button>
                <button type="button" onClick={() => setNotifOpen(false)} className="cursor-pointer"><X className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {notifications.length === 0 ? (
                <p className="p-6 text-center text-xs text-slate-500">All caught up.</p>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className={`p-3.5 text-xs ${n.is_read ? 'opacity-70' : 'bg-[#D4AF37]/5'}`}>
                    <p className="font-semibold text-slate-900 dark:text-white">{n.title}</p>
                    <p className="mt-0.5 text-slate-600 dark:text-slate-300 line-clamp-2">{n.message}</p>
                    <p className="mt-1 text-[11px] text-slate-400">{formatDateTime(n.created_at)}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Main Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-10 max-w-[1440px] w-full mx-auto">
          {/* One-time generated credentials banner after opt-in demo tenant initialization */}
          {provisionedCreds.length > 0 && (
            <div className="mb-6 rounded-xl border border-[#D4AF37]/50 bg-[#D4AF37]/10 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-sm font-bold text-slate-900 dark:text-[#E8CC72]">
                    One-Time Generated Institution Administrator Credentials
                  </h2>
                  <p className="mt-1 text-xs text-slate-700 dark:text-slate-300">
                    Record these randomly generated credentials now to test isolated Institution Admin logins. They are hashed with scrypt and will not be shown again.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setProvisionedCreds([])}
                  className="text-xs font-semibold underline cursor-pointer shrink-0"
                >
                  Dismiss
                </button>
              </div>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                {provisionedCreds.map((c) => (
                  <div key={c.institutionCode} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#060E1D] p-3 text-xs">
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {c.institutionName} ({c.institutionCode})
                    </p>
                    <p className="mt-1 font-mono text-slate-600 dark:text-slate-300">Email: {c.adminEmail}</p>
                    <p className="font-mono text-[#9A781B] dark:text-[#E8CC72]">Password: {c.adminTemporaryPassword}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {renderModule()}
        </main>

        {/* Mobile Bottom Navigation (Compact, <= 15% mobile height) */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 h-14 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#060E1D]/95 backdrop-blur grid grid-cols-5 no-print">
          {(user.isFounder
            ? [
                { key: 'founder_dashboard' as ModuleKey, label: 'Founder', icon: Crown },
                { key: 'institutions' as ModuleKey, label: 'Tenants', icon: Building2 },
                { key: 'students' as ModuleKey, label: 'Students', icon: GraduationCap },
                { key: 'fees' as ModuleKey, label: 'Fees', icon: Wallet },
                { key: 'backups' as ModuleKey, label: 'Backups', icon: Database },
              ]
            : [
                { key: 'dashboard' as ModuleKey, label: 'Home', icon: LayoutDashboard },
                { key: 'students' as ModuleKey, label: 'Students', icon: GraduationCap },
                { key: 'attendance' as ModuleKey, label: 'Attend', icon: ClipboardCheck },
                { key: 'fees' as ModuleKey, label: 'Fees', icon: Wallet },
                { key: 'reports' as ModuleKey, label: 'Reports', icon: BarChart3 },
              ]
          ).map((tab) => {
            const Icon = tab.icon;
            const active = activeModule === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveModule(tab.key)}
                className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium cursor-pointer ${
                  active ? 'text-[#B89223] dark:text-[#D4AF37]' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <OfflineIndicator />
    </div>
  );
}
