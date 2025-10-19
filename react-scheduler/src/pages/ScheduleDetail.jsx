import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Button,
  Card,
  CardBody,
  Chip,
  Typography,
} from "@material-tailwind/react";
import { format, parseISO } from "date-fns";
import TeacherLayout from "../components/TeacherLayout";
import AvailabilityGrid from "../components/AvailabilityGrid";
import {
  availabilityMapToStartTimes,
  buildAvailabilityMapFromEntries,
  formatScheduleDates,
  generateTimeSlots,
} from "../utils/schedule";
import { copyToClipboard, getAppOrigin } from "../utils/environment";
import useDocumentTitle from "../utils/useDocumentTitle";
import {
  brandColor,
  primaryButtonFilledClasses,
  primaryButtonOutlinedClasses,
  primaryChipClasses,
} from "../utils/theme";
import {
  finalizeSchedule as finalizeScheduleRequest,
  generateSchedule as generateScheduleRequest,
  getSchedule,
  syncTeacherAvailability,
} from "../api";
import { useAuth } from "../context/AuthContext.jsx";

const formatRangeLabel = (startIso, endIso) => {
  const start = parseISO(startIso);
  const end = parseISO(endIso);
  const startLabel = format(start, "h:mm a");
  const endLabel = format(end, "h:mm a");
  return `${startLabel} – ${endLabel}`;
};

export default function ScheduleDetail() {
  const { scheduleId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [schedule, setSchedule] = useState(location.state?.schedule ?? null);
  const [timeSlots, setTimeSlots] = useState([]);
  const [availability, setAvailability] = useState({});
  const [students, setStudents] = useState([]);
  const [results, setResults] = useState([]);
  const [unscheduled, setUnscheduled] = useState([]);
  const [isLoading, setIsLoading] = useState(!location.state?.schedule);
  const [error, setError] = useState(null);
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  useDocumentTitle(
    schedule ? `${schedule.title} – Professor view` : "Schedule – Professor view"
  );

  useEffect(() => {
    if (!token || !scheduleId) {
      return;
    }

    let isMounted = true;

    const loadSchedule = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await getSchedule(token, scheduleId);
        if (!isMounted) {
          return;
        }

        setSchedule(response);
        setUnscheduled([]);
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

    loadSchedule();

    return () => {
      isMounted = false;
    };
  }, [scheduleId, token]);

  useEffect(() => {
    if (!schedule) {
      return;
    }

    const slots = generateTimeSlots(schedule.start_time ?? "09:00", schedule.end_time ?? "17:00");
    setTimeSlots(slots);

    const teacherAvailabilities = (schedule.availabilities ?? []).filter(
      (entry) => entry.teacher_id === schedule.teacher_id
    );
    setAvailability(
      buildAvailabilityMapFromEntries(schedule.dates ?? [], slots, teacherAvailabilities)
    );

    const availabilityByStudent = new Map();
    (schedule.availabilities ?? []).forEach((entry) => {
      if (entry.student_id) {
        availabilityByStudent.set(entry.student_id, true);
      }
    });

    setStudents(
      (schedule.students ?? []).map((student) => ({
        ...student,
        submitted: availabilityByStudent.has(student.id),
      }))
    );

    if (schedule.finalized_entries?.length) {
      setResults(
        schedule.finalized_entries.map((entry) => ({
          student_id: entry.student_id,
          start_time: entry.start_time,
          end_time: entry.end_time,
        }))
      );
      setUnscheduled([]);
    }
  }, [schedule]);

  const shareLink = useMemo(() => {
    if (!schedule) {
      return "";
    }
    const slug = schedule.slug ?? schedule.id;
    return `${getAppOrigin()}/s/${slug}`;
  }, [schedule]);

  const handleToggleSlot = (date, slot, value) => {
    setAvailability((previous) => ({
      ...previous,
      [date]: {
        ...(previous?.[date] ?? {}),
        [slot]: value !== undefined ? value : !previous?.[date]?.[slot],
      },
    }));
  };

  const handleSaveAvailability = async () => {
    if (!schedule) {
      return;
    }

    setSavingAvailability(true);
    setError(null);
    try {
      const payload = {
        schedule_id: schedule.id,
        start_times: availabilityMapToStartTimes(availability),
      };
      await syncTeacherAvailability(token, payload);
    } catch (err) {
      console.error("Failed to save availability", err);
      setError(err.message);
    } finally {
      setSavingAvailability(false);
    }
  };

  const handleRunScheduling = async () => {
    if (!schedule) {
      return;
    }

    setScheduling(true);
    setError(null);
    try {
      const lessonLengths = new Set((students ?? []).map((student) => student.lesson_length));
      const payload = {};
      if (lessonLengths.size === 1) {
        const [length] = lessonLengths;
        if (length) {
          payload.slot_minutes = length;
        }
      }

      const result = await generateScheduleRequest(token, schedule.id, payload);
      setResults(result.lessons ?? []);
      setUnscheduled(result.unscheduled_student_ids ?? []);
    } catch (err) {
      console.error("Failed to generate schedule", err);
      setError(err.message);
    } finally {
      setScheduling(false);
    }
  };

  const handleFinalize = async () => {
    if (!schedule || results.length === 0) {
      return;
    }

    setFinalizing(true);
    setError(null);
    try {
      const payload = {
        entries: results.map((lesson) => ({
          student_id: lesson.student_id,
          start_time: lesson.start_time,
          end_time: lesson.end_time,
        })),
      };
      const updated = await finalizeScheduleRequest(token, schedule.id, payload);
      setSchedule(updated);
      setResults((updated.finalized_entries ?? []).map((entry) => ({
        student_id: entry.student_id,
        start_time: entry.start_time,
        end_time: entry.end_time,
      })));
      setUnscheduled([]);
    } catch (err) {
      console.error("Failed to finalize schedule", err);
      setError(err.message);
    } finally {
      setFinalizing(false);
    }
  };

  const resolvedStudents = useMemo(() => {
    const byId = new Map((students ?? []).map((student) => [student.id, student]));
    return { byId };
  }, [students]);

  const lessonCards = useMemo(() => {
    return (results ?? []).map((lesson) => {
      const student = resolvedStudents.byId.get(lesson.student_id);
      const studentName = student?.name ?? "Student";
      return {
        id: `${lesson.student_id}-${lesson.start_time}`,
        name: studentName,
        dayLabel: format(parseISO(lesson.start_time), "EEEE, MMMM d"),
        rangeLabel: formatRangeLabel(lesson.start_time, lesson.end_time),
      };
    });
  }, [results, resolvedStudents]);

  if (isLoading) {
    return (
      <TeacherLayout pageTitle="Loading schedule" actions={null}>
        <div className="flex min-h-[50vh] items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <Typography variant="small" className="text-slate-500">
            Loading schedule…
          </Typography>
        </div>
      </TeacherLayout>
    );
  }

  if (!schedule) {
    return (
      <TeacherLayout pageTitle="Schedule" actions={null}>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-600">
          Unable to load this schedule.
        </div>
      </TeacherLayout>
    );
  }

  const actions = (
    <>
      <Button
        variant="outlined"
        color="purple"
        className={primaryButtonOutlinedClasses}
        onClick={() => copyToClipboard(shareLink)}
      >
        Share link
      </Button>
      <Button
        color="purple"
        className={primaryButtonFilledClasses}
        onClick={handleRunScheduling}
        disabled={scheduling || savingAvailability}
      >
        {scheduling ? "Scheduling…" : "Schedule!"}
      </Button>
    </>
  );

  return (
    <TeacherLayout pageTitle={schedule.title} actions={actions}>
      {error ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Typography variant="small" className="text-slate-500">
            Dates
          </Typography>
          <Typography variant="h5" className="font-display text-slate-800">
            {formatScheduleDates(schedule.dates)}
          </Typography>
        </div>
        <Chip
          value={schedule.is_finalized ? "Finalized" : "Professor view"}
          color="purple"
          variant="filled"
          className={primaryChipClasses}
        />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <AvailabilityGrid
            dates={schedule.dates ?? []}
            timeSlots={timeSlots}
            availability={availability}
            onToggle={handleToggleSlot}
            title="Set your availability"
            subtitle="Toggle the times you are willing to teach."
          />
          <div className="flex flex-wrap items-center justify-end gap-3">
            <Button
              variant="outlined"
              color="purple"
              className={primaryButtonOutlinedClasses}
              onClick={handleSaveAvailability}
              disabled={savingAvailability}
            >
              {savingAvailability ? "Saving…" : "Save availability"}
            </Button>
          </div>
          <Card>
            <CardBody className="space-y-4">
              <div className="flex items-center justify-between">
                <Typography variant="h6" className="font-display text-slate-800">
                  Suggested schedule
                </Typography>
                <Typography variant="small" className="text-slate-400">
                  Based on submitted availability
                </Typography>
              </div>
              {lessonCards.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center">
                  <Typography variant="small" className="text-slate-500">
                    Run the scheduler once students have submitted their availability.
                  </Typography>
                </div>
              ) : (
                <div className="space-y-3">
                  {lessonCards.map((lesson) => (
                    <div
                      key={lesson.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white p-4"
                    >
                      <div>
                        <Typography variant="h6" className="font-display text-slate-800">
                          {lesson.name}
                        </Typography>
                        <Typography variant="small" className="text-slate-500">
                          {lesson.dayLabel}
                        </Typography>
                      </div>
                      <Typography variant="h6" className="font-display" style={{ color: brandColor }}>
                        {lesson.rangeLabel}
                      </Typography>
                    </div>
                  ))}
                </div>
              )}
              {unscheduled.length > 0 ? (
                <Typography variant="small" className="text-sm text-orange-600">
                  Unable to place students: {unscheduled.map((id) => resolvedStudents.byId.get(id)?.name ?? id).join(", ")}
                </Typography>
              ) : null}
              <div className="flex justify-end">
                <Button
                  color="purple"
                  className={primaryButtonFilledClasses}
                  onClick={handleFinalize}
                  disabled={lessonCards.length === 0 || finalizing}
                >
                  {finalizing ? "Finalizing…" : "Finalize schedule"}
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
        <Card className="h-max">
          <CardBody className="space-y-5">
            <Typography variant="h6" className="font-display text-slate-800">
              Students
            </Typography>
            <div className="space-y-3">
              {(students ?? []).map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3"
                >
                  <div>
                    <Typography variant="small" className="font-medium text-slate-700">
                      {student.name || "Unnamed student"}
                    </Typography>
                    <Typography variant="small" className="text-slate-500">
                      {student.lesson_length} minute lesson
                    </Typography>
                  </div>
                  <Chip
                    value={student.submitted ? "Submitted" : "Pending"}
                    size="sm"
                    color={student.submitted ? "green" : "gray"}
                    variant={student.submitted ? "filled" : "outlined"}
                  />
                </div>
              ))}
            </div>
            <Button
              color="gray"
              variant="text"
              onClick={() => navigate("/teacher/schedules/new", {
                state: { title: schedule.title, dates: schedule.dates, students },
              })}
            >
              Add or edit students
            </Button>
          </CardBody>
        </Card>
      </div>
    </TeacherLayout>
  );
}
