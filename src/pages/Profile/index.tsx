import { FC, useState, useEffect } from "react";
import { useAuth } from "@context/AuthContext";
import { useFormik } from "formik";
import { TextField } from "@shared/ui/Input";
import Button from "@shared/ui/Button";
import { useToast } from "@components/Toast/Toast";
import { usersService } from "@services/users.service";
import { passengerProfilesService, PassengerProfile, CreatePassengerProfileRequest } from "@services/passenger-profiles.service";
import { ProtectedRoute } from "@components/ProtectedRoute";
import styles from "./Profile.module.scss";
import clsx from "clsx";

// Icons
import UserIcon from "@shared/icons/32/person.svg?react";
import LockIcon from "@shared/icons/32/settings cog.svg?react";
import UsersIcon from "@shared/icons/32/briefcase-suitcase-luggage.svg?react";
import TrashIcon from "@shared/icons/32/x close no.svg?react";
import EditIcon from "@shared/icons/32/pencil edit 1.svg?react";
import PlusIcon from "@shared/icons/32/plus.svg?react";

interface ProfileFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface PasswordFormValues {
  password: string;
  confirmPassword: string;
}

const ProfilePage: FC = () => {
  const { user, updateUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const [activeTab, setActiveTab] = useState<'personal' | 'security' | 'passengers'>('personal');
  const [isLoading, setIsLoading] = useState(false);

  // Passenger State
  const [passengers, setPassengers] = useState<PassengerProfile[]>([]);
  const [isLoadingPassengers, setIsLoadingPassengers] = useState(false);
  const [isEditingPassenger, setIsEditingPassenger] = useState(false);
  const [currentPassenger, setCurrentPassenger] = useState<PassengerProfile | null>(null);

  // Personal Info Form
  const personalFormik = useFormik<ProfileFormValues>({
    initialValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phone: user?.phone || "",
    },
    enableReinitialize: true,
    onSubmit: async (values) => {
      try {
        setIsLoading(true);
        const updatedUser = await usersService.update(user!.id, {
          firstName: values.firstName,
          lastName: values.lastName,
          phone: values.phone || undefined,
        });
        updateUser(updatedUser);
        showSuccess("Profile updated successfully");
      } catch (error: any) {
        showError(error?.response?.data?.message || "Failed to update profile");
      } finally {
        setIsLoading(false);
      }
    },
  });

  // Password Form
  const passwordFormik = useFormik<PasswordFormValues>({
    initialValues: {
      password: "",
      confirmPassword: "",
    },
    onSubmit: async (values) => {
      if (values.password !== values.confirmPassword) {
        showError("Passwords do not match");
        return;
      }
      if (values.password.length < 6) {
        showError("Password must be at least 6 characters");
        return;
      }

      try {
        setIsLoading(true);
        await usersService.update(user!.id, {
          password: values.password,
        });
        showSuccess("Password updated successfully");
        passwordFormik.resetForm();
      } catch (error: any) {
        showError(error?.response?.data?.message || "Failed to update password");
      } finally {
        setIsLoading(false);
      }
    },
  });

  // Fetch Passengers
  const fetchPassengers = async () => {
    try {
      setIsLoadingPassengers(true);
      const data = await passengerProfilesService.getAll();
      setPassengers(data);
    } catch (error) {
      console.error("Failed to fetch passengers", error);
    } finally {
      setIsLoadingPassengers(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'passengers') {
      fetchPassengers();
    }
  }, [activeTab]);

  const handleDeletePassenger = async (id: string) => {
    if (!confirm("Are you sure you want to delete this passenger?")) return;
    try {
      await passengerProfilesService.delete(id);
      showSuccess("Passenger deleted successfully");
      fetchPassengers();
    } catch (error) {
      showError("Failed to delete passenger");
    }
  };

  return (
    <div className={styles["profile-page"]}>
      <div className={styles["profile-container"]}>

        {/* Sidebar */}
        <div className={styles["sidebar"]}>
          <div className={styles["user-brief"]}>
            <div className={styles["avatar"]}>
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <h3>{user?.firstName} {user?.lastName}</h3>
            <p>{user?.email}</p>
          </div>

          <nav className={styles["nav-menu"]}>
            <button
              className={clsx({ [styles.active]: activeTab === 'personal' })}
              onClick={() => setActiveTab('personal')}
            >
              <UserIcon width={20} /> Personal Information
            </button>
            <button
              className={clsx({ [styles.active]: activeTab === 'security' })}
              onClick={() => setActiveTab('security')}
            >
              <LockIcon width={20} /> Security
            </button>
            <button
              className={clsx({ [styles.active]: activeTab === 'passengers' })}
              onClick={() => setActiveTab('passengers')}
            >
              <UsersIcon width={20} /> Saved Passengers
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className={styles["content-area"]}>

          {/* Personal Info Tab */}
          {activeTab === 'personal' && (
            <>
              <div className={styles["section-header"]}>
                <div>
                  <h2>Personal Information</h2>
                  <p>Update your personal details and contact information</p>
                </div>
              </div>
              <form onSubmit={personalFormik.handleSubmit} className={styles["form-section"]}>
                <div className={styles["form-row"]}>
                  <TextField
                    name="firstName"
                    placeholder="First name"
                    value={personalFormik.values.firstName}
                    onChange={personalFormik.handleChange}
                    required
                  />
                  <TextField
                    name="lastName"
                    placeholder="Last name"
                    value={personalFormik.values.lastName}
                    onChange={personalFormik.handleChange}
                    required
                  />
                </div>
                <TextField
                  name="email"
                  type="email"
                  placeholder="Email address"
                  value={personalFormik.values.email}
                  disabled
                  style={{ marginBottom: 20, opacity: 0.7 }}
                />
                <TextField
                  name="phone"
                  type="tel"
                  placeholder="Phone number"
                  value={personalFormik.values.phone}
                  onChange={personalFormik.handleChange}
                />
                <div className={styles["form-actions"]}>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <>
              <div className={styles["section-header"]}>
                <div>
                  <h2>Security</h2>
                  <p>Manage your password and account security</p>
                </div>
              </div>
              <form onSubmit={passwordFormik.handleSubmit} className={styles["form-section"]}>
                <TextField
                  name="password"
                  type="password"
                  placeholder="New password"
                  value={passwordFormik.values.password}
                  onChange={passwordFormik.handleChange}
                  minLength={6}
                  style={{ marginBottom: 20 }}
                />
                <TextField
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  value={passwordFormik.values.confirmPassword}
                  onChange={passwordFormik.handleChange}
                  minLength={6}
                />
                <div className={styles["form-actions"]}>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Updating..." : "Update Password"}
                  </Button>
                </div>
              </form>
            </>
          )}

          {/* Passengers Tab */}
          {activeTab === 'passengers' && (
            <>
              {!isEditingPassenger ? (
                <>
                  <div className={styles["section-header"]}>
                    <div>
                      <h2>Saved Passengers</h2>
                      <p>Manage your saved passenger profiles for faster booking</p>
                    </div>
                    <Button
                      variant="primary"
                      onClick={() => {
                        setCurrentPassenger(null);
                        setIsEditingPassenger(true);
                      }}
                    >
                      <PlusIcon width={18} style={{ marginRight: 8 }} /> Add Passenger
                    </Button>
                  </div>

                  {isLoadingPassengers ? (
                    <div className={styles["loading"]}>Loading passengers...</div>
                  ) : passengers.length === 0 ? (
                    <div className={styles["empty-state"]}>
                      <p>You haven't saved any passengers yet.</p>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setCurrentPassenger(null);
                          setIsEditingPassenger(true);
                        }}
                      >
                        Add your first passenger
                      </Button>
                    </div>
                  ) : (
                    <div className={styles["passengers-grid"]}>
                      {passengers.map(passenger => (
                        <div key={passenger.id} className={styles["passenger-card"]}>
                          <div className={styles["card-header"]}>
                            <h4>{passenger.firstName} {passenger.lastName}</h4>
                            <span className={styles["passport"]}>{passenger.passportNumber}</span>
                          </div>
                          <div className={styles["card-details"]}>
                            <p>Born: {new Date(passenger.dateOfBirth).toLocaleDateString()}</p>
                            <p>{passenger.email}</p>
                            <p>{passenger.phone}</p>
                          </div>
                          <div className={styles["card-actions"]}>
                            <button
                              className={styles["edit-btn"]}
                              onClick={() => {
                                setCurrentPassenger(passenger);
                                setIsEditingPassenger(true);
                              }}
                            >
                              <EditIcon width={16} /> Edit
                            </button>
                            <button
                              className={styles["delete-btn"]}
                              onClick={() => handleDeletePassenger(passenger.id)}
                            >
                              <TrashIcon width={16} /> Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <PassengerEditForm
                  passenger={currentPassenger}
                  onCancel={() => setIsEditingPassenger(false)}
                  onSave={() => {
                    setIsEditingPassenger(false);
                    fetchPassengers();
                  }}
                />
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
};

// Sub-component for Adding/Editing Passenger
const PassengerEditForm: FC<{
  passenger: PassengerProfile | null;
  onCancel: () => void;
  onSave: () => void;
}> = ({ passenger, onCancel, onSave }) => {
  const { showSuccess, showError } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formik = useFormik<CreatePassengerProfileRequest>({
    initialValues: {
      firstName: passenger?.firstName || "",
      lastName: passenger?.lastName || "",
      middleName: passenger?.middleName || "",
      dateOfBirth: passenger?.dateOfBirth ? new Date(passenger.dateOfBirth).toISOString().split('T')[0] : "",
      email: passenger?.email || "",
      phone: passenger?.phone || "",
      passportNumber: passenger?.passportNumber || "",
      redressNumber: passenger?.redressNumber || "",
      knownTravelerNumber: passenger?.knownTravelerNumber || "",
    },
    onSubmit: async (values) => {
      try {
        setIsSubmitting(true);
        if (passenger) {
          await passengerProfilesService.update(passenger.id, values);
          showSuccess("Passenger updated successfully");
        } else {
          await passengerProfilesService.create(values);
          showSuccess("Passenger created successfully");
        }
        onSave();
      } catch (error: any) {
        showError(error?.response?.data?.message || "Failed to save passenger");
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  return (
    <>
      <div className={styles["section-header"]}>
        <div>
          <h2>{passenger ? "Edit Passenger" : "Add New Passenger"}</h2>
          <p>Enter the passenger's details exactly as they appear on their passport</p>
        </div>
      </div>
      <form onSubmit={formik.handleSubmit} className={styles["form-section"]}>
        <div className={styles["form-row"]}>
          <TextField
            name="firstName"
            placeholder="First Name"
            value={formik.values.firstName}
            onChange={formik.handleChange}
            required
          />
          <TextField
            name="middleName"
            placeholder="Middle Name (Optional)"
            value={formik.values.middleName}
            onChange={formik.handleChange}
          />
        </div>
        <div className={styles["form-row"]}>
          <TextField
            name="lastName"
            placeholder="Last Name"
            value={formik.values.lastName}
            onChange={formik.handleChange}
            required
          />
          <TextField
            name="dateOfBirth"
            type="date"
            placeholder="Date of Birth"
            value={formik.values.dateOfBirth}
            onChange={formik.handleChange}
            required
          />
        </div>
        <div className={styles["form-row"]}>
          <TextField
            name="email"
            type="email"
            placeholder="Email"
            value={formik.values.email}
            onChange={formik.handleChange}
            required
          />
          <TextField
            name="phone"
            type="tel"
            placeholder="Phone"
            value={formik.values.phone}
            onChange={formik.handleChange}
            required
          />
        </div>
        <TextField
          name="passportNumber"
          placeholder="Passport Number"
          value={formik.values.passportNumber}
          onChange={formik.handleChange}
          required
          style={{ marginBottom: 20 }}
        />
        <div className={styles["form-row"]}>
          <TextField
            name="redressNumber"
            placeholder="Redress Number (Optional)"
            value={formik.values.redressNumber}
            onChange={formik.handleChange}
          />
          <TextField
            name="knownTravelerNumber"
            placeholder="Known Traveler Number (Optional)"
            value={formik.values.knownTravelerNumber}
            onChange={formik.handleChange}
          />
        </div>

        <div className={styles["form-actions"]}>
          <Button variant="secondary" onClick={onCancel} style={{ marginRight: 12 }}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Passenger"}
          </Button>
        </div>
      </form>
    </>
  );
};

export default () => (
  <ProtectedRoute>
    <ProfilePage />
  </ProtectedRoute>
);
