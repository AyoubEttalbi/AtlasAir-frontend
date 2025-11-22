import { FlightsSearch } from "@pages/FlightsSearch";
import { FlightsHome } from "@pages/FlightsHome";
import { HotelsHome } from "@pages/HotelsHome";
import { Layout } from "@shared/layout";
import { createBrowserRouter } from "react-router-dom";
import { FlightPassengerInfo } from "@pages/FlightsPassengerInfo";
import FlightSeatSelection from "@pages/FlightsSeatSelection";
import FlightsPaymentPage from "@pages/FlightsPayment";
import MyBookings from "@pages/MyBookings";
import Profile from "@pages/Profile";
import { ProtectedRoute } from "@components/ProtectedRoute";
import { AdminRoute } from "@components/AdminRoute";
import AdminDashboard from "@pages/Admin/Dashboard";
import AdminFlights from "@pages/Admin/Flights";
import AdminAirlines from "@pages/Admin/Airlines";
import AdminAirports from "@pages/Admin/Airports";
import AdminUsers from "@pages/Admin/Users";
import AdminReservations from "@pages/Admin/Reservations";
import AdminPayments from "@pages/Admin/Payments";
import { Login } from "@pages/Login";
import { RouteError } from "@components/RouteError";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <RouteError />,
    children: [
      {
        index: true,
        element: <FlightsHome />,
      },
      {
        path: "/flights",
        children: [
          { index: true, element: <FlightsHome /> },
          {
            path: "search",
            element: <FlightsSearch />,
          },
          {
            path: "passenger-info",
            element: <FlightPassengerInfo />,
          },
          {
            path: "payment",
            element: <FlightsPaymentPage />,
          },
        ],
      },
      {
        path: "/hotels",
        element: <HotelsHome />,
      },
      {
        path: "/my-bookings",
        element: (
          <ProtectedRoute>
            <MyBookings />
          </ProtectedRoute>
        ),
      },
      {
        path: "/profile",
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "flights/select-seats",
    element: (
      <ProtectedRoute>
        <FlightSeatSelection />
      </ProtectedRoute>
    ),
  },
  {
    path: "/login",
    element: <Login />,
    errorElement: <RouteError />,
  },
  {
    path: "/admin",
    element: (
      <AdminRoute>
        <AdminDashboard />
      </AdminRoute>
    ),
  },
  {
    path: "/admin/flights",
    element: (
      <AdminRoute>
        <AdminFlights />
      </AdminRoute>
    ),
  },
  {
    path: "/admin/airlines",
    element: (
      <AdminRoute>
        <AdminAirlines />
      </AdminRoute>
    ),
  },
  {
    path: "/admin/airports",
    element: (
      <AdminRoute>
        <AdminAirports />
      </AdminRoute>
    ),
  },
  {
    path: "/admin/users",
    element: (
      <AdminRoute>
        <AdminUsers />
      </AdminRoute>
    ),
  },
  {
    path: "/admin/reservations",
    element: (
      <AdminRoute>
        <AdminReservations />
      </AdminRoute>
    ),
  },
  {
    path: "/admin/payments",
    element: (
      <AdminRoute>
        <AdminPayments />
      </AdminRoute>
    ),
  },
  {
    path: "*",
    element: <RouteError />,
  },
]);
export { router };
