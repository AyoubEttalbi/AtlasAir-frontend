/* eslint-disable react-refresh/only-export-components */
import { SeatClasses } from "@features/flights/SeatClasses/SeatClasses";
import { Header } from "@shared/layout/Header/Header";
import styles from "./style.module.scss";
import { Plane } from "@features/flights/Plane/Plane";
import Button from "@shared/ui/Button";
import { BookedFlights } from "@shared/types";
import PlaneContextProvider, { usePlaneContext } from "@context/PlaneContext";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { reservationsService } from "@services";
import { CreateReservationRequest, FlightClass } from "@services/types/api.types";
import { ApiError } from "@services/types/api.types";
import { useToast } from "@components/Toast/Toast";
const getLetter = (num: number) => {
  return String.fromCharCode(65 + num);
};
const FlightSeatSelection = () => {
  const bookedFlights: BookedFlights = JSON.parse(
    sessionStorage.getItem("bookedFlights") || ""
  );
  const {
    selectedSeats,
    currentSeatsArray,
    departing,
    selectedClass,
    setDeparting,
    setPassengersCount,
  } = usePlaneContext();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  console.log(selectedClass);
  useEffect(() => {
    if (bookedFlights.passengers?.length) {
      setPassengersCount(bookedFlights.passengers?.length);
    }
  }, [bookedFlights.passengers?.length, setPassengersCount]);
  const currentPassenger =
    bookedFlights.passengers?.[
      currentSeatsArray.length - 1 < 0 ? 0 : currentSeatsArray.length - 1
    ];
  const currentSeat =
    currentSeatsArray[
      currentSeatsArray.length - 1 < 0 ? 0 : currentSeatsArray.length - 1
    ]?.split("-");
  const currentSeatName =
    (currentSeat && currentSeat[0] + getLetter(+currentSeat[1] - 1)) || "--";
  const [isCreatingReservations, setIsCreatingReservations] = useState(false);
  const [reservationError, setReservationError] = useState<string | null>(null);
  const [createdReservationIds, setCreatedReservationIds] = useState<string[]>([]);

  const checkComplete = () => {
    let flag = false;
    if (selectedSeats.departing.length === bookedFlights.passengers?.length) {
      if (bookedFlights.flights?.length === 1) {
        flag = true;
      } else {
        flag =
          selectedSeats.arriving.length === bookedFlights.passengers?.length;
      }
    }
    return flag;
  };

  // Map seat class from context to FlightClass enum
  const mapSeatClassToFlightClass = (seatClass: "Economy" | "Business"): FlightClass => {
    switch (seatClass) {
      case "Business":
        return FlightClass.BUSINESS;
      case "Economy":
      default:
        return FlightClass.ECONOMY;
    }
  };

  // Format date of birth to ISO format
  const formatDateOfBirth = (dob: string): string => {
    if (!dob) return '';
    // Handle MM/DD/YY format
    if (dob.includes('/')) {
      const parts = dob.split('/');
      if (parts.length === 3) {
        const month = parts[0].padStart(2, '0');
        const day = parts[1].padStart(2, '0');
        let year = parts[2];
        // Convert 2-digit year to 4-digit
        if (year.length === 2) {
          const yearNum = parseInt(year);
          year = yearNum > 50 ? `19${year}` : `20${year}`;
        }
        return `${year}-${month}-${day}`;
      }
    }
    // If already in ISO format, return as is
    return new Date(dob).toISOString().split('T')[0];
  };

  const handleFormSubmit = async () => {
    if (!checkComplete()) return;

    try {
      setIsCreatingReservations(true);
      setReservationError(null);

      const reservationIds: string[] = [];
      const flights = bookedFlights.flights || [];
      const passengers = bookedFlights.passengers || [];
      const seatClass = mapSeatClassToFlightClass(selectedClass);

      // Create reservations for each passenger for each flight
      for (const flight of flights) {
        for (let i = 0; i < passengers.length; i++) {
          const passenger = passengers[i];
          
          const reservationData: CreateReservationRequest = {
            flightId: flight.id,
            passengerFirstName: passenger.firstName,
            passengerLastName: passenger.lastName,
            passengerPassport: passenger.passport || `PASS${Date.now()}${i}`, // Fallback if missing
            passengerDateOfBirth: formatDateOfBirth(passenger.dob),
            flightClass: seatClass,
          };

          const reservation = await reservationsService.create(reservationData);
          reservationIds.push(reservation.id);
        }
      }

      setCreatedReservationIds(reservationIds);
      showSuccess("Reservations created successfully!");
      
      // Store reservation IDs and updated booking data
      const updatedBooking = {
        ...bookedFlights,
        selectedSeats,
        reservationIds,
      };
      localStorage.setItem("bookedFlights", JSON.stringify(updatedBooking));
      navigate("/flights/payment");
    } catch (err) {
      const apiError = err as ApiError;
      const errorMessage = typeof apiError.message === 'string'
        ? apiError.message
        : 'Failed to create reservations. Please try again.';
      setReservationError(errorMessage);
      showError(errorMessage);
      console.error('Error creating reservations:', err);
    } finally {
      setIsCreatingReservations(false);
    }
  };
  return (
    <div className={styles["seat-selecion-page"]}>
      <Header variant="basic" />
      <div className={styles["left-container"]}>
        <div className={styles["plane"]}>
          <Plane />
        </div>
      </div>
      <div className={styles["right-container"]}>
        <SeatClasses
          from={bookedFlights?.from}
          to={bookedFlights?.to}
          selectedDates={bookedFlights?.selectedDates}
          flights={bookedFlights?.flights}
          departing={departing}
          setDeparting={setDeparting}
          selectedClass={selectedClass}
        >
          <div className={styles["footer"]}>
            <div>
              <p>
                Passenger{" "}
                {currentSeatsArray.length <= 1 ? 1 : currentSeatsArray.length}
              </p>
              <p>
                {currentPassenger?.firstName + " " + currentPassenger?.lastName}
              </p>
            </div>
            <div>
              <p>Seat number</p>
              <p>{currentSeatName}</p>
            </div>
            {reservationError && (
              <div style={{ 
                padding: "0.75rem", 
                background: "#fee", 
                color: "#c33", 
                borderRadius: "4px", 
                marginBottom: "1rem",
                fontSize: "0.9rem"
              }}>
                {reservationError}
              </div>
            )}
            <div className={styles["buttons"]}>
              <Button variant="secondary" size="md">
                Save and close
              </Button>
              <Button
                variant="primary"
                size="md"
                disabled={!checkComplete() || isCreatingReservations}
                onClick={handleFormSubmit}
              >
                {isCreatingReservations ? "Creating reservations..." : "Next flight"}
              </Button>
            </div>
          </div>
        </SeatClasses>
      </div>
    </div>
  );
};

export default function main() {
  return (
    <PlaneContextProvider>
      <FlightSeatSelection />
    </PlaneContextProvider>
  );
}
