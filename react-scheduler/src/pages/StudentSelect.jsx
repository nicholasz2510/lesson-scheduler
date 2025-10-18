import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardBody, Typography } from "@material-tailwind/react";
import { mockScheduleDetails } from "../data/mockData";
import useDocumentTitle from "../utils/useDocumentTitle";

export default function StudentSelect() {
  const { scheduleId } = useParams();
  const navigate = useNavigate();

  const schedule = useMemo(
    () => mockScheduleDetails[scheduleId] ?? mockScheduleDetails["spring-recital-week"],
    [scheduleId]
  );

  useDocumentTitle(`${schedule.title} – Choose your name`);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-slate-100 px-4 py-16">
      <Card className="mx-auto w-full max-w-3xl shadow-xl">
        <CardBody className="space-y-8 p-10">
          <div className="space-y-2 text-center">
            <Typography variant="small" className="uppercase tracking-wide text-emerald-500">
              {schedule.title}
            </Typography>
            <Typography variant="h4" className="font-display text-slate-800">
              Who’s filling availability?
            </Typography>
            <Typography variant="small" className="text-slate-500">
              Choose your name to continue. If you don’t see your name, contact your teacher.
            </Typography>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {schedule.students.map((student) => (
              <button
                key={student.id}
                type="button"
                onClick={() => navigate(`/s/${schedule.id}/${student.id}`)}
                className="rounded-2xl border border-slate-100 bg-white px-6 py-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg"
              >
                <Typography variant="h6" className="font-display text-slate-800">
                  {student.name}
                </Typography>
                <Typography variant="small" className="text-slate-500">
                  {student.lessonLength} minute lesson
                </Typography>
              </button>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
