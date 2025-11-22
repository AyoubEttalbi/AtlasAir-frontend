import { FC, useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@context/AuthContext";
import styles from "./ProfileDropdown.module.scss";

interface ProfileDropdownProps {
  user: {
    firstName: string;
    lastName: string;
    email: string;
    role?: string;
  };
}

export const ProfileDropdown: FC<ProfileDropdownProps> = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate("/");
  };

  const handleProfileClick = () => {
    navigate("/profile");
    setIsOpen(false);
  };

  const getInitials = () => {
    return `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase();
  };

  return (
    <div className={styles["profile-dropdown"]} ref={dropdownRef}>
      <button
        className={styles["profile-button"]}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Profile menu"
      >
        <div className={styles["avatar"]}>
          {getInitials() || "U"}
        </div>
      </button>

      {isOpen && (
        <div className={styles["dropdown-menu"]}>
          <div className={styles["user-info"]}>
            <div className={styles["user-name"]}>
              {user.firstName} {user.lastName}
            </div>
            <div className={styles["user-email"]}>{user.email}</div>
            {user.role === "ADMIN" && (
              <div className={styles["user-role"]}>Administrator</div>
            )}
          </div>
          <div className={styles["divider"]} />
          <button
            className={styles["dropdown-item"]}
            onClick={handleProfileClick}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8 8C10.2091 8 12 6.20914 12 4C12 1.79086 10.2091 0 8 0C5.79086 0 4 1.79086 4 4C4 6.20914 5.79086 8 8 8Z"
                fill="currentColor"
              />
              <path
                d="M8 10C4.68629 10 2 12.6863 2 16H14C14 12.6863 11.3137 10 8 10Z"
                fill="currentColor"
              />
            </svg>
            Update Profile
          </button>
          <button
            className={styles["dropdown-item"]}
            onClick={handleLogout}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V3.33333C2 2.97971 2.14048 2.64057 2.39052 2.39052C2.64057 2.14048 2.97971 2 3.33333 2H6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M10.6667 11.3333L14 8L10.6667 4.66667"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M14 8H6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

