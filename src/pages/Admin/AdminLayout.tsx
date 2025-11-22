import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@context/AuthContext';
import { Header } from '@shared/layout/Header/Header';
import {
  Sidebar,
  Menu,
  MenuItem,
  ProSidebarProvider,
} from 'react-pro-sidebar';
import {
  DashboardIcon,
  FlightsIcon,
  AirlinesIcon,
  AirportsIcon,
  UsersIcon,
  ReservationsIcon,
  PaymentsIcon,
  HomeIcon,
} from '@shared/icons/SidebarIcons';
import styles from './AdminLayout.module.scss';

interface AdminLayoutProps {
  children: ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    { path: '/admin', label: 'Dashboard', icon: <DashboardIcon /> },
    { path: '/admin/flights', label: 'Flights', icon: <FlightsIcon /> },
    { path: '/admin/airlines', label: 'Airlines', icon: <AirlinesIcon /> },
    { path: '/admin/airports', label: 'Airports', icon: <AirportsIcon /> },
    { path: '/admin/users', label: 'Users', icon: <UsersIcon /> },
    { path: '/admin/reservations', label: 'Reservations', icon: <ReservationsIcon /> },
    { path: '/admin/payments', label: 'Payments', icon: <PaymentsIcon /> },
  ];

  return (
    <ProSidebarProvider>
      <div className={styles['admin-layout']}>
        <Header variant="basic" />
        <div className={styles['admin-container']}>
          <Sidebar
            collapsed={collapsed}
            breakPoint="md"
            className={styles['pro-sidebar']}
          >
          <div className={styles['sidebar-header']}>
            {!collapsed && (
              <>
                <h2>Admin Panel</h2>
                <p className={styles['admin-user']}>
                  {user?.firstName} {user?.lastName}
                </p>
              </>
            )}
            <button
              className={styles['collapse-btn']}
              onClick={() => setCollapsed(!collapsed)}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {collapsed ? (
                  <path d="M9 18L15 12L9 6" />
                ) : (
                  <path d="M15 18L9 12L15 6" />
                )}
              </svg>
            </button>
          </div>
          <Menu>
            {menuItems.map((item) => (
              <MenuItem
                key={item.path}
                icon={item.icon}
                active={location.pathname === item.path}
                onClick={() => navigate(item.path)}
              >
                {item.label}
              </MenuItem>
            ))}
            <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #e0e0e0' }}>
              <MenuItem
                icon={<HomeIcon />}
                onClick={() => navigate('/')}
              >
                Back to Site
              </MenuItem>
            </div>
          </Menu>
        </Sidebar>
        <main className={styles['admin-content']}>{children}</main>
      </div>
    </div>
    </ProSidebarProvider>
  );
};

