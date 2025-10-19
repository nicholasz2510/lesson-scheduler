import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Card, CardBody, Typography } from "@material-tailwind/react";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import AvailabilityGrid from "../components/AvailabilityGrid";
import { createBlankAvailability, mockScheduleDetails } from "../data/mockData";
import useDocumentTitle from "../utils/useDocumentTitle";
import {
  brandColor,
  primaryButtonFilledClasses,
} from "../utils/theme";

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

  useDocumentTitle(`${student.name} availability – ${schedule.title}`);

  const handleToggle = (date, slot, value) => {
    setAvailability((previous) => ({
      ...previous,
      [date]: {
        ...previous[date],
        [slot]: value !== undefined ? value : !previous[date][slot],
      },
    }));
  };

  const handleSubmit = () => {
    // TODO: send the student availability to the backend.
    setSubmitted(true);
  };

  const handleBack = () => {
    navigate(`/s/${scheduleId}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12">
      <Card className="mx-auto w-full max-w-5xl shadow-lg">
        <CardBody className="space-y-8 p-8 md:p-12">
          <div className="flex items-center gap-4">
            <Button
              variant="text"
              color="gray"
              className="flex items-center gap-2 p-2"
              onClick={handleBack}
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Back to student selection
            </Button>
          </div>
          <div className="space-y-2 text-center">
            <Typography
              variant="small"
              className="uppercase tracking-wide"
              style={{ color: brandColor }}
            >
              {schedule.title}
            </Typography>
            <Typography variant="h4" className="font-display text-slate-800">
              {student.name}, share your availability
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
            <Button
              color="purple"
              size="lg"
              className={primaryButtonFilledClasses}
              onClick={handleSubmit}
              disabled={submitted}
            >
              {submitted ? "Availability submitted" : "Submit"}
            </Button>
            {submitted ? (
              <Typography variant="small" style={{ color: brandColor }}>
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
