import { useRouteError, Link } from "react-router-dom";

export const RouteError = () => {
  const error = useRouteError() as any;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "2rem",
        textAlign: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white",
      }}
    >
      <h1 style={{ fontSize: "48px", marginBottom: "1rem" }}>
        {error?.status === 404 ? "404" : "Oops!"}
      </h1>
      <h2 style={{ marginBottom: "1rem" }}>
        {error?.status === 404
          ? "Page Not Found"
          : error?.statusText || error?.message || "Something went wrong"}
      </h2>
      <p style={{ marginBottom: "2rem", opacity: 0.9 }}>
        {error?.status === 404
          ? "The page you're looking for doesn't exist."
          : "An unexpected error occurred. Please try again."}
      </p>
      <div style={{ display: "flex", gap: "1rem" }}>
        <Link
          to="/"
          style={{
            padding: "0.75rem 1.5rem",
            background: "white",
            color: "#667eea",
            textDecoration: "none",
            borderRadius: "4px",
            fontWeight: "bold",
          }}
        >
          Go to Home
        </Link>
        {error?.status !== 404 && (
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "0.75rem 1.5rem",
              background: "transparent",
              color: "white",
              border: "2px solid white",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Reload Page
          </button>
        )}
      </div>
    </div>
  );
};

