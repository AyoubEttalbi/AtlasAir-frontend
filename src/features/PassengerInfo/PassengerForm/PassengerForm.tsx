import { TextField, SelectList } from "@shared/ui/Input";
import styles from "./PassengerForm.module.scss";
import { FC } from "react";
import { useFormik } from "formik";
import { Passenger } from "@shared/types";
import { PassengerProfile } from "@services";
import { useState } from "react";
interface PassengerFormProps {
  passengerNo: number;
  ageGroup: "Adult" | "Minor";
  savedProfile?: Partial<Passenger>;
  savedProfiles?: PassengerProfile[];
  getValues: (values: Passenger) => void;
}
export const PassengerForm: FC<PassengerFormProps> = ({
  passengerNo,
  ageGroup,
  savedProfile,
  savedProfiles,
  getValues,
}) => {
  console.log("PassengerForm rendered. savedProfiles:", savedProfiles);
  const [selectedProfileName, setSelectedProfileName] = useState<string>("");

  const formatDateForInput = (dateStr: string): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${month}/${day}/${year}`;
  };

  const handleProfileSelect = (option: string | string[]) => {
    const selectedOption = Array.isArray(option) ? option[0] : option;

    if (selectedOption === "Clear form") {
      formik.resetForm();
      setSelectedProfileName("");
      return;
    }

    const profile = savedProfiles?.find(p =>
      `${p.firstName} ${p.lastName} (${p.passportNumber})` === selectedOption
    );

    if (profile) {
      formik.setValues({
        firstName: profile.firstName,
        middleName: profile.middleName || "",
        lastName: profile.lastName,
        suffix: profile.suffix || "",
        dob: formatDateForInput(profile.dateOfBirth),
        email: profile.email,
        phone: profile.phone,
        redress: profile.redressNumber || "",
        knownTraveler: profile.knownTravelerNumber || "",
        passport: profile.passportNumber,
      });
      setSelectedProfileName(selectedOption);
    }
  };

  const fillTestData = () => {
    formik.setValues({
      firstName: "John",
      middleName: "D",
      lastName: "Doe",
      suffix: "Jr",
      dob: "01/01/80",
      email: "john.doe@example.com",
      phone: "1234567890",
      redress: "1234567",
      knownTraveler: "987654321",
      passport: "A12345678",
    });
  };

  const profileOptions = savedProfiles?.map(p => `${p.firstName} ${p.lastName} (${p.passportNumber})`) || [];
  const options = ["Clear form", ...profileOptions];
  const formik = useFormik({
    initialValues: {
      firstName: savedProfile?.firstName || "",
      middleName: savedProfile?.middleName || "",
      lastName: savedProfile?.lastName || "",
      suffix: savedProfile?.suffix || "",
      dob: savedProfile?.dob || "",
      email: savedProfile?.email || "",
      phone: savedProfile?.phone || "",
      redress: savedProfile?.redress || "",
      knownTraveler: savedProfile?.knownTraveler || "",
      passport: savedProfile?.passport || "",
    },
    enableReinitialize: true,
    onSubmit: (values) => {
      console.log(values);
    },
  });

  getValues(formik.values);
  return (
    <form className="passenger-form">
      <h4 className={styles["passenger-title"]}>
        Passenger {passengerNo} ({ageGroup})
      </h4>
      {savedProfiles && savedProfiles.length > 0 && (
        <div style={{ marginBottom: "1rem" }}>
          <SelectList
            options={options}
            value={selectedProfileName}
            getSelected={handleProfileSelect}
            placeholder="Select saved passenger"
          />
        </div>
      )}
      <div style={{ marginBottom: "1rem" }}>
        <button
          type="button"
          onClick={fillTestData}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#f0f0f0",
            border: "1px solid #ccc",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "0.875rem"
          }}
        >
          Fill Test Data
        </button>
      </div>
      <div className={styles["first"]}>
        <TextField
          placeholder="First Name"
          required
          id={"firstName" + passengerNo}
          name="firstName"
          value={formik.values.firstName}
          onChange={formik.handleChange}
          autoComplete="on"
        />
        <TextField
          placeholder="Middle"
          id={"middleName" + passengerNo}
          name="middleName"
          value={formik.values.middleName}
          onChange={formik.handleChange}
          autoComplete="on"
        />
        <TextField
          placeholder="Last Name"
          required
          id={"lastName" + passengerNo}
          name="lastName"
          value={formik.values.lastName}
          onChange={formik.handleChange}
          autoComplete="on"
        />
        <TextField
          placeholder="suffix"
          id={"suffix" + passengerNo}
          name="suffix"
          value={formik.values.suffix}
          onChange={formik.handleChange}
          autoComplete="on"
        />
        <TextField
          placeholder="Date of Birth"
          required
          helperText="MM/DD/YY"
          id={"dob" + passengerNo}
          name="dob"
          value={formik.values.dob}
          onChange={formik.handleChange}
          autoComplete="on"
        />
      </div>
      <div className={styles["second"]}>
        <TextField
          placeholder="Email address"
          required
          id={"email" + passengerNo}
          name="email"
          value={formik.values.email}
          onChange={formik.handleChange}
          autoComplete="on"
        />
        <TextField
          placeholder="Phone number"
          required
          id={"phone" + passengerNo}
          name="phone"
          value={formik.values.phone}
          onChange={formik.handleChange}
          autoComplete="on"
        />
        <TextField
          placeholder="Redress number"
          id={"redress" + passengerNo}
          name="redress"
          value={formik.values.redress}
          onChange={formik.handleChange}
          autoComplete="on"
        />
        <TextField
          placeholder="Known traveler number"
          id={"knownTraveler" + passengerNo}
          name="knownTraveler"
          value={formik.values.knownTraveler}
          onChange={formik.handleChange}
          autoComplete="on"
        />
        <TextField
          placeholder="Passport number"
          required
          id={"passport" + passengerNo}
          name="passport"
          value={formik.values.passport}
          onChange={formik.handleChange}
          autoComplete="on"
        />
      </div>
    </form>
  );
};
