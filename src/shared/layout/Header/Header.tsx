import { FC, useState } from "react";
import Logo from "../../logos/tripma/AtlasAir.png";
import MenuIcon from "@shared/icons/32/menu.svg?react";
import { Link } from "react-router-dom";
import styles from "./Header.module.scss";
import { Button } from "@shared/ui/Button";
import { useAuth } from "@context/AuthContext";
import { Modal } from "@shared/ui/Modal/Modal";
import { SignUp } from "@features/auth/Signup/SignUp";
import { ProfileDropdown } from "@components/ProfileDropdown";
import clsx from "clsx";
interface HeaderProps {
  className?: string;
  variant?: "full" | "basic";
}
export const Header: FC<HeaderProps> = ({ className, variant }) => {
  const { isAuthenticated, user, logout } = useAuth();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(false);

  const openAuthDialog = (loginMode: boolean) => {
    setIsLoginMode(loginMode);
    setShowAuthDialog(true);
  };

  return (
    <header className={clsx(styles.header, className, styles[variant || ""])}>
      <div>
        <MenuIcon className={styles["menu-icon"]} />
        <Link to="/" className={styles.logo}>
          <img src={Logo} alt="AtlasAir" style={{ height: "48px" }} />
        </Link>
      </div>
      <ul className={styles.nav}>
        <li>
          <Link to="/flights">Flights</Link>
        </li>
        <li>
          <Link to="/hotels">Hotels</Link>
        </li>
        <li>
          <Link to="/packages">Packages</Link>
        </li>
        {!isAuthenticated && (
          <>
            <li>
              <Link to="" onClick={() => openAuthDialog(true)}>
                Sign in
              </Link>
            </li>
            <Button size="sm" onClick={() => openAuthDialog(false)}>
              Sign up
            </Button>
          </>
        )}
        {isAuthenticated && user && (
          <>
            <li className={styles["my-trips"]}>
              <Link to="/my-bookings">My trips</Link>
            </li>
            {user.role === "ADMIN" && (
              <li>
                <Link to="/admin">Admin</Link>
              </li>
            )}
            <li>
              <ProfileDropdown user={user} />
            </li>
          </>
        )}
      </ul>
      <Modal opened={showAuthDialog} setOpened={setShowAuthDialog}>
        <SignUp setOpen={setShowAuthDialog} initialLoginMode={isLoginMode} />
      </Modal>
    </header>
  );
};
