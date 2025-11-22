import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BookedFlights } from "@shared/types";
import { paymentsService, ticketsService, api } from "@services";
import { CreatePaymentRequest, PaymentStatus } from "@services/types/api.types";
import { ApiError } from "@services/types/api.types";
import Button from "@shared/ui/Button";
import { TextField } from "@shared/ui/Input";
import { SelectedFlights } from "@features/flights/SelectedFlights/SelectedFlights";
import { Header } from "@shared/layout/Header/Header";
import styles from "./style.module.scss";
import CreditCardIcon from "@shared/icons/32/credit card.svg?react";
import { useAuth } from "@context/AuthContext";
import generateTicketPdf from "@/util/generateTicketPdf";
import { useToast } from "@components/Toast/Toast";

const FlightsPaymentPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { showSuccess, showError } = useToast();
  const [bookedFlights, setBookedFlights] = useState<BookedFlights | null>(null);
  const [paymentData, setPaymentData] = useState({
    cardNumber: "",
    cardHolder: "",
    expiryDate: "",
    cvv: "",
    paymentMethod: "credit_card",
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [tickets, setTickets] = useState<any[]>([]);

  useEffect(() => {
    // Redirect if not authenticated
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    // Load booking data
    const bookingStr = localStorage.getItem("bookedFlights");
    if (!bookingStr) {
      navigate("/flights");
      return;
    }

    try {
      const booking = JSON.parse(bookingStr);
      if (!booking.reservationIds || booking.reservationIds.length === 0) {
        navigate("/flights");
        return;
      }
      setBookedFlights(booking);
    } catch (err) {
      console.error("Error parsing booking data:", err);
      navigate("/flights");
    }
  }, [isAuthenticated, navigate]);

  const calculateTotal = (): number => {
    if (!bookedFlights?.flights) return 0;
    // Calculate from flight prices (for display)
    // Actual payment will use reservation totalPrice values
    return bookedFlights.flights.reduce((total, flight) => {
      return total + (flight.price?.total || 0);
    }, 0);
  };

  const handlePayment = async () => {
    if (!bookedFlights?.reservationIds || bookedFlights.reservationIds.length === 0) {
      setError("No reservations found. Please start over.");
      return;
    }

    // Validate payment form
    if (!paymentData.cardNumber || !paymentData.cardHolder || !paymentData.expiryDate || !paymentData.cvv) {
      setError("Please fill in all payment details");
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      // Fetch all reservations to get their actual totalPrice values
      const { reservationsService } = await import("@services");
      const reservations = await Promise.all(
        bookedFlights.reservationIds.map(id => reservationsService.getById(id))
      );

      console.log('Fetched reservations:', reservations.map(r => ({
        id: r.id,
        totalPrice: r.totalPrice,
        flightId: r.flight?.id,
      })));

      // Calculate total from actual reservation prices
      const total = reservations.reduce((sum, reservation) => sum + reservation.totalPrice, 0);
      console.log('Total payment amount:', total);

      // Create payment for each reservation using its actual totalPrice
      const paymentPromises = reservations.map((reservation) => {
        const paymentRequest: CreatePaymentRequest = {
          reservationId: reservation.id,
          amount: reservation.totalPrice, // Use reservation's actual totalPrice
          currency: "MAD",
          paymentMethod: paymentData.paymentMethod,
          cardNumber: paymentData.cardNumber.replace(/\s/g, ''), // Remove spaces
          cardHolder: paymentData.cardHolder,
          expiryDate: paymentData.expiryDate, // MM/YY format
          cvv: paymentData.cvv,
        };
        console.log('Creating payment request:', {
          reservationId: paymentRequest.reservationId,
          amount: paymentRequest.amount,
          cardNumber: paymentRequest.cardNumber.substring(0, 4) + '****',
          cardHolder: paymentRequest.cardHolder,
          expiryDate: paymentRequest.expiryDate,
        });
        return paymentsService.create(paymentRequest);
      });

      await Promise.all(paymentPromises);

      // After payments succeed, try to fetch tickets for reservations
      try {
        const fetched = await Promise.all(
          bookedFlights.reservationIds.map((id) =>
            ticketsService.getByReservation(id).catch(() => null)
          )
        );
        const valid = fetched.filter((t) => t);
        setTickets(valid as any[]);
      } catch (err) {
        console.warn('Failed to fetch tickets after payment', err);
      }

      setSuccess(true);
      showSuccess("Payment successful! Your booking has been confirmed.");

      // Clear booking data
      localStorage.removeItem("bookedFlights");
    } catch (err) {
      const apiError = err as ApiError;
      console.error('Payment error details:', {
        statusCode: apiError.statusCode,
        message: apiError.message,
        error: apiError.error,
        fullError: err,
      });

      let errorMessage = 'Payment failed. Please try again.';
      if (typeof apiError.message === 'string') {
        errorMessage = apiError.message;
      } else if (Array.isArray(apiError.message)) {
        errorMessage = apiError.message.join(', ');
      }

      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!bookedFlights) {
    return (
      <div>
        <Header variant="basic" />
        <div className="page-container" style={{ padding: "2rem", textAlign: "center" }}>
          <p>Loading payment information...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div>
        <Header variant="basic" />
        <div className="page-container" style={{ padding: "2rem", textAlign: "center" }}>
          <div style={{
            background: "#dfd",
            color: "#3a3",
            padding: "2rem",
            borderRadius: "8px",
            maxWidth: "800px",
            margin: "2rem auto",
            textAlign: 'left'
          }}>
            <h2>Payment Successful! ✅</h2>
            <p>Your booking has been confirmed. You will receive a confirmation email shortly.</p>

            {tickets.length > 0 ? (
              <div style={{ marginTop: 12 }}>
                <h3>Tickets</h3>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {tickets.map((ticket) => {
                    // build file URL if needed
                    const filePath = ticket.fichierPDF || ticket.reservation?.ticketPdfPath;
                    const fileUrl = filePath
                      ? filePath.startsWith('http')
                        ? filePath
                        : `${(api && api.defaults && api.defaults.baseURL) ? api.defaults.baseURL.replace(/\/$/, '') : ''}/${filePath.replace(/^\/+/, '')}`
                      : null;

                    return (
                      <li key={ticket.id} style={{ marginBottom: 8 }}>
                        <strong>{ticket.numeroBillet}</strong>
                        {fileUrl ? (
                          <a style={{ marginLeft: 12 }} href={fileUrl} target="_blank" rel="noreferrer">Download PDF</a>
                        ) : (
                          <>
                            <button
                              style={{ marginLeft: 12, background: 'transparent', border: 'none', color: '#1976d2', cursor: 'pointer' }}
                              onClick={() => {
                                try {
                                  const pdfData = {
                                    numeroBillet: ticket.numeroBillet,
                                    dateEmission: ticket.dateEmission,
                                    bookingReference: ticket.reservation?.bookingReference,
                                    passengerFirstName: ticket.reservation?.passengerFirstName,
                                    passengerLastName: ticket.reservation?.passengerLastName,
                                    passengerPassport: ticket.reservation?.passengerPassport,
                                    passengerDateOfBirth: ticket.reservation?.passengerDateOfBirth,
                                    flightNumber: ticket.reservation?.flight?.flightNumber,
                                    airlineName: ticket.reservation?.flight?.airline?.name,
                                    departureAirportCode: ticket.reservation?.flight?.departureAirport?.code,
                                    departureAirportName: ticket.reservation?.flight?.departureAirport?.name,
                                    departureCity: ticket.reservation?.flight?.departureAirport?.city,
                                    departureTime: ticket.reservation?.flight?.departureTime,
                                    arrivalAirportCode: ticket.reservation?.flight?.arrivalAirport?.code,
                                    arrivalAirportName: ticket.reservation?.flight?.arrivalAirport?.name,
                                    arrivalCity: ticket.reservation?.flight?.arrivalAirport?.city,
                                    arrivalTime: ticket.reservation?.flight?.arrivalTime,
                                    flightClass: ticket.reservation?.flightClass,
                                    totalPrice: ticket.reservation?.totalPrice,
                                  };
                                  (async () => {
                                    try {
                                      const blob = await generateTicketPdf(pdfData as any, `ticket-${ticket.numeroBillet || ticket.reservation?.bookingReference}.pdf`, { autoDownload: false });
                                      if (blob instanceof Blob) {
                                        const url = URL.createObjectURL(blob);
                                        window.open(url, '_blank');
                                        // revoke after a short delay
                                        setTimeout(() => URL.revokeObjectURL(url), 60000);
                                      }
                                    } catch (e) {
                                      console.error('PDF generation failed', e);
                                    }
                                  })();
                                } catch (e) {
                                  console.error('PDF generation failed', e);
                                }
                              }}
                            >
                              Generate PDF
                            </button>
                          </>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : (
              <p style={{ marginTop: 12 }}>Your ticket will be available shortly via email.</p>
            )}

            <div style={{ marginTop: "2rem" }}>
              <Button
                variant="primary"
                onClick={() => navigate("/flights")}
              >
                Return to Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header variant="basic" />
      <div className="page-container" style={{ padding: "2rem" }}>
        <h2 style={{ marginBottom: "2rem" }}>Payment</h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
          <div>
            <h3 style={{ marginBottom: "1rem" }}>Payment Details</h3>

            <div style={{
              padding: "0.75rem",
              background: "#e3f2fd",
              color: "#1976d2",
              borderRadius: "4px",
              marginBottom: "1rem",
              fontSize: "0.9rem"
            }}>
              <strong>💳 Test Cards:</strong> Use card <code>4111111111111111</code>, Holder: <code>John Doe</code>, Expiry: <code>12/25</code>, CVV: <code>123</code>
            </div>

            {error && (
              <div style={{
                padding: "1rem",
                background: "#fee",
                color: "#c33",
                borderRadius: "4px",
                marginBottom: "1rem"
              }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <TextField
                placeholder="Card Number"
                value={paymentData.cardNumber}
                onChange={(e) => setPaymentData({ ...paymentData, cardNumber: e.target.value })}
                startIcon={<CreditCardIcon />}
                maxLength={19}
              />
              <TextField
                placeholder="Card Holder Name"
                value={paymentData.cardHolder}
                onChange={(e) => setPaymentData({ ...paymentData, cardHolder: e.target.value })}
              />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <TextField
                  placeholder="MM/YY"
                  value={paymentData.expiryDate}
                  onChange={(e) => setPaymentData({ ...paymentData, expiryDate: e.target.value })}
                  maxLength={5}
                />
                <TextField
                  placeholder="CVV"
                  type="password"
                  value={paymentData.cvv}
                  onChange={(e) => setPaymentData({ ...paymentData, cvv: e.target.value })}
                  maxLength={4}
                />
              </div>
            </div>

            <div style={{ marginTop: "2rem" }}>
              <Button
                variant="primary"
                size="lg"
                onClick={handlePayment}
                disabled={isProcessing}
                style={{ width: "100%" }}
              >
                {isProcessing ? "Processing Payment..." : `Pay ${calculateTotal().toFixed(2)} MAD`}
              </Button>
            </div>
          </div>

          <div>
            <h3 style={{ marginBottom: "1rem" }}>Booking Summary</h3>
            {bookedFlights.flights && (
              <SelectedFlights flights={bookedFlights.flights} />
            )}
            <div style={{
              marginTop: "1rem",
              padding: "1rem",
              background: "#f5f5f5",
              borderRadius: "4px"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span>Subtotal:</span>
                <span>{calculateTotal().toFixed(2)} MAD</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span>Taxes & Fees:</span>
                <span>Included</span>
              </div>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "1rem",
                paddingTop: "1rem",
                borderTop: "1px solid #ddd",
                fontWeight: "bold",
                fontSize: "1.1rem"
              }}>
                <span>Total:</span>
                <span>{calculateTotal().toFixed(2)} MAD</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlightsPaymentPage;
