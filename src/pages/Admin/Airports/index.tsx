import { useEffect, useState } from 'react';
import { AdminLayout } from '../AdminLayout';
import { airportsService, Airport } from '@services';
import { ApiError } from '@services/types/api.types';
import { useToast } from '@components/Toast/Toast';
import Button from '@shared/ui/Button';
import { TextField } from '@shared/ui/Input';
import { Modal } from '@shared/ui/Modal/Modal';
import styles from './Airports.module.scss';

const AdminAirports = () => {
  const [airports, setAirports] = useState<Airport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAirport, setEditingAirport] = useState<Airport | null>(null);
  const { showSuccess, showError } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    city: '',
    country: '',
    latitude: '',
    longitude: '',
    isActive: true,
  });

  useEffect(() => {
    fetchAirports();
  }, []);

  const fetchAirports = async () => {
    try {
      setIsLoading(true);
      const data = await airportsService.getAll();
      setAirports(data);
    } catch (err) {
      const apiError = err as ApiError;
      showError(
        typeof apiError.message === 'string'
          ? apiError.message
          : 'Failed to load airports'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingAirport(null);
    setFormData({
      name: '',
      code: '',
      city: '',
      country: '',
      latitude: '',
      longitude: '',
      isActive: true,
    });
    setShowModal(true);
  };

  const handleEdit = (airport: Airport) => {
    setEditingAirport(airport);
    setFormData({
      name: airport.name,
      code: airport.code,
      city: airport.city,
      country: airport.country,
      latitude: airport.latitude?.toString() || '',
      longitude: airport.longitude?.toString() || '',
      isActive: airport.isActive,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    try {
      const submitData = {
        ...formData,
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
      };

      if (editingAirport) {
        await airportsService.update(editingAirport.id, submitData);
        showSuccess('Airport updated successfully');
      } else {
        await airportsService.create(submitData);
        showSuccess('Airport created successfully');
      }
      setShowModal(false);
      fetchAirports();
    } catch (err) {
      const apiError = err as ApiError;
      showError(
        typeof apiError.message === 'string'
          ? apiError.message
          : 'Failed to save airport'
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this airport?')) return;

    try {
      await airportsService.delete(id);
      showSuccess('Airport deleted successfully');
      fetchAirports();
    } catch (err) {
      const apiError = err as ApiError;
      showError(
        typeof apiError.message === 'string'
          ? apiError.message
          : 'Failed to delete airport'
      );
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Loading airports...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles['airports-page']}>
        <div className={styles['page-header']}>
          <h1>Manage Airports</h1>
          <Button onClick={handleCreate}>+ Add Airport</Button>
        </div>

        <div className={styles['table-container']}>
          <table className={styles['data-table']}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Code</th>
                <th>City</th>
                <th>Country</th>
                <th>Coordinates</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {airports.map((airport) => (
                <tr key={airport.id}>
                  <td>{airport.name}</td>
                  <td>{airport.code}</td>
                  <td>{airport.city}</td>
                  <td>{airport.country}</td>
                  <td>
                    {airport.latitude && airport.longitude
                      ? `${airport.latitude.toFixed(4)}, ${airport.longitude.toFixed(4)}`
                      : '-'}
                  </td>
                  <td>
                    <span
                      className={`${styles['status-badge']} ${
                        airport.isActive ? styles['active'] : styles['inactive']
                      }`}
                    >
                      {airport.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className={styles['action-buttons']}>
                      <button
                        onClick={() => handleEdit(airport)}
                        className={styles['edit-btn']}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(airport.id)}
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
          <div className={styles['airport-form']}>
            <h2>{editingAirport ? 'Edit Airport' : 'Create Airport'}</h2>
            
            <div className={styles['form-section']}>
              <h3>Basic Information</h3>
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
                label="City"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                required
              />
              <TextField
                label="Country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                required
              />
              <TextField
                label="Latitude"
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                placeholder="e.g., 40.7128"
              />
              <TextField
                label="Longitude"
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                placeholder="e.g., -74.0060"
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
                  Active Airport
                </label>
              </div>
              </div>
            </div>
            <div className={styles['form-actions']}>
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSubmit}>
                {editingAirport ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default AdminAirports;

