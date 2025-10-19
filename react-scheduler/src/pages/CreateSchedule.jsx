import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Button,
  ButtonGroup,
  Card,
  CardBody,
  IconButton,
  Input,
  List,
  ListItem,
  Tooltip,
  Typography,
} from "@material-tailwind/react";
import { TrashIcon } from "@heroicons/react/24/outline";
import TeacherLayout from "../components/TeacherLayout";
import { createSchedule as createScheduleRequest } from "../api";
import { useAuth } from "../context/AuthContext.jsx";
import { formatScheduleDates } from "../utils/schedule";
import { addDays, format } from "date-fns";
import { copyToClipboard, getAppOrigin } from "../utils/environment";
import useDocumentTitle from "../utils/useDocumentTitle";
import {
  brandColor,
  brandColorDeep,
  brandSurface,
  brandSurfaceLight,
  primaryButtonFilledClasses,
  primaryButtonOutlinedClasses,
  primaryButtonTextClasses,
  primaryInputFocusClasses,
} from "../utils/theme";

const steps = [
  {
    title: "What is the title?",
    helper: "Give this schedule a clear, student-friendly name.",
  },
  {
    title: "Choose dates",
    helper: "Select each date that will be part of this schedule.",
  },
  {
    title: "Who are the students?",
    helper: "Add students and lesson lengths. You can always add more later.",
  },
  {
    title: "Schedule created!",
    helper: "Share the link with students to collect their availability.",
  },
];



const createId = () => Math.random().toString(36).slice(2, 10);

const defaultStudents = [];

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "new-schedule";

export default function CreateSchedule() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useAuth();
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState(location.state?.title ?? "");
  const [selectedDates, setSelectedDates] = useState(location.state?.dates ?? []);
  const [startTime, setStartTime] = useState(location.state?.startTime ?? "09:00");
  const [endTime, setEndTime] = useState(location.state?.endTime ?? "17:00");
  const [students, setStudents] = useState(location.state?.students ?? defaultStudents);
  const [dragSelection, setDragSelection] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [studentError, setStudentError] = useState(null);
  const [timeRangeError, setTimeRangeError] = useState(null);
  const [shareLinkCopied, setShareLinkCopied] = useState(false);
  const [createdSchedule, setCreatedSchedule] = useState(null);
  const [shareSlug, setShareSlug] = useState(() => slugify(location.state?.title ?? ""));

  // Generate upcoming date options starting from the closest Sunday
  const upcomingDateOptions = useMemo(() => {
    const today = new Date();
    
    // Find the closest Sunday before or on today
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const daysToSubtract = dayOfWeek;
    const startDate = addDays(today, -daysToSubtract);
    
    return Array.from({ length: 35 }).map((_, index) => {
      const date = addDays(startDate, index);
      return format(date, "yyyy-MM-dd");
    });
  }, []);

  useDocumentTitle("Create schedule");

  useEffect(() => {
    if (!createdSchedule) {
      setShareSlug(slugify(title));
    }
  }, [createdSchedule, title]);

  const handleToggleDate = (date) => {
    setSelectedDates((previous) =>
      previous.includes(date)
        ? previous.filter((value) => value !== date)
        : [...previous, date].sort()
    );
  };

  const handleDatePointerDown = (event, index, date, isPast) => {
    if (isPast) {
      return;
    }

    if (event.button !== undefined && event.button !== 0) {
      return;
    }

    event.preventDefault();

    setDragSelection({
      startIndex: index,
      currentIndex: index,
      shouldSelect: !selectedDates.includes(date),
    });
  };

  const handleDatePointerEnter = (index, isPast) => {
    if (isPast) {
      return;
    }

    setDragSelection((previous) =>
      previous
        ? {
            ...previous,
            currentIndex: index,
          }
        : previous
    );
  };

  useEffect(() => {
    const finalizeDragSelection = () => {
      setDragSelection((current) => {
        if (!current) {
          return null;
        }

        const { startIndex, currentIndex, shouldSelect } = current;
        if (startIndex === currentIndex) {
          return null;
        }
        const rangeStart = Math.min(startIndex, currentIndex);
        const rangeEnd = Math.max(startIndex, currentIndex);

        setSelectedDates((previous) => {
          const selectedSet = new Set(previous);

          for (let index = rangeStart; index <= rangeEnd; index += 1) {
            const date = upcomingDateOptions[index];
            if (!date) {
              continue;
            }

            if (shouldSelect) {
              selectedSet.add(date);
            } else {
              selectedSet.delete(date);
            }
          }

          return Array.from(selectedSet).sort();
        });

        return null;
      });
    };

    window.addEventListener("pointerup", finalizeDragSelection);

    return () => {
      window.removeEventListener("pointerup", finalizeDragSelection);
    };
  }, [setSelectedDates, upcomingDateOptions]);


  const handleAddStudent = () => {
    setStudentError(null);
    setStudents((previous) => [
      ...previous,
      { id: createId(), name: "", lessonLength: 60 },
    ]);
  };

  const handleStudentChange = (id, updates) => {
    setStudentError(null);
    setStudents((previous) =>
      previous.map((student) =>
        student.id === id
          ? {
              ...student,
              ...updates,
            }
          : student
      )
    );
  };

  const handleRemoveStudent = (id) => {
    setStudentError(null);
    setStudents((previous) => previous.filter((student) => student.id !== id));
  };

  const validateStudents = () => {
    if (students.length === 0) {
      setStudentError(null);
      return true;
    }

    const trimmedNames = students.map((student) => (student.name ?? "").trim());

    if (trimmedNames.some((name) => name === "")) {
      setStudentError("Enter a name for each student or remove unused rows.");
      return false;
    }

    const seen = new Set();
    for (const name of trimmedNames) {
      const normalized = name.toLowerCase();
      if (seen.has(normalized)) {
        setStudentError("Student names must be unique.");
        return false;
      }
      seen.add(normalized);
    }

    setStudentError(null);
    return true;
  };

  const handleCopyShareLink = async () => {
    const success = await copyToClipboard(`${getAppOrigin()}/s/${shareSlug}`);
    if (success) {
      setShareLinkCopied(true);
      setTimeout(() => setShareLinkCopied(false), 1500);
    }
  };

  const parseTimeToMinutes = (value) => {
    if (!value) {
      return NaN;
    }

    const [hoursString = "", minutesString = ""] = value.split(":");
    const hours = Number.parseInt(hoursString, 10);
    const minutes = Number.parseInt(minutesString, 10);

    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
      return NaN;
    }

    return hours * 60 + minutes;
  };

  const validateTimeRange = () => {
    const startMinutes = parseTimeToMinutes(startTime);
    const endMinutes = parseTimeToMinutes(endTime);

    if (
      Number.isNaN(startMinutes) ||
      Number.isNaN(endMinutes) ||
      endMinutes - startMinutes < 30
    ) {
      setTimeRangeError("Start time must be at least 30 minutes before end time.");
      return false;
    }

    setTimeRangeError(null);
    return true;
  };

  const handleCreateSchedule = async () => {
    if (!token) {
      return;
    }

    if (!validateStudents()) {
      setStep(2);
      return;
    }

    setIsSaving(true);
    setError(null);

    const payload = {
      title,
      dates: [...selectedDates].sort(),
      start_time: startTime,
      end_time: endTime,
      slug: shareSlug,
      students: students.map((student) => ({
        name: (student.name ?? "").trim(),
        lesson_length: Number.parseInt(student.lessonLength, 10) || 30,
      })),
    };

    try {
      const schedule = await createScheduleRequest(token, payload);
      setCreatedSchedule(schedule);
      setShareSlug(schedule.slug);
      setStep(3);
    } catch (err) {
      console.error("Failed to create schedule", err);
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const goNext = async () => {
    if (step === 2) {
      if (createdSchedule) {
        setStep(3);
        return;
      }
      await handleCreateSchedule();
      return;
    }

    if (step < steps.length - 1) {
      setStep((value) => value + 1);
    }
  };

  const goBack = () => {
    if (step > 0) {
      setStep((value) => value - 1);
    }
  };

  const handleFinish = () => {
    if (!createdSchedule) {
      return;
    }

    navigate(`/teacher/schedules/${createdSchedule.id}`, { replace: true });
  };

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4">
            <Typography variant="small" className="text-slate-500">
              Title
            </Typography>
            <Input
              size="lg"
              color="purple"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Fall Jury Week"
              className={primaryInputFocusClasses}
              crossOrigin=""
            />
          </div>
        );
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <Typography variant="small" className="text-slate-500">
                Select all dates for this schedule
              </Typography>
              <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-center gap-6 text-xs font-medium text-slate-500 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-3 w-3 rounded border border-slate-300 bg-white" aria-hidden="true" />
                    <span>Unavailable</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-3 w-3 rounded"
                      style={{ backgroundColor: brandColor }}
                      aria-hidden="true"
                    />
                    <span>Available</span>
                  </div>
                </div>
              {/* Day of week headers */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => {
                  return (
                    <div key={day} className="text-center text-xs font-semibold text-slate-500 py-2">
                      {day}
                    </div>
                  );
                })}
              </div>
              {/* Date grid */}
              <div className="grid grid-cols-7 gap-2">
                {upcomingDateOptions.slice(0, 35).map((date, index) => {
                  const isWithinDragRange = (() => {
                    if (!dragSelection) {
                      return false;
                    }

                    const { startIndex, currentIndex } = dragSelection;
                    const rangeStart = Math.min(startIndex, currentIndex);
                    const rangeEnd = Math.max(startIndex, currentIndex);

                    return index >= rangeStart && index <= rangeEnd;
                  })();

                  const isActive = isWithinDragRange
                    ? dragSelection.shouldSelect
                    : selectedDates.includes(date);
                  const isPast = (() => {
                    const [year, month, day] = date.split('-').map(Number);
                    const today = new Date();
                    const todayYear = today.getFullYear();
                    const todayMonth = today.getMonth() + 1; // getMonth() returns 0-11, we need 1-12
                    const todayDay = today.getDate();
                    
                    if (year < todayYear) return true;
                    if (year > todayYear) return false;
                    if (month < todayMonth) return true;
                    if (month > todayMonth) return false;
                    return day < todayDay;
                  })();
                  
                  
                  return (
                    <Button
                      key={date}
                      size="sm"
                      color={isActive ? "purple" : "gray"}
                      variant={isActive ? "filled" : "outlined"}
                      disabled={isPast}
                      className={`w-full aspect-square p-2 text-xs ${
                        isPast
                          ? "opacity-50 cursor-not-allowed"
                          : isActive
                          ? primaryButtonFilledClasses
                          : primaryButtonOutlinedClasses
                      }`}
                      onClick={() => !isPast && handleToggleDate(date)}
                      onPointerDown={(event) =>
                        handleDatePointerDown(event, index, date, isPast)
                      }
                      onPointerEnter={() =>
                        dragSelection && handleDatePointerEnter(index, isPast)
                      }
                    >
                       <div className="flex flex-col items-center">
                         <span className="text-xs font-medium">
                           {(() => {
                             const monthNumber = parseInt(date.split('-')[1]);
                             const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                             return monthNames[monthNumber - 1];
                           })()}
                         </span>
                         <span className="text-sm font-bold">
                           {date.split('-')[2]}
                         </span>
                       </div>
                    </Button>
                  );
                })}
              </div>
            </div>
            </div>
            
            {/* Time selection */}
            <div className="space-y-4">
              <Typography variant="small" className="text-slate-500">
                What time range should be available each day?
              </Typography>
              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <Typography variant="small" className="text-slate-600 mb-2">
                    Start time
                  </Typography>
                  <Input
                    type="time"
                    size="lg"
                    color="purple"
                    value={startTime}
                    onChange={(event) => {
                      setStartTime(event.target.value);
                      setTimeRangeError(null);
                    }}
                    className={primaryInputFocusClasses}
                    crossOrigin=""
                  />
                </div>
                <div className="flex-1">
                  <Typography variant="small" className="text-slate-600 mb-2">
                    End time
                  </Typography>
                  <Input
                    type="time"
                    size="lg"
                    color="purple"
                    value={endTime}
                    onChange={(event) => {
                      setEndTime(event.target.value);
                      setTimeRangeError(null);
                    }}
                    className={primaryInputFocusClasses}
                    crossOrigin=""
                  />
                </div>
              </div>
              {timeRangeError ? (
                <Typography variant="small" className="text-red-600">
                  {timeRangeError}
                </Typography>
              ) : null}
              <Typography variant="small" className="text-slate-400">
                Students will be able to mark their availability within this time range.
              </Typography>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <Typography variant="small" className="text-slate-500">
              Students and lesson lengths
            </Typography>
            <List className="divide-y divide-slate-100 rounded-2xl border border-slate-100">
              {students.map((student) => (
                <ListItem key={student.id} className="block space-y-4 py-4">
                  <div className="space-y-4 md:grid md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-4 md:space-y-0">
                    <Input
                      label="Student name"
                      value={student.name}
                      color="purple"
                      onChange={(event) =>
                        handleStudentChange(student.id, { name: event.target.value })
                      }
                      className={`${primaryInputFocusClasses} !border-0 focus:!border-0 !border-b-2 !border-b-purple-500`}
                      crossOrigin=""
                    />
                    <div className="flex flex-wrap items-center gap-3">
                      <Typography variant="small" className="text-slate-500">
                        Lesson length
                      </Typography>
                      <ButtonGroup variant="outlined" color="purple" size="sm">
                        {[30, 60, 90].map((length) => (
                          <Button
                            key={length}
                            color={student.lessonLength === length ? "purple" : "gray"}
                            variant={
                              student.lessonLength === length ? "filled" : "text"
                            }
                            className={
                              student.lessonLength === length
                                ? `${primaryButtonFilledClasses} !text-white`
                                : `${primaryButtonOutlinedClasses} !text-slate-600`
                            }
                            onClick={() =>
                              handleStudentChange(student.id, { lessonLength: length })
                            }
                          >
                            {length} min
                          </Button>
                        ))}
                      </ButtonGroup>
                      <IconButton
                        color="red"
                        variant="text"
                        size="sm"
                        onClick={() => handleRemoveStudent(student.id)}
                        aria-label={`Remove ${student.name || "student"}`}
                      >
                        <TrashIcon className="h-5 w-5" />
                      </IconButton>
                    </div>
                  </div>
                </ListItem>
              ))}
            </List>
            {studentError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {studentError}
              </div>
            ) : null}
            <Button color="gray" variant="outlined" onClick={handleAddStudent}>
              Add another student
            </Button>
            <Typography variant="small" className="text-slate-400">
              Don’t worry if you forget someone—you can continue editing after creating the schedule.
            </Typography>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <div
              className="rounded-2xl p-6"
              style={{
                background: `linear-gradient(135deg, ${brandSurface} 0%, ${brandSurfaceLight} 100%)`,
              }}
            >
              <Typography variant="small" style={{ color: brandColor }}>
                Share link preview
              </Typography>
              <Typography
                variant="h6"
                className="font-display"
                style={{ color: brandColorDeep }}
              >
                {`${getAppOrigin()}/s/${shareSlug}`}
              </Typography>
              <Typography variant="small" className="mt-2" style={{ color: brandColor }}>
                Copy and send this link to students so they can submit availability.
              </Typography>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <Typography variant="small" className="text-slate-500">
                  Schedule title
                </Typography>
                <Typography variant="h6" className="font-display text-slate-800">
                  {title}
                </Typography>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <Typography variant="small" className="text-slate-500">
                  Dates
                </Typography>
                <Typography variant="h6" className="font-display text-slate-800">
                  {formatScheduleDates(selectedDates)}
                </Typography>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <Typography variant="small" className="text-slate-500">
                  Time range
                </Typography>
                <Typography variant="h6" className="font-display text-slate-800">
                  {startTime} - {endTime}
                </Typography>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <Typography variant="small" className="text-slate-500">
                Students included ({students.length})
              </Typography>
              <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                {students.map((student) => (
                  <span key={student.id}>
                    {student.name || "Unnamed student"} · {student.lessonLength} minutes
                  </span>
                ))}
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const actions = (
    <Button
      color="purple"
      size="sm"
      onClick={() => navigate("/teacher/dashboard")}
      variant="text"
      className={primaryButtonTextClasses}
    >
      Exit setup
    </Button>
  );

  return (
    <TeacherLayout pageTitle="Create a schedule" actions={actions}>
      <div className="mx-auto max-w-3xl">
        <Card className="shadow-xl">
          <CardBody className="space-y-8 p-8">
            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            ) : null}
            <div className="space-y-2 text-center">
              <Typography variant="h4" className="font-display text-slate-800">
                {steps[step].title}
              </Typography>
              <Typography variant="small" className="text-slate-500">
                {steps[step].helper}
              </Typography>
            </div>
            {renderStepContent()}
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-6">
              <Button color="gray" variant="text" disabled={step === 0} onClick={goBack}>
                Back
              </Button>
              {step < steps.length - 1 ? (
                <Button
                  color="purple"
                  className={primaryButtonFilledClasses}
                  onClick={() => goNext()}
                  disabled={
                    isSaving || (step === 2 && selectedDates.length === 0)
                  }
                >
                  {step === 2 ? (isSaving ? "Creating…" : "Create schedule") : "Continue"}
                </Button>
              ) : (
                <div className="flex items-center gap-3">
                  <Tooltip content="Copied!" open={shareLinkCopied} placement="top">
                    <Button
                      color="purple"
                      variant="outlined"
                      className={primaryButtonOutlinedClasses}
                      onClick={handleCopyShareLink}
                      disabled={!createdSchedule}
                    >
                      Copy link
                    </Button>
                  </Tooltip>
                  <Button
                    color="purple"
                    className={primaryButtonFilledClasses}
                    onClick={handleFinish}
                    disabled={!createdSchedule}
                  >
                    View schedule
                  </Button>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </TeacherLayout>
  );
}
