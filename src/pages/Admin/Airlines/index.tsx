import { useEffect, useState } from 'react';
import { AdminLayout } from '../AdminLayout';
import { airlinesService, Airline } from '@services';
import { ApiError } from '@services/types/api.types';
import { useToast } from '@components/Toast/Toast';
import Button from '@shared/ui/Button';
import { TextField } from '@shared/ui/Input';
import { Modal } from '@shared/ui/Modal/Modal';
import styles from './Airlines.module.scss';

const AdminAirlines = () => {
  const [airlines, setAirlines] = useState<Airline[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAirline, setEditingAirline] = useState<Airline | null>(null);
  const { showSuccess, showError } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    country: '',
    logo: '',
    isActive: true,
  });

  useEffect(() => {
    fetchAirlines();
  }, []);

  const fetchAirlines = async () => {
    try {
      setIsLoading(true);
      const data = await airlinesService.getAll();
      setAirlines(data);
    } catch (err) {
      const apiError = err as ApiError;
      showError(
        typeof apiError.message === 'string'
          ? apiError.message
          : 'Failed to load airlines'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingAirline(null);
    setFormData({
      name: '',
      code: '',
      country: '',
      logo: '',
      isActive: true,
    });
    setShowModal(true);
  };

  const handleEdit = (airline: Airline) => {
    setEditingAirline(airline);
    setFormData({
      name: airline.name,
      code: airline.code,
      country: airline.country || '',
      logo: airline.logo || '',
      isActive: airline.isActive,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    try {
      if (editingAirline) {
        await airlinesService.update(editingAirline.id, formData);
        showSuccess('Airline updated successfully');
      } else {
        await airlinesService.create(formData);
        showSuccess('Airline created successfully');
      }
      setShowModal(false);
      fetchAirlines();
    } catch (err) {
      const apiError = err as ApiError;
      showError(
        typeof apiError.message === 'string'
          ? apiError.message
          : 'Failed to save airline'
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this airline?')) return;

    try {
      await airlinesService.delete(id);
      showSuccess('Airline deleted successfully');
      fetchAirlines();
    } catch (err) {
      const apiError = err as ApiError;
      showError(
        typeof apiError.message === 'string'
          ? apiError.message
          : 'Failed to delete airline'
      );
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Loading airlines...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles['airlines-page']}>
        <div className={styles['page-header']}>
          <h1>Manage Airlines</h1>
          <Button onClick={handleCreate}>+ Add Airline</Button>
        </div>

        <div className={styles['table-container']}>
          <table className={styles['data-table']}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Code</th>
                <th>Country</th>
                <th>Logo</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {airlines.map((airline) => (
                <tr key={airline.id}>
                  <td>{airline.name}</td>
                  <td>{airline.code}</td>
                  <td>{airline.country || '-'}</td>
                  <td>{airline.logo || '-'}</td>
                  <td>
                    <span
                      className={`${styles['status-badge']} ${
                        airline.isActive ? styles['active'] : styles['inactive']
                      }`}
                    >
                      {airline.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className={styles['action-buttons']}>
                      <button
                        onClick={() => handleEdit(airline)}
                        className={styles['edit-btn']}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(airline.id)}
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

        <Modal opened={showModal} setOpened={setShowModal}>
          <div className={styles['airline-form']}>
            <h2>{editingAirline ? 'Edit Airline' : 'Create Airline'}</h2>
            
            <div className={styles['form-section']}>
              <h3>Airline Information</h3>
              <div className={styles['form-grid']}>
              <TextField
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <TextField
                label="Code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                required
                maxLength={10}
              />
              <TextField
                label="Country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              />
              <TextField
                label="Logo URL"
                value={formData.logo}
                onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                placeholder="/airlines/airline-name.svg"
              />
              </div>
            </div>

            <div className={styles['form-section']}>
              <h3>Status</h3>
              <div className={styles['form-grid']}>
              <div>
                <label>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                  />
                  Active Airline
                </label>
              </div>
              </div>
            </div>
            <div className={styles['form-actions']}>
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSubmit}>
                {editingAirline ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default AdminAirlines;

