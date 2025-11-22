import { SelectedFlights } from "@features/flights/SelectedFlights/SelectedFlights";
import { useParamsData } from "@hooks/useParamsData";
import {
  BookedFlights,
  EmergencyInfo,
  Flight,
  FlightSearchValues,
  Passenger,
} from "@shared/types";
import styles from "./style.module.scss";
import clsx from "clsx";
import { PassengerForm } from "@features/PassengerInfo/PassengerForm/PassengerForm";
import { EmergencyForm } from "@features/PassengerInfo/EmergencyForm/EmergencyForm";
import { BagForm } from "@features/PassengerInfo/BagForm/BagForm";
import Button from "@shared/ui/Button";
import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@context/AuthContext";
import { passengerProfilesService } from "@services";

export const FlightPassengerInfo = () => {
  const { data: paramsData } = useParamsData<{
    selectedFlights: Flight[];
    searchValues: FlightSearchValues;
  } | null>(null);

  const formValuesRef = useRef<{
    passengers: Passenger[];
    emergency?: EmergencyInfo;
    bags?: number[];
  }>({ passengers: [], bags: [] });

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [savedProfiles, setSavedProfiles] = useState<any[]>([]);
  const [savedEmergencyContact, setSavedEmergencyContact] = useState<any>(null);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(true);
  const { isAuthenticated } = useAuth();
  const passengersList = getPassengersList(
    paramsData?.searchValues.passengerCount
  );
  const navigate = useNavigate();

  // Load saved passenger profiles
  useEffect(() => {
    console.log("FlightPassengerInfo: isAuthenticated =", isAuthenticated);
    const loadProfiles = async () => {
      if (!isAuthenticated) {
        setIsLoadingProfiles(false);
        return;
      }

      try {
        const profiles = await passengerProfilesService.getAll();
        setSavedProfiles(profiles);

        // Try to get default profile or first profile
        const defaultProfile = profiles.find(p => p.isDefault) || profiles[0];
        if (defaultProfile) {
          // Pre-fill first passenger with default profile
          if (formValuesRef.current.passengers.length === 0 && passengersList.length > 0) {
            formValuesRef.current.passengers[0] = {
              firstName: defaultProfile.firstName,
              middleName: defaultProfile.middleName || '',
              lastName: defaultProfile.lastName,
              suffix: defaultProfile.suffix || '',
              dob: formatDateForInput(defaultProfile.dateOfBirth),
              email: defaultProfile.email,
              phone: defaultProfile.phone,
              redress: defaultProfile.redressNumber || '',
              knownTraveler: defaultProfile.knownTravelerNumber || '',
              passport: defaultProfile.passportNumber,
              ageGroup: passengersList[0],
            };
          }
        }
      } catch (error) {
        console.error('Error loading passenger profiles:', error);
      } finally {
        setIsLoadingProfiles(false);
      }
    };

    loadProfiles();
  }, [isAuthenticated, passengersList.length]);

  // Format date from ISO to MM/DD/YY
  const formatDateForInput = (dateStr: string): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${month}/${day}/${year}`;
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];
    const { passengers, emergency } = formValuesRef.current;

    // Validate all passengers are filled
    if (passengers.length !== passengersList.length) {
      errors.push("Please fill in all passenger information");
    }

    passengers.forEach((passenger, index) => {
      if (!passenger.firstName) {
        errors.push(`Passenger ${index + 1}: First name is required`);
      }
      if (!passenger.lastName) {
        errors.push(`Passenger ${index + 1}: Last name is required`);
      }
      if (!passenger.dob) {
        errors.push(`Passenger ${index + 1}: Date of birth is required`);
      }
      if (!passenger.passport) {
        errors.push(`Passenger ${index + 1}: Passport number is required`);
      }
      if (!passenger.email) {
        errors.push(`Passenger ${index + 1}: Email is required`);
      }
      if (!passenger.phone) {
        errors.push(`Passenger ${index + 1}: Phone number is required`);
      }
    });

    // Validate emergency contact
    if (!emergency?.firstName) {
      errors.push("Emergency contact: First name is required");
    }
    if (!emergency?.lastName) {
      errors.push("Emergency contact: Last name is required");
    }
    if (!emergency?.email) {
      errors.push("Emergency contact: Email is required");
    }
    if (!emergency?.phone) {
      errors.push("Emergency contact: Phone number is required");
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleFormSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    // Save passenger profiles if authenticated
    if (isAuthenticated) {
      try {
        for (const passenger of formValuesRef.current.passengers) {
          // Check if profile already exists (by passport number)
          const existingProfile = savedProfiles.find(
            p => p.passportNumber === passenger.passport
          );

          const profileData = {
            firstName: passenger.firstName,
            middleName: passenger.middleName || undefined,
            lastName: passenger.lastName,
            suffix: passenger.suffix || undefined,
            dateOfBirth: convertDateToISO(passenger.dob),
            email: passenger.email,
            phone: passenger.phone,
            redressNumber: passenger.redress || undefined,
            knownTravelerNumber: passenger.knownTraveler || undefined,
            passportNumber: passenger.passport,
            isDefault: !existingProfile, // Set as default if it's a new profile
          };

          if (existingProfile) {
            // Update existing profile
            await passengerProfilesService.update(existingProfile.id, profileData);
          } else {
            // Create new profile
            await passengerProfilesService.create(profileData);
          }
        }
      } catch (error) {
        console.error('Error saving passenger profiles:', error);
        // Continue with booking even if saving profiles fails
      }
    }

    const values: BookedFlights = {
      selectedDates: paramsData?.searchValues.slectedDates,
      from: paramsData?.searchValues.from,
      to: paramsData?.searchValues.to,
      passengers: formValuesRef.current.passengers,
      emergency: formValuesRef.current.emergency,
      bags: formValuesRef.current.bags,
      flights: paramsData?.selectedFlights,
    };
    sessionStorage.setItem("bookedFlights", JSON.stringify(values));
    navigate("/flights/select-seats");
  };

  // Convert MM/DD/YY to ISO date
  const convertDateToISO = (dateStr: string): string => {
    if (!dateStr) return '';
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const month = parseInt(parts[0]);
      const day = parseInt(parts[1]);
      let year = parseInt(parts[2]);
      // Handle 2-digit year (assume 00-50 is 2000-2050, 51-99 is 1951-1999)
      if (year < 100) {
        year = year < 50 ? 2000 + year : 1900 + year;
      }
      const date = new Date(year, month - 1, day);
      return date.toISOString().split('T')[0];
    }
    return dateStr;
  };
  return (
    <div className={clsx("page-container", styles["passenger-info"])}>
      <div className={styles["inner-container"]}>
        <div className={styles["left"]}>
          <h3 className={styles["title"]}>Passenger information</h3>
          <p className={styles["description"]}>
            Enter the required information for each traveler and be sure that it
            exactly matches the government-issued ID presented at the airport.
          </p>
          {validationErrors.length > 0 && (
            <div style={{
              padding: "1rem",
              background: "#fee",
              color: "#c33",
              borderRadius: "4px",
              marginBottom: "1rem"
            }}>
              <strong>Please fix the following errors:</strong>
              <ul style={{ marginTop: "0.5rem", paddingLeft: "1.5rem" }}>
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
          <div className={styles["forms"]}>
            {passengersList?.map((ageGroup, i) => {
              const savedProfile = i === 0 && savedProfiles.length > 0
                ? (savedProfiles.find(p => p.isDefault) || savedProfiles[0])
                : null;

              return (
                <PassengerForm
                  key={i}
                  passengerNo={i + 1}
                  ageGroup={ageGroup}
                  savedProfiles={savedProfiles}
                  savedProfile={savedProfile ? {
                    firstName: savedProfile.firstName,
                    middleName: savedProfile.middleName || '',
                    lastName: savedProfile.lastName,
                    suffix: savedProfile.suffix || '',
                    dob: formatDateForInput(savedProfile.dateOfBirth),
                    email: savedProfile.email,
                    phone: savedProfile.phone,
                    redress: savedProfile.redressNumber || '',
                    knownTraveler: savedProfile.knownTravelerNumber || '',
                    passport: savedProfile.passportNumber,
                  } : undefined}
                  getValues={(values) => {
                    if (!formValuesRef.current.passengers[i]) {
                      formValuesRef.current.passengers[i] = { ...values, ageGroup };
                    } else {
                      formValuesRef.current.passengers[i] = { ...formValuesRef.current.passengers[i], ...values, ageGroup };
                    }
                  }}
                />
              );
            })}
            <EmergencyForm
              savedContact={savedEmergencyContact}
              getValues={(values) => (formValuesRef.current["emergency"] = values)}
            />
            <BagForm
              passengers={formValuesRef.current.passengers}
              getValues={(values) => (formValuesRef.current.bags = values)}
            />
          </div>
          <div className={styles["control-group"]}>
            <Button variant="secondary" size="lg">
              Save and close
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={() => handleFormSubmit()}
            >
              Select seats
            </Button>
          </div>
        </div>
        <div className={styles["right"]}>
          <SelectedFlights flights={paramsData?.selectedFlights || []} />
          <img src="/images/bags.png" alt="" loading="lazy" />
        </div>
      </div>
    </div>
  );
};

const getPassengersList = (passengers?: { adults: number; minors: number }) => {
  if (!passengers) return [];
  const passengerList: ("Adult" | "Minor")[] = [];
  for (let i = 0; i < passengers.adults; i++) {
    passengerList.push("Adult");
  }
  for (let i = 0; i < passengers.minors; i++) {
    passengerList.push("Minor");
  }
  return passengerList;
};
