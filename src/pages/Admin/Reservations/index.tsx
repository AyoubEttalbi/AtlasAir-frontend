import { useEffect, useState } from 'react';
import { AdminLayout } from '../AdminLayout';
import { reservationsService, Reservation } from '@services';
import { ApiError } from '@services/types/api.types';
import { useToast } from '@components/Toast/Toast';
import Button from '@shared/ui/Button';
import styles from './Reservations.module.scss';

const AdminReservations = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      setIsLoading(true);
      const data = await reservationsService.getAll();
      setReservations(data);
    } catch (err) {
      const apiError = err as ApiError;
      showError(
        typeof apiError.message === 'string'
          ? apiError.message
          : 'Failed to load reservations'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this reservation?')) return;

    try {
      await reservationsService.cancel(id);
      showSuccess('Reservation cancelled successfully');
      fetchReservations();
    } catch (err) {
      const apiError = err as ApiError;
      showError(
        typeof apiError.message === 'string'
          ? apiError.message
          : 'Failed to cancel reservation'
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this reservation?')) return;

    try {
      await reservationsService.delete(id);
      showSuccess('Reservation deleted successfully');
      fetchReservations();
    } catch (err) {
      const apiError = err as ApiError;
      showError(
        typeof apiError.message === 'string'
          ? apiError.message
          : 'Failed to delete reservation'
      );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Loading reservations...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles['reservations-page']}>
        <h1>Manage Reservations</h1>

        <div className={styles['table-container']}>
          <table className={styles['data-table']}>
            <thead>
              <tr>
                <th>Booking Reference</th>
                <th>User</th>
                <th>Flight</th>
                <th>Passenger</th>
                <th>Class</th>
                <th>Price</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((reservation) => (
                <tr key={reservation.id}>
                  <td>{reservation.bookingReference}</td>
                  <td>
                    {reservation.user.firstName} {reservation.user.lastName}
                    <br />
                    <small style={{ color: '#666' }}>{reservation.user.email}</small>
                  </td>
                  <td>
                    {reservation.flight.flightNumber}
                    <br />
                    <small style={{ color: '#666' }}>
                      {reservation.flight.departureAirport.code} →{' '}
                      {reservation.flight.arrivalAirport.code}
                    </small>
                  </td>
                  <td>
                    {reservation.passengerFirstName} {reservation.passengerLastName}
                  </td>
                  <td>{reservation.flightClass}</td>
                  <td>{reservation.totalPrice.toFixed(2)} MAD</td>
                  <td>
                    <span
                      className={`${styles['status-badge']} ${reservation.status === 'CONFIRMED'
                          ? styles['confirmed']
                          : reservation.status === 'CANCELLED'
                            ? styles['cancelled']
                            : styles['pending']
                        }`}
                    >
                      {reservation.status}
                    </span>
                  </td>
                  <td>{formatDate(reservation.createdAt)}</td>
                  <td>
                    <div className={styles['action-buttons']}>
                      {reservation.status === 'CONFIRMED' && (
                        <button
                          onClick={() => handleCancel(reservation.id)}
                          className={styles['cancel-btn']}
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(reservation.id)}
                        className={styles['delete-btn']}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminReservations;

