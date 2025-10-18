import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Typography } from "@material-tailwind/react";
import TeacherLayout from "../components/TeacherLayout";
import ScheduleCard from "../components/ScheduleCard";
import { mockSchedules } from "../data/mockData";
import useDocumentTitle from "../utils/useDocumentTitle";
import { brandBorder, primaryButtonFilledClasses } from "../utils/theme";

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState(mockSchedules);

  useDocumentTitle("Professor dashboard");

  const handleOpenSchedule = (schedule) => {
    navigate(`/teacher/schedules/${schedule.id}`);
  };

  const handleDelete = (schedule) => {
    // TODO: replace with API call to delete schedule.
    setSchedules((items) => items.filter((item) => item.id !== schedule.id));
  };

  const totalStudents = useMemo(
    () => schedules.reduce((sum, item) => sum + (item.students ?? 0), 0),
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
      {schedules.length === 0 ? (
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
