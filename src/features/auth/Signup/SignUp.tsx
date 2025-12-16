import { CheckBox, TextField } from "@shared/ui/Input";
import styles from "./SignUp.module.scss";
import Button from "@shared/ui/Button";
import GoogleIcon from "@shared/icons/18/google.svg?react";
import FacebookIcon from "@shared/icons/18/facebook.svg?react";
import CloseIcon from "@shared/icons/32/x close no.svg?react";
import { FC, HTMLAttributes, useState } from "react";
import { useAuth } from "@context/AuthContext";
import { useFormik } from "formik";

interface SignUpProps extends HTMLAttributes<HTMLDivElement> {
  setOpen: (open: boolean) => void;
  initialLoginMode?: boolean;
}

interface SignUpFormValues {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  agreeToTerms: boolean;
  dealAlerts: boolean;
}

export const SignUp: FC<SignUpProps> = ({ setOpen, initialLoginMode = false }) => {
  const { login, register, error, clearError } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(initialLoginMode);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const formik = useFormik<SignUpFormValues>({
    initialValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      phone: "",
      agreeToTerms: false,
      dealAlerts: false,
    },
    onSubmit: async (values) => {
      try {
        setIsLoading(true);
        setSubmitError(null);
        clearError();

        if (isLoginMode) {
          await login({
            email: values.email,
            password: values.password,
          });
        } else {
          if (!values.agreeToTerms) {
            setSubmitError("You must agree to the terms and conditions");
            return;
          }
          await register({
            email: values.email,
            password: values.password,
            firstName: values.firstName,
            lastName: values.lastName,
            phone: values.phone || undefined,
          });
        }

        // Close modal on success
        setOpen(false);
        formik.resetForm();
      } catch (err: any) {
        setSubmitError(
          err?.message || "An error occurred. Please try again."
        );
      } finally {
        setIsLoading(false);
      }
    },
  });

  return (
    <div className={styles["signup"]}>
      <div>
        <h3>{isLoginMode ? "Sign in to AtlasAir" : "Sign up for AtlasAir"}</h3>
        <CloseIcon
          className={styles["close"]}
          onClick={() => {
            setOpen(false);
            formik.resetForm();
            setSubmitError(null);
            clearError();
          }}
        />
      </div>
      <p>
        {isLoginMode
          ? "Sign in to your account to continue booking flights."
          : "AtlasAir is totally free to use. Sign up using your email address or phone number below to get started."}
      </p>

      <form onSubmit={formik.handleSubmit}>
        {!isLoginMode && (
          <>
            <TextField
              name="firstName"
              placeholder="First name"
              value={formik.values.firstName}
              onChange={formik.handleChange}
              required
            />
            <TextField
              name="lastName"
              placeholder="Last name"
              value={formik.values.lastName}
              onChange={formik.handleChange}
              required
            />
          </>
        )}
        <TextField
          name="email"
          type="email"
          placeholder="Email address"
          value={formik.values.email}
          onChange={formik.handleChange}
          required
        />
        <TextField
          name="password"
          type="password"
          placeholder="Password"
          value={formik.values.password}
          onChange={formik.handleChange}
          required
          minLength={6}
        />
        {!isLoginMode && (
          <>
            <TextField
              name="phone"
              type="tel"
              placeholder="Phone number (optional)"
              value={formik.values.phone}
              onChange={formik.handleChange}
            />
            <CheckBox
              name="agreeToTerms"
              label="I agree to the terms and conditions"
              checked={formik.values.agreeToTerms}
              onChange={formik.handleChange}
            />
            <CheckBox
              name="dealAlerts"
              label="Send me the latest deal alerts"
              checked={formik.values.dealAlerts}
              onChange={formik.handleChange}
            />
          </>
        )}

        {(error || submitError) && (
          <div style={{
            color: "#dc3545",
            fontSize: "14px",
            marginBottom: "0",
            padding: "12px 16px",
            background: "#f8d7da",
            borderRadius: "8px",
            border: "1px solid #f5c6cb"
          }}>
            {error || submitError}
          </div>
        )}

        <Button type="submit" disabled={isLoading}>
          {isLoading
            ? "Loading..."
            : isLoginMode
              ? "Sign in"
              : "Create account"}
        </Button>
      </form>

      <div style={{ marginTop: "8px", textAlign: "center" }}>
        <button
          type="button"
          onClick={() => {
            setIsLoginMode(!isLoginMode);
            setSubmitError(null);
            clearError();
            formik.resetForm();
          }}
          style={{
            background: "none",
            border: "none",
            color: "var(--purple-blue, #0066cc)",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "500",
            padding: "0",
            transition: "color 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.textDecoration = "underline";
            e.currentTarget.style.color = "var(--purple-blue-dark, #0052a3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.textDecoration = "none";
            e.currentTarget.style.color = "var(--purple-blue, #0066cc)";
          }}
        >
          {isLoginMode
            ? "Don't have an account? Sign up"
            : "Already have an account? Sign in"}
        </button>
      </div>

      <span className={styles["or"]}>or</span>
      <Button
        variant="secondary"
        leftIcon={<GoogleIcon />}
        className="google-btn"
        type="button"
        disabled
      >
        Continue with Google
      </Button>
      <Button
        variant="secondary"
        leftIcon={<FacebookIcon />}
        className="fb-btn"
        type="button"
        disabled
      >
        Continue with Facebook
      </Button>
    </div>
  );
};
