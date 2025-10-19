import PropTypes from "prop-types";
import { Navigate, Route, Routes } from "react-router-dom";
import TeacherDashboard from "./pages/TeacherDashboard";
import TeacherSignIn from "./pages/TeacherSignIn";
import TeacherSignUp from "./pages/TeacherSignUp";
import CreateSchedule from "./pages/CreateSchedule";
import ScheduleDetail from "./pages/ScheduleDetail";
import StudentSelect from "./pages/StudentSelect";
import StudentScheduler from "./pages/StudentScheduler";
import { useAuth } from "./context/AuthContext.jsx";

function ProtectedRoute({ children }) {
  const { isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-500">Loading your account…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

function App() {
  const { isAuthenticated, isInitializing } = useAuth();

  return (
    <Routes>
      <Route
        index
        element={
          isAuthenticated && !isInitializing ? <Navigate to="/teacher/dashboard" replace /> : <TeacherSignIn />
        }
      />
      <Route
        path="/teacher/create-account"
        element={
          isAuthenticated && !isInitializing ? <Navigate to="/teacher/dashboard" replace /> : <TeacherSignUp />
        }
      />
      <Route
        path="/teacher/dashboard"
        element={
          <ProtectedRoute>
            <TeacherDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/schedules/new"
        element={
          <ProtectedRoute>
            <CreateSchedule />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/schedules/:scheduleId"
        element={
          <ProtectedRoute>
            <ScheduleDetail />
          </ProtectedRoute>
        }
      />
      <Route path="/s/:scheduleId" element={<StudentSelect />} />
      <Route path="/s/:scheduleId/:studentId" element={<StudentScheduler />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
