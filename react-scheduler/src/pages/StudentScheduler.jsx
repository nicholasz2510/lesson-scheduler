import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Button,
  Card,
  CardBody,
  Typography,
} from "@material-tailwind/react";
import AvailabilityGrid from "../components/AvailabilityGrid";
import {
  availabilityMapToStartTimes,
  buildAvailabilityMapFromEntries,
  formatScheduleDates,
  generateTimeSlots,
} from "../utils/schedule";
import useDocumentTitle from "../utils/useDocumentTitle";
import {
  brandColor,
  brandSurface,
  brandSurfaceLight,
  primaryButtonFilledClasses,
  primaryButtonOutlinedClasses,
} from "../utils/theme";
import { fetchPublicSchedule, syncStudentAvailability } from "../api";

export default function StudentScheduler() {
  const { scheduleId, studentId } = useParams();
  const navigate = useNavigate();

  const [schedule, setSchedule] = useState(null);
  const [timeSlots, setTimeSlots] = useState([]);
  const [availability, setAvailability] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  useDocumentTitle("Share your availability");

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetchPublicSchedule(scheduleId);
        if (!isMounted) {
          return;
        }

        setSchedule(response);
        const slots = generateTimeSlots(response.start_time ?? "09:00", response.end_time ?? "17:00");
        setTimeSlots(slots);

        const studentEntries = (response.availabilities ?? []).filter(
          (entry) => entry.student_id?.toString() === studentId
        );
        setAvailability(
          buildAvailabilityMapFromEntries(response.dates ?? [], slots, studentEntries)
        );
        setHasSubmitted(studentEntries.length > 0);
      } catch (err) {
        console.error("Failed to load schedule", err);
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [scheduleId, studentId]);

  const student = useMemo(() => {
    if (!schedule) {
      return null;
    }
    return schedule.students.find((item) => item.id?.toString() === studentId) ?? null;
  }, [schedule, studentId]);

  useDocumentTitle(
    student ? `${student.name} – Share availability` : "Share availability"
  );

  const handleToggleSlot = (date, slot, value) => {
    setAvailability((previous) => ({
      ...previous,
      [date]: {
        ...(previous?.[date] ?? {}),
        [slot]: value !== undefined ? value : !previous?.[date]?.[slot],
      },
    }));
  };

  const handleSubmit = async () => {
    if (!schedule || !student) {
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const payload = {
        schedule_id: schedule.id,
        student_id: student.id,
        start_times: availabilityMapToStartTimes(availability),
      };
      await syncStudentAvailability(payload);
      setHasSubmitted(true);
    } catch (err) {
      console.error("Failed to submit availability", err);
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div
        className="min-h-screen px-4 py-16"
        style={{
          background: `linear-gradient(135deg, ${brandSurface} 0%, ${brandSurfaceLight} 60%, #f8fafc 100%)`,
        }}
      >
        <Card className="mx-auto w-full max-w-5xl shadow-xl">
          <CardBody className="p-10 text-center text-slate-500">Loading…</CardBody>
        </Card>
      </div>
    );
  }

  if (!schedule || !student || error) {
    return (
      <div
        className="min-h-screen px-4 py-16"
        style={{
          background: `linear-gradient(135deg, ${brandSurface} 0%, ${brandSurfaceLight} 60%, #f8fafc 100%)`,
        }}
      >
        <Card className="mx-auto w-full max-w-3xl shadow-xl">
          <CardBody className="space-y-4 p-10 text-center text-red-600">
            <Typography variant="h5" className="font-display">
              We couldn’t load your schedule.
            </Typography>
            <Typography variant="small" className="text-red-500">
              {error || "Please ask your teacher for the link again."}
            </Typography>
            <Button color="gray" variant="outlined" onClick={() => navigate(-1)}>
              Go back
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen px-4 py-16"
      style={{
        background: `linear-gradient(135deg, ${brandSurface} 0%, ${brandSurfaceLight} 60%, #f8fafc 100%)`,
      }}
    >
      <Card className="mx-auto w-full max-w-5xl shadow-xl">
        <CardBody className="space-y-8 p-8">
          <div className="space-y-2 text-center">
            <Typography
              variant="small"
              className="uppercase tracking-wide"
              style={{ color: brandColor }}
            >
              {schedule.title}
            </Typography>
            <Typography variant="h4" className="font-display text-slate-800">
              Hi {student.name}, share your availability
            </Typography>
            <Typography variant="small" className="text-slate-500">
              {formatScheduleDates(schedule.dates)}
            </Typography>
            <Typography variant="small" className="text-slate-500">
              Select the times that work for you.
            </Typography>
          </div>
          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          ) : null}
          <AvailabilityGrid
            dates={schedule.dates ?? []}
            timeSlots={timeSlots}
            availability={availability}
            onToggle={handleToggleSlot}
            title="When can you attend?"
            subtitle="Choose any times on the grid that work for you."
          />
          <div className="flex flex-wrap items-center justify-end gap-3">
            <Button
              variant="outlined"
              color="purple"
              className={primaryButtonOutlinedClasses}
              onClick={() => navigate(-1)}
            >
              Back
            </Button>
            <Button
              color="purple"
              className={primaryButtonFilledClasses}
              onClick={handleSubmit}
              disabled={isSaving}
            >
              {isSaving ? "Submitting…" : hasSubmitted ? "Update availability" : "Submit availability"}
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}