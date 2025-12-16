import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BookedFlights } from "@shared/types";
import { paymentsService, ticketsService, api } from "@services";
import { CreatePaymentRequest } from "@services/types/api.types";
import { ApiError } from "@services/types/api.types";
import Button from "@shared/ui/Button";
import { TextField } from "@shared/ui/Input";
import { SelectedFlights } from "@features/flights/SelectedFlights/SelectedFlights";
import { Header } from "@shared/layout/Header/Header";
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
      // We need flights and passengers to proceed
      if (!booking.flights || booking.flights.length === 0 ||
        !booking.passengers || booking.passengers.length === 0) {
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
    // Validate payment form
    if (!paymentData.cardNumber || !paymentData.cardHolder || !paymentData.expiryDate || !paymentData.cvv) {
      setError("Please fill in all payment details");
      return;
    }

    if (!bookedFlights?.flights || bookedFlights.flights.length === 0) {
      setError("No flights selected. Please start over.");
      return;
    }

    if (!bookedFlights?.passengers || bookedFlights.passengers.length === 0) {
      setError("No passenger information. Please start over.");
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      const { reservationsService } = await import("@services");
      const { FlightClass } = await import("@services/types/api.types");

      // Helper to format date of birth
      const formatDateOfBirth = (dob: string): string => {
        if (!dob) return '';
        if (dob.includes('/')) {
          const parts = dob.split('/');
          if (parts.length === 3) {
            const month = parts[0].padStart(2, '0');
            const day = parts[1].padStart(2, '0');
            let year = parts[2];
            if (year.length === 2) {
              const yearNum = parseInt(year);
              year = yearNum > 50 ? `19${year}` : `20${year}`;
            }
            return `${year}-${month}-${day}`;
          }
        }
        return new Date(dob).toISOString().split('T')[0];
      };

      // Map seat class
      const mapSeatClass = (seatClass: string): typeof FlightClass[keyof typeof FlightClass] => {
        switch (seatClass) {
          case "Business":
            return FlightClass.BUSINESS;
          case "First":
            return FlightClass.FIRST;
          default:
            return FlightClass.ECONOMY;
        }
      };

      const seatClass = mapSeatClass(bookedFlights.selectedClass || "Economy");
      const reservationIds: string[] = [];

      // Step 1: Create reservations for each passenger for each flight
      console.log("Creating reservations...");
      for (const flight of bookedFlights.flights) {
        for (let i = 0; i < bookedFlights.passengers.length; i++) {
          const passenger = bookedFlights.passengers[i];

          const reservationData = {
            flightId: flight.id,
            passengerFirstName: passenger.firstName,
            passengerLastName: passenger.lastName,
            passengerPassport: passenger.passport || `PASS${Date.now()}${i}`,
            passengerDateOfBirth: formatDateOfBirth(passenger.dob),
            flightClass: seatClass,
          };

          console.log("Creating reservation:", reservationData);
          const reservation = await reservationsService.create(reservationData);
          reservationIds.push(reservation.id);
        }
      }
      console.log("Created reservations:", reservationIds);

      // Step 2: Fetch all reservations to get their totalPrice values
      const reservations = await Promise.all(
        reservationIds.map(id => reservationsService.getById(id))
      );

      console.log('Fetched reservations:', reservations.map(r => ({
        id: r.id,
        totalPrice: r.totalPrice,
        flightId: r.flight?.id,
      })));

      // Step 3: Create payment for each reservation
      const paymentPromises = reservations.map((reservation) => {
        const paymentRequest: CreatePaymentRequest = {
          reservationId: reservation.id,
          amount: parseFloat(String(reservation.totalPrice)),
          currency: "MAD",
          paymentMethod: paymentData.paymentMethod,
          cardNumber: paymentData.cardNumber.replace(/\s/g, ''),
          cardHolder: paymentData.cardHolder,
          expiryDate: paymentData.expiryDate,
          cvv: paymentData.cvv,
        };
        console.log('Creating payment request:', {
          reservationId: paymentRequest.reservationId,
          amount: paymentRequest.amount,
          cardNumber: paymentRequest.cardNumber.substring(0, 4) + '****',
        });
        return paymentsService.create(paymentRequest);
      });

      await Promise.all(paymentPromises);

      // After payments succeed, try to fetch tickets for reservations
      try {
        const fetched = await Promise.all(
          reservationIds.map((id) =>
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
      sessionStorage.removeItem("bookedFlights");
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
      <div className="page-container" style={{ 
        padding: "2rem",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
      }}>
        <div style={{
          background: "white",
          borderRadius: "16px",
          maxWidth: "700px",
          margin: "3rem auto",
          padding: "3rem",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15)",
          animation: "slideUp 0.5s ease-out"
        }}>
          {/* Success Icon */}
          <div style={{
            width: "80px",
            height: "80px",
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1.5rem",
            animation: "scaleIn 0.6s ease-out"
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>

          {/* Title */}
          <h2 style={{
            fontSize: "2rem",
            fontWeight: "700",
            color: "#1f2937",
            textAlign: "center",
            marginBottom: "0.5rem"
          }}>
            Payment Successful!
          </h2>
          
          <p style={{
            fontSize: "1rem",
            color: "#6b7280",
            textAlign: "center",
            marginBottom: "2.5rem"
          }}>
            Your booking has been confirmed. You will receive a confirmation email shortly.
          </p>

          {/* Divider */}
          <div style={{
            height: "1px",
            background: "linear-gradient(90deg, transparent, #e5e7eb, transparent)",
            margin: "2rem 0"
          }}></div>

          {/* Tickets Section */}
          {tickets.length > 0 ? (
            <div>
              <h3 style={{
                fontSize: "1.125rem",
                fontWeight: "600",
                color: "#374151",
                marginBottom: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem"
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 7v4a1 1 0 0 0 1 1h3"></path>
                  <path d="M7 7v10"></path>
                  <path d="M10 8v8a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1z"></path>
                  <path d="M17 7v4a1 1 0 0 1-1 1h-3"></path>
                </svg>
                Your Tickets
              </h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {tickets.map((ticket) => {
                  const filePath = ticket.fichierPDF || ticket.reservation?.ticketPdfPath;
                  const fileUrl = filePath
                    ? filePath.startsWith('http')
                      ? filePath
                      : `${(api && api.defaults && api.defaults.baseURL) ? api.defaults.baseURL.replace(/\/$/, '') : ''}/${filePath.replace(/^\/+/, '')}`
                    : null;

                  return (
                    <div key={ticket.id} style={{
                      background: "#f9fafb",
                      border: "1px solid #e5e7eb",
                      borderRadius: "12px",
                      padding: "1.25rem",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      transition: "all 0.2s ease",
                      cursor: "default"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#f3f4f6";
                      e.currentTarget.style.borderColor = "#d1d5db";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#f9fafb";
                      e.currentTarget.style.borderColor = "#e5e7eb";
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: "0.875rem",
                          fontWeight: "600",
                          color: "#374151",
                          marginBottom: "0.25rem"
                        }}>
                          {ticket.numeroBillet}
                        </div>
                        <div style={{
                          fontSize: "0.75rem",
                          color: "#9ca3af"
                        }}>
                          Ticket Number
                        </div>
                      </div>

                      {fileUrl ? (
                        <a 
                          href={fileUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            padding: "0.625rem 1.25rem",
                            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            color: "white",
                            textDecoration: "none",
                            borderRadius: "8px",
                            fontSize: "0.875rem",
                            fontWeight: "500",
                            transition: "all 0.2s ease",
                            boxShadow: "0 2px 8px rgba(102, 126, 234, 0.3)"
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "translateY(-2px)";
                            e.currentTarget.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.4)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "0 2px 8px rgba(102, 126, 234, 0.3)";
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                          </svg>
                          Download PDF
                        </a>
                      ) : (
                        <button
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            padding: "0.625rem 1.25rem",
                            background: "white",
                            color: "#667eea",
                            border: "2px solid #667eea",
                            borderRadius: "8px",
                            fontSize: "0.875rem",
                            fontWeight: "500",
                            cursor: "pointer",
                            transition: "all 0.2s ease"
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#667eea";
                            e.currentTarget.style.color = "white";
                            e.currentTarget.style.transform = "translateY(-2px)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "white";
                            e.currentTarget.style.color = "#667eea";
                            e.currentTarget.style.transform = "translateY(0)";
                          }}
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
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                          </svg>
                          Generate PDF
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{
              background: "#eff6ff",
              border: "1px solid #dbeafe",
              borderRadius: "12px",
              padding: "1.5rem",
              textAlign: "center"
            }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" style={{ margin: "0 auto 1rem" }}>
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              <p style={{
                fontSize: "0.875rem",
                color: "#1e40af",
                margin: 0
              }}>
                Your ticket will be available shortly via email.
              </p>
            </div>
          )}

          {/* Return Button */}
          <div style={{ marginTop: "2.5rem" }}>
            <Button
              variant="primary"
              onClick={() => navigate("/flights")}
              style={{
                width: "100%",
                padding: "0.875rem",
                fontSize: "1rem",
                fontWeight: "600",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                border: "none",
                borderRadius: "10px",
                color: "white",
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)"
              }}
            >
              Return to Home
            </Button>
          </div>
        </div>

        {/* Add animations */}
        <style>{`
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes scaleIn {
            from {
              transform: scale(0);
              opacity: 0;
            }
            to {
              transform: scale(1);
              opacity: 1;
            }
          }
        `}</style>
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
