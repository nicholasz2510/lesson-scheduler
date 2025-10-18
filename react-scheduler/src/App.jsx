import { Navigate, Route, Routes } from "react-router-dom";
import TeacherDashboard from "./pages/TeacherDashboard";
import TeacherSignIn from "./pages/TeacherSignIn";
import CreateSchedule from "./pages/CreateSchedule";
import ScheduleDetail from "./pages/ScheduleDetail";
import StudentSelect from "./pages/StudentSelect";
import StudentScheduler from "./pages/StudentScheduler";

function App() {
  return (
    <Routes>
      <Route index element={<TeacherSignIn />} />
      <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
      <Route path="/teacher/schedules/new" element={<CreateSchedule />} />
      <Route path="/teacher/schedules/:scheduleId" element={<ScheduleDetail />} />
      <Route path="/s/:scheduleId" element={<StudentSelect />} />
      <Route path="/s/:scheduleId/:studentId" element={<StudentScheduler />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
