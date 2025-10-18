import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Card, CardBody, Typography } from "@material-tailwind/react";
import AvailabilityGrid from "../components/AvailabilityGrid";
import {
  createBlankAvailability,
  formatScheduleDates,
  mockScheduleDetails,
} from "../data/mockData";

export default function StudentScheduler() {
  const { scheduleId, studentId } = useParams();
  const navigate = useNavigate();

  const schedule = useMemo(
    () => mockScheduleDetails[scheduleId] ?? mockScheduleDetails["spring-recital-week"],
    [scheduleId]
  );
  const student = useMemo(
    () => schedule.students.find((item) => item.id === studentId) ?? schedule.students[0],
    [schedule.students, studentId]
  );

  const [availability, setAvailability] = useState(() =>
    createBlankAvailability(schedule.dates)
  );
  const [submitted, setSubmitted] = useState(false);

  const handleToggle = (date, slot) => {
    setAvailability((previous) => ({
      ...previous,
      [date]: {
        ...previous[date],
        [slot]: !previous[date][slot],
      },
    }));
  };

  const handleSubmit = () => {
    // TODO: send the student availability to the backend.
    setSubmitted(true);
    setTimeout(() => navigate(`/s/${schedule.id}`), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12">
      <Card className="mx-auto w-full max-w-5xl shadow-lg">
        <CardBody className="space-y-8 p-8 md:p-12">
          <div className="space-y-2 text-center">
            <Typography variant="small" className="uppercase tracking-wide text-emerald-500">
              {schedule.title}
            </Typography>
            <Typography variant="h4" className="font-display text-slate-800">
              {student.name}, share your availability
            </Typography>
            <Typography variant="small" className="text-slate-500">
              Select every time block that works for you on {formatScheduleDates(schedule.dates)}.
            </Typography>
          </div>
          <AvailabilityGrid
            dates={schedule.dates}
            availability={availability}
            onToggle={handleToggle}
            title="When are you free?"
            subtitle="Tap each block to mark when you could meet."
          />
          <div className="flex flex-col items-center gap-4">
            <Button color="green" size="lg" onClick={handleSubmit} disabled={submitted}>
              {submitted ? "Availability submitted" : "Submit"}
            </Button>
            {submitted ? (
              <Typography variant="small" className="text-emerald-600">
                Thanks! Your availability has been shared with your teacher.
              </Typography>
            ) : (
              <Typography variant="small" className="text-slate-500">
                You can return to this page later if your availability changes.
              </Typography>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
