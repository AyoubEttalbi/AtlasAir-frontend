import { useEffect, useState } from 'react';
import { AdminLayout } from '../AdminLayout';
import { flightsService } from '@services';
import { airportsService, airlinesService } from '@services';
import { Airport, Airline, FlightResponse } from '@services/types/api.types';
import { ApiError } from '@services/types/api.types';
import { useToast } from '@components/Toast/Toast';
import Button from '@shared/ui/Button';
import { TextField } from '@shared/ui/Input';
import { Modal } from '@shared/ui/Modal/Modal';
import styles from './Flights.module.scss';

const AdminFlights = () => {
  const [flights, setFlights] = useState<FlightResponse[]>([]);
  const [airports, setAirports] = useState<Airport[]>([]);
  const [airlines, setAirlines] = useState<Airline[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFlight, setEditingFlight] = useState<FlightResponse | null>(null);
  const { showSuccess, showError } = useToast();

  const [formData, setFormData] = useState({
    flightNumber: '',
    airlineId: '',
    departureAirportId: '',
    arrivalAirportId: '',
    departureTime: '',
    arrivalTime: '',
    durationMinutes: 0,
    stops: 0,
    economyPrice: 0,
    businessPrice: 0,
    firstClassPrice: 0,
    economySeats: 180,
    businessSeats: 50,
    firstClassSeats: 20,
    isActive: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [flightsData, airportsData, airlinesData] = await Promise.all([
        flightsService.getAllRaw(),
        airportsService.getAll(),
        airlinesService.getAll(),
      ]);
      
      setFlights(flightsData);
      setAirports(airportsData);
      setAirlines(airlinesData);
    } catch (err) {
      const apiError = err as ApiError;
      showError(
        typeof apiError.message === 'string'
          ? apiError.message
          : 'Failed to load data'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingFlight(null);
    setFormData({
      flightNumber: '',
      airlineId: '',
      departureAirportId: '',
      arrivalAirportId: '',
      departureTime: '',
      arrivalTime: '',
      durationMinutes: 0,
      stops: 0,
      economyPrice: 0,
      businessPrice: 0,
      firstClassPrice: 0,
      economySeats: 180,
      businessSeats: 50,
      firstClassSeats: 20,
      isActive: true,
    });
    setShowModal(true);
  };

  const handleEdit = (flight: FlightResponse) => {
    setEditingFlight(flight);
    setFormData({
      flightNumber: flight.flightNumber,
      airlineId: flight.airline.id,
      departureAirportId: flight.departureAirport.id,
      arrivalAirportId: flight.arrivalAirport.id,
      departureTime: new Date(flight.departureTime).toISOString().slice(0, 16),
      arrivalTime: new Date(flight.arrivalTime).toISOString().slice(0, 16),
      durationMinutes: flight.durationMinutes,
      stops: flight.stops,
      economyPrice: flight.economyPrice,
      businessPrice: flight.businessPrice,
      firstClassPrice: flight.firstClassPrice,
      economySeats: flight.economySeats,
      businessSeats: flight.businessSeats,
      firstClassSeats: flight.firstClassSeats,
      isActive: flight.isActive,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    try {
      if (editingFlight) {
        await flightsService.update(editingFlight.id, formData as any);
        showSuccess('Flight updated successfully');
      } else {
        await flightsService.create(formData as any);
        showSuccess('Flight created successfully');
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      const apiError = err as ApiError;
      showError(
        typeof apiError.message === 'string'
          ? apiError.message
          : 'Failed to save flight'
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this flight?')) return;

    try {
      await flightsService.delete(id);
      showSuccess('Flight deleted successfully');
      fetchData();
    } catch (err) {
      const apiError = err as ApiError;
      showError(
        typeof apiError.message === 'string'
          ? apiError.message
          : 'Failed to delete flight'
      );
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Loading flights...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles['flights-page']}>
        <div className={styles['page-header']}>
          <h1>Manage Flights</h1>
          <Button onClick={handleCreate}>+ Add Flight</Button>
        </div>

        <div className={styles['table-container']}>
          <table className={styles['data-table']}>
            <thead>
              <tr>
                <th>Flight Number</th>
                <th>Airline</th>
                <th>Route</th>
                <th>Departure</th>
                <th>Arrival</th>
                <th>Duration</th>
                <th>Economy Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {flights.map((flight) => (
                <tr key={flight.id}>
                  <td>{flight.flightNumber}</td>
                  <td>{flight.airline.name}</td>
                  <td>
                    {flight.departureAirport.code} → {flight.arrivalAirport.code}
                  </td>
                  <td>{new Date(flight.departureTime).toLocaleString()}</td>
                  <td>{new Date(flight.arrivalTime).toLocaleString()}</td>
                  <td>{flight.durationMinutes} min</td>
                  <td>{flight.economyPrice} MAD</td>
                  <td>
                    <span
                      className={`${styles['status-badge']} ${
                        flight.isActive ? styles['active'] : styles['inactive']
                      }`}
                    >
                      {flight.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className={styles['action-buttons']}>
                      <button
                        onClick={() => handleEdit(flight)}
                        className={styles['edit-btn']}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(flight.id)}
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
          <div className={styles['flight-form']}>
            <h2>{editingFlight ? 'Edit Flight' : 'Create Flight'}</h2>
            
            <div className={styles['form-section']}>
              <h3>Basic Information</h3>
              <div className={styles['form-grid']}>
              <TextField
                label="Flight Number"
                value={formData.flightNumber}
                onChange={(e) =>
                  setFormData({ ...formData, flightNumber: e.target.value })
                }
                required
              />
              <div>
                <label>Airline</label>
                <select
                  value={formData.airlineId}
                  onChange={(e) =>
                    setFormData({ ...formData, airlineId: e.target.value })
                  }
                  required
                >
                  <option value="">Select Airline</option>
                  {airlines.map((airline) => (
                    <option key={airline.id} value={airline.id}>
                      {airline.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Departure Airport</label>
                <select
                  value={formData.departureAirportId}
                  onChange={(e) =>
                    setFormData({ ...formData, departureAirportId: e.target.value })
                  }
                  required
                >
                  <option value="">Select Airport</option>
                  {airports.map((airport) => (
                    <option key={airport.id} value={airport.id}>
                      {airport.code} - {airport.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Arrival Airport</label>
                <select
                  value={formData.arrivalAirportId}
                  onChange={(e) =>
                    setFormData({ ...formData, arrivalAirportId: e.target.value })
                  }
                  required
                >
                  <option value="">Select Airport</option>
                  {airports.map((airport) => (
                    <option key={airport.id} value={airport.id}>
                      {airport.code} - {airport.name}
                    </option>
                  ))}
                </select>
              </div>
              <TextField
                label="Departure Time"
                type="datetime-local"
                value={formData.departureTime}
                onChange={(e) =>
                  setFormData({ ...formData, departureTime: e.target.value })
                }
                required
              />
              <TextField
                label="Arrival Time"
                type="datetime-local"
                value={formData.arrivalTime}
                onChange={(e) =>
                  setFormData({ ...formData, arrivalTime: e.target.value })
                }
                required
              />
              <TextField
                label="Duration (minutes)"
                type="number"
                value={formData.durationMinutes}
                onChange={(e) =>
                  setFormData({ ...formData, durationMinutes: parseInt(e.target.value) || 0 })
                }
                required
              />
              <TextField
                label="Stops"
                type="number"
                value={formData.stops}
                onChange={(e) =>
                  setFormData({ ...formData, stops: parseInt(e.target.value) || 0 })
                }
              />
              </div>
            </div>

            <div className={styles['form-section']}>
              <h3>Pricing</h3>
              <div className={styles['form-grid']}>
              <TextField
                label="Economy Price (MAD)"
                type="number"
                step="0.01"
                value={formData.economyPrice}
                onChange={(e) =>
                  setFormData({ ...formData, economyPrice: parseFloat(e.target.value) || 0 })
                }
                required
              />
              <TextField
                label="Business Price (MAD)"
                type="number"
                step="0.01"
                value={formData.businessPrice}
                onChange={(e) =>
                  setFormData({ ...formData, businessPrice: parseFloat(e.target.value) || 0 })
                }
                required
              />
              <TextField
                label="First Class Price (MAD)"
                type="number"
                step="0.01"
                value={formData.firstClassPrice}
                onChange={(e) =>
                  setFormData({ ...formData, firstClassPrice: parseFloat(e.target.value) || 0 })
                }
                required
              />
              </div>
            </div>

            <div className={styles['form-section']}>
              <h3>Seating Capacity</h3>
              <div className={styles['form-grid']}>
              <TextField
                label="Economy Seats"
                type="number"
                value={formData.economySeats}
                onChange={(e) =>
                  setFormData({ ...formData, economySeats: parseInt(e.target.value) || 0 })
                }
              />
              <TextField
                label="Business Seats"
                type="number"
                value={formData.businessSeats}
                onChange={(e) =>
                  setFormData({ ...formData, businessSeats: parseInt(e.target.value) || 0 })
                }
              />
              <TextField
                label="First Class Seats"
                type="number"
                value={formData.firstClassSeats}
                onChange={(e) =>
                  setFormData({ ...formData, firstClassSeats: parseInt(e.target.value) || 0 })
                }
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
                  Active Flight
                </label>
              </div>
              </div>
            </div>
            <div className={styles['form-actions']}>
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSubmit}>
                {editingFlight ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default AdminFlights;
