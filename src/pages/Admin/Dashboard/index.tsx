import { useEffect, useState } from 'react';
import { AdminLayout } from '../AdminLayout';
import { dashboardService, StatisticsDto } from '@services';
import { ApiError } from '@services/types/api.types';
import { useToast } from '@components/Toast/Toast';
import {
  ChartIcon,
  MoneyIcon,
  UsersIcon,
  PlaneIcon,
  CheckCircleIcon,
  XCircleIcon,
  CheckIcon,
  ClockIcon,
} from '@shared/icons/DashboardIcons';
import styles from './Dashboard.module.scss';

const AdminDashboard = () => {
  const [statistics, setStatistics] = useState<StatisticsDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { showError } = useToast();

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setIsLoading(true);
      const data = await dashboardService.getStatistics();
      setStatistics(data);
    } catch (err) {
      const apiError = err as ApiError;
      showError(
        typeof apiError.message === 'string'
          ? apiError.message
          : 'Failed to load statistics'
      );
      console.error('Error fetching statistics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Loading dashboard...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!statistics) {
    return (
      <AdminLayout>
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p>No statistics available</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles['dashboard']}>
        <h1>Admin Dashboard</h1>
        
        <div className={styles['stats-grid']}>
          <div className={styles['stat-card']}>
            <div className={styles['stat-icon']}>
              <ChartIcon size={40} color="#6366f1" />
            </div>
            <div className={styles['stat-content']}>
              <h3>Total Reservations</h3>
              <p className={styles['stat-value']}>{statistics.totalReservations}</p>
            </div>
          </div>

          <div className={styles['stat-card']}>
            <div className={styles['stat-icon']}>
              <MoneyIcon size={40} color="#10b981" />
            </div>
            <div className={styles['stat-content']}>
              <h3>Total Revenue</h3>
              <p className={styles['stat-value']}>{statistics.totalRevenue.toFixed(2)} MAD</p>
            </div>
          </div>

          <div className={styles['stat-card']}>
            <div className={styles['stat-icon']}>
              <UsersIcon size={40} color="#3b82f6" />
            </div>
            <div className={styles['stat-content']}>
              <h3>Total Users</h3>
              <p className={styles['stat-value']}>{statistics.totalUsers}</p>
            </div>
          </div>

          <div className={styles['stat-card']}>
            <div className={styles['stat-icon']}>
              <PlaneIcon size={40} color="#8b5cf6" />
            </div>
            <div className={styles['stat-content']}>
              <h3>Total Flights</h3>
              <p className={styles['stat-value']}>{statistics.totalFlights}</p>
            </div>
          </div>

          <div className={styles['stat-card']}>
            <div className={styles['stat-icon']}>
              <CheckCircleIcon size={40} color="#10b981" />
            </div>
            <div className={styles['stat-content']}>
              <h3>Active Reservations</h3>
              <p className={styles['stat-value']}>{statistics.activeReservations}</p>
            </div>
          </div>

          <div className={styles['stat-card']}>
            <div className={styles['stat-icon']}>
              <XCircleIcon size={40} color="#ef4444" />
            </div>
            <div className={styles['stat-content']}>
              <h3>Cancelled</h3>
              <p className={styles['stat-value']}>{statistics.cancelledReservations}</p>
            </div>
          </div>

          <div className={styles['stat-card']}>
            <div className={styles['stat-icon']}>
              <CheckIcon size={40} color="#059669" />
            </div>
            <div className={styles['stat-content']}>
              <h3>Completed</h3>
              <p className={styles['stat-value']}>{statistics.completedReservations}</p>
            </div>
          </div>

          <div className={styles['stat-card']}>
            <div className={styles['stat-icon']}>
              <ClockIcon size={40} color="#f59e0b" />
            </div>
            <div className={styles['stat-content']}>
              <h3>Pending Payments</h3>
              <p className={styles['stat-value']}>{statistics.pendingPayments}</p>
            </div>
          </div>
        </div>

        <div className={styles['charts-section']}>
          <div className={styles['chart-card']}>
            <h2>Monthly Revenue</h2>
            <div className={styles['revenue-list']}>
              {statistics.monthlyRevenue.length > 0 ? (
                statistics.monthlyRevenue.map((item, index) => (
                  <div key={index} className={styles['revenue-item']}>
                    <span>{item.month}</span>
                    <span className={styles['revenue-amount']}>
                      {item.revenue.toFixed(2)} MAD
                    </span>
                  </div>
                ))
              ) : (
                <p style={{ color: '#666', padding: '1rem' }}>No revenue data available</p>
              )}
            </div>
          </div>

          <div className={styles['chart-card']}>
            <h2>Popular Destinations</h2>
            <div className={styles['destinations-list']}>
              {statistics.popularDestinations.length > 0 ? (
                statistics.popularDestinations.map((item, index) => (
                  <div key={index} className={styles['destination-item']}>
                    <span>{item.airport}</span>
                    <span className={styles['destination-count']}>{item.count} bookings</span>
                  </div>
                ))
              ) : (
                <p style={{ color: '#666', padding: '1rem' }}>No destination data available</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;

