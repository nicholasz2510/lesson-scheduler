import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Button,
  ButtonGroup,
  Card,
  CardBody,
  Input,
  List,
  ListItem,
  Typography,
  Radio,
} from "@material-tailwind/react";
import TeacherLayout from "../components/TeacherLayout";
import { formatScheduleDates } from "../data/mockData";
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

const defaultStudents = [
  { id: createId(), name: "Alex Chen", lessonLength: 60 },
  { id: createId(), name: "Brianna Patel", lessonLength: 30 },
];

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "new-schedule";

export default function CreateSchedule() {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState(location.state?.title ?? "Spring Studio Week");
  const [selectedDates, setSelectedDates] = useState(location.state?.dates ?? []);
  const [startTime, setStartTime] = useState(location.state?.startTime ?? "09:00");
  const [endTime, setEndTime] = useState(location.state?.endTime ?? "17:00");
  const [students, setStudents] = useState(location.state?.students ?? defaultStudents);
  const [dragSelection, setDragSelection] = useState(null);

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

  const shareSlug = useMemo(() => slugify(title), [title]);

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
    setStudents((previous) => [
      ...previous,
      { id: createId(), name: "", lessonLength: 60 },
    ]);
  };

  const handleStudentChange = (id, updates) => {
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

  const goNext = () => {
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
    const schedule = {
      id: shareSlug,
      title,
      dates: selectedDates,
      startTime,
      endTime,
      students,
    };
    // TODO: replace with server call to persist schedule and generate share link.
    navigate(`/teacher/schedules/${shareSlug}`, { state: { schedule } });
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
            <Typography variant="small" className="text-slate-400">
              You can add or remove dates later from the schedule page.
            </Typography>
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
                    onChange={(event) => setStartTime(event.target.value)}
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
                    onChange={(event) => setEndTime(event.target.value)}
                    className={primaryInputFocusClasses}
                    crossOrigin=""
                  />
                </div>
              </div>
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
                  <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
                    <Input
                      label="Student name"
                      value={student.name}
                      color="purple"
                      onChange={(event) =>
                        handleStudentChange(student.id, { name: event.target.value })
                      }
                      className={primaryInputFocusClasses}
                      crossOrigin=""
                    />
                    <div className="flex items-center gap-3">
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
                    </div>
                  </div>
                </ListItem>
              ))}
            </List>
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
                  onClick={goNext}
                >
                  {step === 2 ? "Create schedule" : "Continue"}
                </Button>
              ) : (
                <div className="flex items-center gap-3">
                  <Button
                    color="purple"
                    variant="outlined"
                    className={primaryButtonOutlinedClasses}
                    onClick={() => copyToClipboard(`${getAppOrigin()}/s/${shareSlug}`)}
                  >
                    Copy link
                  </Button>
                  <Button
                    color="purple"
                    className={primaryButtonFilledClasses}
                    onClick={handleFinish}
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
