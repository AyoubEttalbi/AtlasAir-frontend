import { FlightSearchBar } from "@features/flights/FlightSearchBar/FlightSearchBar";
import { FlightTable } from "@features/flights/FlightTable/FlightTable";
import { useEffect, useState } from "react";
import styles from "./style.module.scss";
import { FlightFilter } from "@features/flights/FlightFilter/FlightFilter";
import { PriceGrid } from "@features/flights/PriceGrid/PriceGrid";
import { SelectedFlights } from "@features/flights/SelectedFlights/SelectedFlights";
import { Flight, FlightSearchValues } from "@shared/types";
import Button from "@shared/ui/Button";
import { PriceHistory } from "@features/flights/PriceHistory/PriceHistory";
import { PriceRating } from "@features/flights/PriceRating/PriceRating";
import { CardRow } from "@shared/ui/CardRow/CardRow";
import { RowTitle } from "@shared/ui/RowTitle/RowTitle";
import {
  flightDeals1,
  hotelDeals1,
} from "@shared/data";
import { useParamsData } from "@hooks/useParamsData";
import { useNavigate } from "react-router-dom";
import { flightsService } from "@services";
import { useAirports } from "@hooks/useAirports";
import { SearchFlightRequest } from "@services/types/api.types";
import { ApiError } from "@services/types/api.types";
const sortData = (
  data: Flight[],
  sortBy?: "price" | "stops" | "times" | "airlines" | null
) => {
  const newArr = [...data];
  if (sortBy === "price")
    newArr.sort((a, b) => a?.price?.total || 0 - (b?.price?.total || 0));
  if (sortBy === "stops")
    newArr.sort((a, b) => a.stops?.length || 0 - (b.stops?.length || 0));
  console.log(newArr);
  return newArr;
};
export const FlightsSearch = () => {
  const [dataFilter, setDataFilter] = useState<
    "price" | "stops" | "times" | "airlines" | null
  >(null);
  const [selectedFlightsId, setSelectedFlightsId] = useState<
    [string?, string?]
  >([]);
  const [departingFlights, setDepartingFlights] = useState<Flight[]>([]);
  const [returningFlights, setReturningFlights] = useState<Flight[]>([]);
  const [altReturnOptions, setAltReturnOptions] = useState<{
    date: string;
    flights: Flight[];
  }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { data: searchValues } = useParamsData<FlightSearchValues | null>(null);
  const { getAirportByCode, isLoading: airportsLoading } = useAirports();
  const navigate = useNavigate();

  useEffect(() => {
    setSelectedFlightsId([]);
  }, [searchValues]);

  // Fetch flights when search values change
  useEffect(() => {
    const fetchFlights = async () => {
      // Wait for airports to load
      if (airportsLoading) {
        return;
      }

      if (!searchValues || !searchValues.from || !searchValues.to || !searchValues.slectedDates || searchValues.slectedDates.length === 0) {
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Get airport UUIDs from codes
        const fromAirport = getAirportByCode(searchValues.from);
        const toAirport = getAirportByCode(searchValues.to);

        console.log('Airport lookup:', {
          fromCode: searchValues.from,
          toCode: searchValues.to,
          fromAirport,
          toAirport,
        });

        if (!fromAirport || !toAirport) {
          const missing = [];
          if (!fromAirport) missing.push(searchValues.from);
          if (!toAirport) missing.push(searchValues.to);
          setError(`Airport(s) not found: ${missing.join(', ')}. Please check airport codes.`);
          setIsLoading(false);
          return;
        }

        // Format dates (assuming slectedDates[0] is departure, slectedDates[1] is return)
        // Ensure dates are in ISO 8601 format
        const formatDate = (dateStr: string): string => {
          if (!dateStr) return '';
          // If already in ISO format, return as is
          if (dateStr.includes('T')) return dateStr;
          
          // Handle different date formats
          // Support: YYYY/MM/DD, YYYY-MM-DD, or other formats
          let date: Date;
          
          // Try parsing as YYYY/MM/DD or YYYY-MM-DD
          if (dateStr.includes('/') || dateStr.includes('-')) {
            const parts = dateStr.split(/[\/\-]/);
            if (parts.length === 3) {
              // Create date at midnight in local timezone
              // Format: YYYY-MM-DD or YYYY/MM/DD
              const year = parseInt(parts[0]);
              const month = parseInt(parts[1]) - 1; // Month is 0-indexed
              const day = parseInt(parts[2]);
              date = new Date(year, month, day, 0, 0, 0, 0);
            } else {
              date = new Date(dateStr);
            }
          } else {
            date = new Date(dateStr);
          }
          
          // Convert to ISO string (this will be in UTC)
          // But we want to search for the date in local timezone
          // So we'll format as YYYY-MM-DDTHH:mm:ss
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          
          // Return date at start of day in ISO format
          return `${year}-${month}-${day}T00:00:00.000Z`;
        };
        
        const departureDate = formatDate(searchValues.slectedDates[0]);
        const returnDate = searchValues.slectedDates[1] ? formatDate(searchValues.slectedDates[1]) : undefined;
        
        console.log('Search params:', {
          from: searchValues.from,
          to: searchValues.to,
          departureDate,
          returnDate,
          fromAirportId: fromAirport.id,
          toAirportId: toAirport.id,
        });

        // Calculate total passengers
        const totalPassengers = (searchValues.passengerCount?.adults || 0) + (searchValues.passengerCount?.minors || 0);

        // Build search request for departing flights
        const departingSearchRequest: SearchFlightRequest = {
          departureAirportId: fromAirport.id,
          arrivalAirportId: toAirport.id,
          departureDate: departureDate,
          returnDate: returnDate,
          passengers: totalPassengers || 1,
        };

        // Fetch departing flights
        console.log('Searching with request:', departingSearchRequest);
        const departing = await flightsService.search(departingSearchRequest);
        console.log('Found departing flights:', departing);
        console.log('Departing flights count:', departing.length);
        console.log('First flight details:', departing[0]);
        setDepartingFlights(departing);

        // Fetch returning flights if round trip
        setAltReturnOptions([]);
        if (searchValues.flightType === "multiple" && returnDate) {
          const returningSearchRequest: SearchFlightRequest = {
            departureAirportId: toAirport.id,
            arrivalAirportId: fromAirport.id,
            departureDate: returnDate,
            passengers: totalPassengers || 1,
          };
          console.log('Searching for returning flights with request:', returningSearchRequest);
          const returning = await flightsService.search(returningSearchRequest);
          console.log('Found returning flights:', returning);
          console.log('Returning flights count:', returning.length);
          setReturningFlights(returning);

          // If no exact-match return flights, try ±1 day and offer alternatives
          if ((returning?.length || 0) === 0) {
            try {
              const base = new Date(returnDate);
              const prev = new Date(base);
              prev.setDate(prev.getDate() - 1);
              const next = new Date(base);
              next.setDate(next.getDate() + 1);

              const toIso = (d: Date) => {
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${y}-${m}-${day}T00:00:00.000Z`;
              };

              const [prevFlights, nextFlights] = await Promise.all([
                flightsService.search({
                  departureAirportId: toAirport.id,
                  arrivalAirportId: fromAirport.id,
                  departureDate: toIso(prev),
                  passengers: totalPassengers || 1,
                }),
                flightsService.search({
                  departureAirportId: toAirport.id,
                  arrivalAirportId: fromAirport.id,
                  departureDate: toIso(next),
                  passengers: totalPassengers || 1,
                }),
              ]);

              const options: { date: string; flights: Flight[] }[] = [];
              if (prevFlights && prevFlights.length > 0) options.push({ date: toIso(prev), flights: prevFlights });
              if (nextFlights && nextFlights.length > 0) options.push({ date: toIso(next), flights: nextFlights });
              setAltReturnOptions(options);
            } catch (e) {
              console.warn('Alternative return-date search failed', e);
            }
          }
        } else {
          setReturningFlights([]);
        }
      } catch (err) {
        const apiError = err as ApiError;
        setError(
          typeof apiError.message === 'string'
            ? apiError.message
            : 'Failed to search flights. Please try again.'
        );
        console.error('Error searching flights:', err);
        setDepartingFlights([]);
        setReturningFlights([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFlights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValues, airportsLoading]);

  const currentTable = () => {
    if (searchValues?.flightType === "multiple") {
      return selectedFlightsId[0] ? "returning" : "departing";
    } else {
      return "departing";
    }
  };

  const handleFlightSelection = (id: string) => {
    setSelectedFlightsId((old) => {
      const newArr: [string?, string?] = [...old];
      if (currentTable() === "departing") {
        if (newArr[0] === id) newArr[0] = undefined;
        else newArr[0] = id;
      } else {
        if (newArr[1] === id) newArr[1] = undefined;
        else newArr[1] = id;
      }
      return newArr;
    });
  };

  const handleSubmit = () => {
    const selectedFlightsInfo = [
      ...departingFlights.filter(
        (flight) => flight.id === selectedFlightsId[0]
      ),
      ...returningFlights.filter(
        (flight) => flight.id === selectedFlightsId[1]
      ),
    ];
    const values = { selectedFlights: selectedFlightsInfo, searchValues };
    console.log(searchValues);
    const jsonValues = JSON.stringify(values);
    navigate(`/flights/passenger-info?${encodeURIComponent(jsonValues)}`);
  };

  if (!searchValues) {
    return (
      <div className="page-container" style={{ padding: "2rem", textAlign: "center" }}>
        <h3>Loading search parameters...</h3>
      </div>
    );
  }

  const currentFlights = currentTable() === "departing" ? departingFlights : returningFlights;

  const formatDate = (isoDate: string) => {
    try {
      const d = new Date(isoDate);
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
      return isoDate;
    }
  };

  // Debug logging
  console.log('Render state:', {
    isLoading,
    error,
    departingFlightsCount: departingFlights.length,
    returningFlightsCount: returningFlights.length,
    currentFlightsCount: currentFlights.length,
    currentTable: currentTable(),
  });

  return (
    <div className="page-container">
      <div className={styles["flight-search-page"]}>
        <div className={styles["left-container"]}>
          <FlightSearchBar
            initialValues={searchValues}
            className={styles["flight-searchbar"]}
          />
          <FlightFilter
            current={dataFilter}
            getFilter={(filter) => setDataFilter(filter)}
          />
          <h4 className={styles["flight-table-title"]}>
            Choose a <span>{currentTable()}</span> flight
          </h4>
          
          {isLoading && (
            <div style={{ padding: "2rem", textAlign: "center" }}>
              <p>Searching for flights...</p>
            </div>
          )}

          {error && (
            <div style={{ padding: "1rem", background: "#fee", color: "#c33", borderRadius: "4px", marginBottom: "1rem" }}>
              {error}
            </div>
          )}

          {!isLoading && !error && currentFlights.length === 0 && (
            <div style={{ padding: "2rem", textAlign: "center" }}>
              <p>No {currentTable()} flights found. Please try different search criteria.</p>
              {currentTable() === "returning" && searchValues?.flightType === "multiple" && (
                <>
                  <p style={{ fontSize: "0.9rem", color: "#666", marginTop: "0.5rem" }}>
                    No return flights available from {searchValues.to} to {searchValues.from} on {searchValues.slectedDates?.[1] || 'selected date'}.
                    <br />
                    You can continue with a one-way trip or search for different dates.
                  </p>
                  {altReturnOptions.length > 0 && (
                    <div style={{ marginTop: 12, padding: '1rem', background: '#f7f7f7', borderRadius: 6 }}>
                      <strong>Alternative return dates</strong>
                      {altReturnOptions.map((opt) => (
                        <div key={opt.date} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                          <div>
                            {formatDate(opt.date)} — {opt.flights.length} flight{opt.flights.length !== 1 ? 's' : ''}
                          </div>
                          <div>
                            <Button
                              variant="secondary"
                              size="md"
                              onClick={() => {
                                setReturningFlights(opt.flights);
                              }}
                            >
                              Show flights
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
              <p style={{ fontSize: "0.9rem", color: "#666", marginTop: "0.5rem" }}>
                Debug: departingFlights={departingFlights.length}, returningFlights={returningFlights.length}
              </p>
            </div>
          )}

          {!isLoading && !error && currentFlights.length > 0 && (
            <>
              <div style={{ padding: "0.5rem", background: "#e8f5e9", color: "#2e7d32", borderRadius: "4px", marginBottom: "1rem", fontSize: "0.9rem" }}>
                Found {currentFlights.length} flight{currentFlights.length !== 1 ? 's' : ''}
              </div>
              <FlightTable
                flights={sortData(currentFlights, dataFilter)}
                selectedId={
                  currentTable() === "departing"
                    ? selectedFlightsId[0]
                    : selectedFlightsId[1]
                }
                getSelectedId={(id) => handleFlightSelection(id)}
              />
            </>
          )}
        </div>
        <div className={styles["right-container"]}>
          {!selectedFlightsId[0] && (
            <>
              <PriceGrid />
              <PriceHistory />
              <PriceRating />
            </>
          )}
          {selectedFlightsId[0] && (
            <SelectedFlights
              flights={[
                ...departingFlights.filter(
                  (flight) => flight.id === selectedFlightsId[0]
                ),
                ...returningFlights.filter(
                  (flight) => flight.id === selectedFlightsId[1]
                ),
              ]}
            />
          )}
          <div className={styles["button-container"]}>
            {selectedFlightsId[0] &&
              !selectedFlightsId[1] &&
              searchValues.flightType === "multiple" && (
                <Button variant="secondary" size="lg">
                  Save and close
                </Button>
              )}
            {selectedFlightsId[0] &&
              (searchValues.flightType !== "multiple" ||
                selectedFlightsId[1]) && (
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => handleSubmit()}
                >
                  Passenger information
                </Button>
              )}
          </div>
        </div>
      </div>
      <CardRow
        title={
          <RowTitle
            info="Find your next adventure with these"
            span="flight deals"
            color="var(--purple-blue)"
          />
        }
        cards={flightDeals1}
        viewAllUrl="/flights"
      />
      <CardRow
        title={
          <RowTitle
            info="Explore unique"
            span="places to stay"
            color="var(--turquoise)"
          />
        }
        viewAllUrl="/hotels"
        cards={hotelDeals1}
      />
    </div>
  );
};
