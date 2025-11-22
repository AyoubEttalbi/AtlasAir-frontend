import { useEffect, useState } from 'react';
import { useAuth } from '@context/AuthContext';
import { reservationsService, ticketsService, api, Reservation } from '@services';
import generateTicketPdf from '@/util/generateTicketPdf';
import { ApiError } from '@services/types/api.types';
import Button from '@shared/ui/Button';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@components/Toast/Toast';
import styles from './MyBookings.module.scss';

const MyBookings = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [ticketsMap, setTicketsMap] = useState<Record<string, any | 'loading' | null>>({});

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }

    fetchReservations();
  }, [isAuthenticated, navigate]);

  const fetchReservations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await reservationsService.getMyReservations();
      setReservations(data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(
        typeof apiError.message === 'string'
          ? apiError.message
          : 'Failed to load reservations'
      );
      console.error('Error fetching reservations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async (reservationId: string) => {
    if (!confirm('Are you sure you want to cancel this reservation?')) {
      return;
    }

    try {
      setCancellingId(reservationId);
      await reservationsService.cancel(reservationId);
      showSuccess('Reservation cancelled successfully');
      // Refresh reservations
      await fetchReservations();
    } catch (err) {
      const apiError = err as ApiError;
      showError(
        typeof apiError.message === 'string'
          ? apiError.message
          : 'Failed to cancel reservation'
      );
      console.error('Error cancelling reservation:', err);
    } finally {
      setCancellingId(null);
    }
  };

  const handleViewTicket = async (reservationId: string) => {
    // if already loading or loaded, open if available
    const current = ticketsMap[reservationId];
    if (current === 'loading') return;

    if (current && current.fichierPDF) {
      const filePath = current.fichierPDF || current.reservation?.ticketPdfPath;
      const fileUrl = filePath
        ? filePath.startsWith('http')
          ? filePath
          : `${(api && api.defaults && api.defaults.baseURL) ? api.defaults.baseURL.replace(/\/$/, '') : ''}/${filePath.replace(/^\/+/, '')}`
        : null;
      if (fileUrl) window.open(fileUrl, '_blank', 'noopener');
      return;
    }

    // mark loading
    setTicketsMap((m) => ({ ...m, [reservationId]: 'loading' }));
    try {
      const ticket = await ticketsService.getByReservation(reservationId);
      setTicketsMap((m) => ({ ...m, [reservationId]: ticket || null }));

      if (ticket) {
        const filePath = ticket.fichierPDF || ticket.reservation?.ticketPdfPath;
        const fileUrl = filePath
          ? filePath.startsWith('http')
            ? filePath
            : `${(api && api.defaults && api.defaults.baseURL) ? api.defaults.baseURL.replace(/\/$/, '') : ''}/${filePath.replace(/^\/+/, '')}`
          : null;
        if (fileUrl) window.open(fileUrl, '_blank', 'noopener');
      } else {
        // no ticket yet — try to generate client-side PDF from reservation data
        try {
          const reservation = await reservationsService.getById(reservationId);
          const pdfData = {
            numeroBillet: reservation.bookingReference || `RES-${reservation.id.slice(0, 6)}`,
            dateEmission: new Date().toISOString(),
            bookingReference: reservation.bookingReference,
            passengerFirstName: reservation.passengerFirstName,
            passengerLastName: reservation.passengerLastName,
            passengerPassport: reservation.passengerPassport,
            passengerDateOfBirth: reservation.passengerDateOfBirth,
            flightNumber: reservation.flight?.flightNumber,
            airlineName: reservation.flight?.airline?.name,
            departureAirportCode: reservation.flight?.departureAirport?.code,
            departureAirportName: reservation.flight?.departureAirport?.name,
            departureCity: reservation.flight?.departureAirport?.city,
            departureTime: reservation.flight?.departureTime,
            arrivalAirportCode: reservation.flight?.arrivalAirport?.code,
            arrivalAirportName: reservation.flight?.arrivalAirport?.name,
            arrivalCity: reservation.flight?.arrivalAirport?.city,
            arrivalTime: reservation.flight?.arrivalTime,
            flightClass: reservation.flightClass,
            totalPrice: reservation.totalPrice,
          };
          try {
            const blob = await generateTicketPdf(pdfData as any, `ticket-${reservation.bookingReference || reservation.id}.pdf`, { autoDownload: false });
            if (blob instanceof Blob) {
              const url = URL.createObjectURL(blob);
              window.open(url, '_blank');
              setTimeout(() => URL.revokeObjectURL(url), 60000);
            }
          } catch (e) {
            console.error('Error generating ticket PDF from reservation', e);
            alert('Ticket not available yet. It may be sent by email shortly.');
          }
        } catch (e) {
          console.error('Error fetching reservation for PDF generation', e);
          alert('Ticket not available yet. It may be sent by email shortly.');
        }
      }
    } catch (err) {
      console.error('Error fetching ticket', err);
      setTicketsMap((m) => ({ ...m, [reservationId]: null }));
      alert('Failed to load ticket. Try again later.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div>
        <div className="page-container" style={{ padding: '2rem', textAlign: 'center' }}>
          <p>Loading your bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-container" style={{ padding: '2rem' }}>
        <h1 style={{ marginBottom: '2rem' }}>My Bookings</h1>

        {error && (
          <div style={{
            padding: '1rem',
            background: '#fee',
            color: '#c33',
            borderRadius: '4px',
            marginBottom: '1rem'
          }}>
            {error}
          </div>
        )}

        {reservations.length === 0 && !error && (
          <div style={{
            padding: '3rem',
            textAlign: 'center',
            background: '#f5f5f5',
            borderRadius: '8px'
          }}>
            <h3>No bookings found</h3>
            <p style={{ color: '#666', marginTop: '0.5rem' }}>
              You haven't made any reservations yet.
            </p>
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/flights')}
              style={{ marginTop: '1.5rem' }}
            >
              Search Flights
            </Button>
          </div>
        )}

        {reservations.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {reservations.map((reservation) => (
              <div
                key={reservation.id}
                style={{
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  background: 'white'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ marginBottom: '0.5rem' }}>
                      {reservation.flight.airline.name} - {reservation.flight.flightNumber}
                    </h3>
                    <p style={{ color: '#666', fontSize: '0.9rem' }}>
                      Booking Reference: <strong>{reservation.bookingReference}</strong>
                    </p>
                  </div>
                  <div style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '4px',
                    background: reservation.status === 'CONFIRMED' ? '#dfd' : '#fdd',
                    color: reservation.status === 'CONFIRMED' ? '#3a3' : '#c33',
                    fontSize: '0.85rem',
                    fontWeight: 'bold'
                  }}>
                    {reservation.status}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>From</p>
                    <p style={{ fontWeight: 'bold' }}>
                      {reservation.flight.departureAirport.code} - {reservation.flight.departureAirport.city}
                    </p>
                    <p style={{ fontSize: '0.9rem', color: '#666' }}>
                      {formatDate(reservation.flight.departureTime)} at {formatTime(reservation.flight.departureTime)}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>To</p>
                    <p style={{ fontWeight: 'bold' }}>
                      {reservation.flight.arrivalAirport.code} - {reservation.flight.arrivalAirport.city}
                    </p>
                    <p style={{ fontSize: '0.9rem', color: '#666' }}>
                      {formatDate(reservation.flight.arrivalTime)} at {formatTime(reservation.flight.arrivalTime)}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid #eee' }}>
                  <div>
                    <p style={{ fontSize: '0.85rem', color: '#666' }}>Passenger</p>
                    <p style={{ fontWeight: 'bold' }}>
                      {reservation.passengerFirstName} {reservation.passengerLastName}
                    </p>
                    <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
                      Class: {reservation.flightClass} | Total: {reservation.totalPrice.toFixed(2)} MAD
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {reservation.status === 'CONFIRMED' && (
                      <>
                        <Button
                          variant="secondary"
                          size="md"
                          onClick={() => handleViewTicket(reservation.id)}
                          disabled={ticketsMap[reservation.id] === 'loading'}
                        >
                          {ticketsMap[reservation.id] === 'loading' ? 'Loading...' : 'View Ticket'}
                        </Button>

                        <Button
                          variant="secondary"
                          size="md"
                          onClick={() => handleCancel(reservation.id)}
                          disabled={cancellingId === reservation.id}
                        >
                          {cancellingId === reservation.id ? 'Cancelling...' : 'Cancel'}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookings;
