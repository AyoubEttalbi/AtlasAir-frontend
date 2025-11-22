import { DatePicker } from "@shared/ui/Input";
import DepartureIcon from "@shared/icons/32/departure.svg?react";
import ArrivalIcon from "@shared/icons/32/arrival.svg?react";
import PersonIcon from "@shared/icons/32/person solid.svg?react";
import styles from "./FlightSearchBar.module.scss";
import Button from "@shared/ui/Button";
import { useFormik } from "formik";
import { SelectList } from "@shared/ui/Input/SelectList/SelectList";
import { PassengerList } from "@shared/ui/Input/PassengerList/PassengerList";
import { useNavigate } from "react-router-dom";
import { FC, useMemo } from "react";
import clsx from "clsx";
import { FlightSearchValues } from "@shared/types";
import { useAirports } from "@hooks/useAirports";
interface FlightSearchBarProps {
  className?: string;
  initialValues?: FlightSearchValues;
}
export const FlightSearchBar: FC<FlightSearchBarProps> = ({
  initialValues: initVal,
  className,
}) => {
  const navigate = useNavigate();
  const { airportOptions, isLoading: airportsLoading, getAirportByCode } = useAirports();
  
  const formik = useFormik({
    initialValues: {
      from: initVal?.from || "",
      to: initVal?.to || "",
      flightType: initVal?.flightType || "multiple",
      slectedDates: initVal?.slectedDates || [],
      passengerCount: initVal?.passengerCount || { adults: 1, minors: 0 },
    },
    onSubmit: (values) => {
      const encoded = encodeURIComponent(JSON.stringify(values));
      console.log(encoded);
      navigate(`/flights/search?${encoded}`);
    },
  });

  // Extract airport code from display string (format: "CODE - City, Country")
  const extractCode = (displayValue: string): string => {
    if (!displayValue) return "";
    const match = displayValue.match(/^([A-Z]{3})/);
    return match ? match[1] : displayValue;
  };

  // Format airport code to display string
  const formatAirportDisplay = (code: string): string => {
    if (!code) return "";
    const airport = getAirportByCode(code);
    if (airport) {
      return `${airport.code} - ${airport.city}, ${airport.country}`;
    }
    return code;
  };

  // Get current display values
  const fromDisplay = useMemo(() => formatAirportDisplay(formik.values.from), [formik.values.from, getAirportByCode]);
  const toDisplay = useMemo(() => formatAirportDisplay(formik.values.to), [formik.values.to, getAirportByCode]);
  return (
    <form
      className={clsx(styles.searchbar, className)}
      onSubmit={formik.handleSubmit}
    >
      <div>
        <SelectList
          key={"from"}
          id="from"
          name="from"
          className="from-where"
          startIcon={<DepartureIcon />}
          placeholder={airportsLoading ? "Loading airports..." : "From where?"}
          getSelected={(selected) => {
            const code = extractCode(selected as string);
            formik.setFieldValue("from", code);
          }}
          value={fromDisplay}
          options={airportOptions}
          disabled={airportsLoading}
        />
        <SelectList
          key={"to"}
          className="where-to"
          placeholder={airportsLoading ? "Loading airports..." : "Where to?"}
          name="to"
          startIcon={<ArrivalIcon />}
          id="to"
          value={toDisplay}
          getSelected={(selected) => {
            const code = extractCode(selected as string);
            formik.setFieldValue("to", code);
          }}
          options={airportOptions}
          disabled={airportsLoading}
        />
      </div>
      <div>
        <DatePicker
          type={formik.values.flightType}
          getType={(val) => formik.setFieldValue("flightType", val)}
          selectedDates={formik.values.slectedDates}
          getSelectedDates={(val) => formik.setFieldValue("slectedDates", val)}
          name="travelingDate"
          placeholder="Depart - Arrive"
          radioNames={["Round trip", "One way"]}
        />
        <PassengerList
          className="passenger-count"
          placeholder="1 adult"
          startIcon={<PersonIcon />}
          id="passengerCount"
          value={formik.values.passengerCount}
          getValue={(val) => formik.setFieldValue("passengerCount", val)}
          name="passengerCount"
        />
      </div>
      <Button variant="primary" size="lg" type="submit">
        Search
      </Button>
    </form>
  );
};
