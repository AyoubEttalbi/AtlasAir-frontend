import { useEffect, useState } from 'react';
import { AdminLayout } from '../AdminLayout';
import { paymentsService, Payment, PaymentStatus } from '@services';
import { ApiError } from '@services/types/api.types';
import { useToast } from '@components/Toast/Toast';
import Button from '@shared/ui/Button';
import { Modal } from '@shared/ui/Modal/Modal';
import styles from './Payments.module.scss';

const AdminPayments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [newStatus, setNewStatus] = useState<PaymentStatus>(PaymentStatus.PENDING);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setIsLoading(true);
      const data = await paymentsService.getAll();
      // Filter out any payments with null reservations (shouldn't happen, but handle gracefully)
      setPayments(data.filter(p => p.reservation !== null && p.reservation !== undefined));
    } catch (err) {
      const apiError = err as ApiError;
      showError(
        typeof apiError.message === 'string'
          ? apiError.message
          : 'Failed to load payments'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = (payment: Payment) => {
    setSelectedPayment(payment);
    setNewStatus(payment.status);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!selectedPayment) return;

    try {
      await paymentsService.updateStatus(selectedPayment.id, newStatus);
      showSuccess('Payment status updated successfully');
      setShowModal(false);
      fetchPayments();
    } catch (err) {
      const apiError = err as ApiError;
      showError(
        typeof apiError.message === 'string'
          ? apiError.message
          : 'Failed to update payment status'
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
          <p>Loading payments...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles['payments-page']}>
        <h1>Manage Payments</h1>

        <div className={styles['table-container']}>
          <table className={styles['data-table']}>
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Booking Reference</th>
                <th>Amount</th>
                <th>Currency</th>
                <th>Payment Method</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td>{payment.transactionId}</td>
                  <td>{payment.reservation?.bookingReference || 'N/A'}</td>
                  <td>{payment.amount.toFixed(2)}</td>
                  <td>{payment.currency}</td>
                  <td>{payment.paymentMethod}</td>
                  <td>
                    <span
                      className={`${styles['status-badge']} ${
                        payment.status === PaymentStatus.COMPLETED
                          ? styles['completed']
                          : payment.status === PaymentStatus.FAILED
                          ? styles['failed']
                          : payment.status === PaymentStatus.REFUNDED
                          ? styles['refunded']
                          : styles['pending']
                      }`}
                    >
                      {payment.status}
                    </span>
                  </td>
                  <td>{formatDate(payment.createdAt)}</td>
                  <td>
                    <button
                      onClick={() => handleStatusUpdate(payment)}
                      className={styles['update-btn']}
                    >
                      Update Status
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Modal opened={showModal} setOpened={setShowModal}>
          <div className={styles['status-form']}>
            <h2>Update Payment Status</h2>
            {selectedPayment && (
              <>
                <p>
                  <strong>Transaction ID:</strong> {selectedPayment.transactionId}
                </p>
                <p>
                  <strong>Amount:</strong> {selectedPayment.amount} {selectedPayment.currency}
                </p>
                <div style={{ marginTop: '1.5rem' }}>
                  <label>New Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as PaymentStatus)}
                    style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
                  >
                    <option value={PaymentStatus.PENDING}>PENDING</option>
                    <option value={PaymentStatus.COMPLETED}>COMPLETED</option>
                    <option value={PaymentStatus.FAILED}>FAILED</option>
                    <option value={PaymentStatus.REFUNDED}>REFUNDED</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  <Button variant="secondary" onClick={() => setShowModal(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" onClick={handleSubmit}>
                    Update
                  </Button>
                </div>
              </>
            )}
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default AdminPayments;

