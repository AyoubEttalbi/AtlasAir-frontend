import { CheckBox, TextField } from "@shared/ui/Input";
import styles from "./Login.module.scss";
import Button from "@shared/ui/Button";
import GoogleIcon from "@shared/icons/18/google.svg?react";
import FacebookIcon from "@shared/icons/18/facebook.svg?react";
import { FC, useState, useEffect } from "react";
import { useAuth } from "@context/AuthContext";
import { useFormik } from "formik";
import { useNavigate, Link } from "react-router-dom";
import Logo from "@shared/logos/tripma/tripma-lp.svg?react";

interface LoginFormValues {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  agreeToTerms: boolean;
  dealAlerts: boolean;
}

export const Login: FC = () => {
  const { login, register, error, clearError, isAuthenticated } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const formik = useFormik<LoginFormValues>({
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
          // Navigate to home or previous page on success
          navigate("/", { replace: true });
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
          // Navigate to home on successful registration
          navigate("/", { replace: true });
        }

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
    <div className={styles["login-page"]}>
      <div className={styles["login-container"]}>
        <Link to="/" className={styles["logo-link"]}>
          <Logo />
        </Link>
        <div className={styles["login-card"]}>
          <div>
            <h3>{isLoginMode ? "Sign in to AtlasAir" : "Sign up for AtlasAir"}</h3>
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
              <div className={styles["error-message"]}>
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

          <div className={styles["toggle-mode"]}>
            <button
              type="button"
              onClick={() => {
                setIsLoginMode(!isLoginMode);
                setSubmitError(null);
                clearError();
                formik.resetForm();
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
      </div>
    </div>
  );
};

