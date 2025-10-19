import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Typography } from "@material-tailwind/react";
import TeacherLayout from "../components/TeacherLayout";
import ScheduleCard from "../components/ScheduleCard";
import { listSchedules, deleteSchedule as deleteScheduleRequest } from "../api";
import { useAuth } from "../context/AuthContext.jsx";
import useDocumentTitle from "../utils/useDocumentTitle";
import { brandBorder, primaryButtonFilledClasses } from "../utils/theme";

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useDocumentTitle("Professor dashboard");

  useEffect(() => {
    if (!token) {
      return;
    }

    let isMounted = true;

    const fetchSchedules = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await listSchedules(token);
        if (isMounted) {
          setSchedules(response ?? []);
        }
      } catch (err) {
        console.error("Failed to load schedules", err);
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchSchedules();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleOpenSchedule = (schedule) => {
    navigate(`/teacher/schedules/${schedule.id}`);
  };

  const handleDelete = async (schedule) => {
    try {
      await deleteScheduleRequest(token, schedule.id);
      setSchedules((items) => items.filter((item) => item.id !== schedule.id));
    } catch (err) {
      console.error("Failed to delete schedule", err);
      setError(err.message);
    }
  };

  const totalStudents = useMemo(
    () => schedules.reduce((sum, item) => sum + (item.student_count ?? 0), 0),
    [schedules]
  );

  const actions = (
    <Button
      color="purple"
      size="sm"
      className={primaryButtonFilledClasses}
      onClick={() => navigate("/teacher/schedules/new")}
    >
      Create schedule
    </Button>
  );

  return (
    <TeacherLayout pageTitle="Your schedules" actions={actions}>
      {error ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <Typography variant="small" className="text-slate-500">
            Active schedules
          </Typography>
          <Typography variant="h4" className="font-display text-slate-800">
            {schedules.length}
          </Typography>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <Typography variant="small" className="text-slate-500">
            Students included
          </Typography>
          <Typography variant="h4" className="font-display text-slate-800">
            {totalStudents}
          </Typography>
        </div>
      </div>
      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
          Loading schedules…
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {schedules.map((schedule) => (
            <ScheduleCard
              key={schedule.id}
              schedule={schedule}
              onOpen={handleOpenSchedule}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
      {!isLoading && schedules.length === 0 ? (
        <div
          className="mt-10 rounded-2xl border border-dashed bg-white/60 p-10 text-center"
          style={{ borderColor: brandBorder }}
        >
          <Typography variant="h6" className="font-display text-slate-700">
            You haven’t created any schedules yet
          </Typography>
          <Typography variant="small" className="mt-2 text-slate-500">
            Create your first schedule to start gathering availability from students.
          </Typography>
          <Button
            color="purple"
            className={`mt-6 ${primaryButtonFilledClasses}`}
            onClick={() => navigate("/teacher/schedules/new")}
          >
            Create schedule
          </Button>
        </div>
      ) : null}
    </TeacherLayout>
  );
}
