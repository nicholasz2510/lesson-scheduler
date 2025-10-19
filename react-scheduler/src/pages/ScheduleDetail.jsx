import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import {
  Button,
  ButtonGroup,
  Card,
  CardBody,
  Chip,
  IconButton,
  Input,
  List,
  ListItem,
  Tooltip,
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
  primaryInputFocusClasses,
} from "../utils/theme";
import {
  finalizeSchedule as finalizeScheduleRequest,
  generateSchedule as generateScheduleRequest,
  getSchedule,
  syncTeacherAvailability,
  createStudent as createStudentRequest,
  updateStudent as updateStudentRequest,
  deleteStudent as deleteStudentRequest,
} from "../api";
import { useAuth } from "../context/AuthContext.jsx";
import { TrashIcon } from "@heroicons/react/24/outline";

const formatRangeLabel = (startIso, endIso) => {
  const start = parseISO(startIso);
  const end = parseISO(endIso);
  const startLabel = format(start, "h:mm a");
  const endLabel = format(end, "h:mm a");
  return `${startLabel} – ${endLabel}`;
};

const createDraftId = () => `temp-${Math.random().toString(36).slice(2, 10)}`;

const formatNameList = (names) => {
  if (names.length === 0) {
    return "";
  }

  if (names.length === 1) {
    return names[0];
  }

  if (names.length === 2) {
    return `${names[0]} and ${names[1]}`;
  }

  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
};

export default function ScheduleDetail() {
  const { scheduleId } = useParams();
  const location = useLocation();
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
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [isEditingStudents, setIsEditingStudents] = useState(false);
  const [draftStudents, setDraftStudents] = useState([]);
  const [studentEditError, setStudentEditError] = useState(null);
  const [studentSaving, setStudentSaving] = useState(false);
  const [shareLinkCopied, setShareLinkCopied] = useState(false);
  const [shareScheduleCopied, setShareScheduleCopied] = useState(false);

  const refetchSchedule = useCallback(async () => {
    if (!token || !scheduleId) {
      return null;
    }

    const response = await getSchedule(token, scheduleId);
    setSchedule(response);
    setUnscheduled([]);
    return response;
  }, [scheduleId, token]);

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

  const handleCopyShareLink = async () => {
    if (!shareLink) {
      return;
    }

    const success = await copyToClipboard(shareLink);
    if (success) {
      setShareLinkCopied(true);
      setTimeout(() => setShareLinkCopied(false), 1500);
    }
  };

  const startEditingStudents = () => {
    setDraftStudents(
      (students ?? []).map((student) => ({
        id: student.id,
        name: student.name ?? "",
        lessonLength: student.lesson_length ?? 30,
        submitted: student.submitted ?? false,
      }))
    );
    setStudentEditError(null);
    setIsEditingStudents(true);
  };

  const handleCancelStudentEdit = () => {
    setIsEditingStudents(false);
    setDraftStudents([]);
    setStudentEditError(null);
  };

  const handleAddDraftStudent = () => {
    setStudentEditError(null);
    setDraftStudents((previous) => [
      ...previous,
      {
        id: createDraftId(),
        name: "",
        lessonLength: 60,
        submitted: false,
      },
    ]);
  };

  const handleDraftStudentChange = (id, updates) => {
    setStudentEditError(null);
    setDraftStudents((previous) =>
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

  const handleRemoveDraftStudent = (id) => {
    setStudentEditError(null);
    setDraftStudents((previous) => previous.filter((student) => student.id !== id));
  };

  const validateDraftStudents = () => {
    if (draftStudents.length === 0) {
      setStudentEditError(null);
      return true;
    }

    const trimmed = draftStudents.map((student) => ({
      ...student,
      trimmedName: (student.name ?? "").trim(),
    }));

    if (trimmed.some((student) => student.trimmedName === "")) {
      setStudentEditError("Enter a name for each student or remove unused rows.");
      return false;
    }

    const seen = new Set();
    for (const student of trimmed) {
      const normalized = student.trimmedName.toLowerCase();
      if (seen.has(normalized)) {
        setStudentEditError("Student names must be unique.");
        return false;
      }
      seen.add(normalized);
    }

    setStudentEditError(null);
    return true;
  };

  const handleSaveStudents = async () => {
    if (!schedule || !token) {
      return;
    }

    if (!validateDraftStudents()) {
      return;
    }

    setStudentSaving(true);
    setStudentEditError(null);

    try {
      const trimmedDrafts = draftStudents.map((student) => ({
        ...student,
        name: (student.name ?? "").trim(),
        lessonLength: Number.parseInt(student.lessonLength, 10) || 30,
      }));

      const existingById = new Map((students ?? []).map((student) => [student.id, student]));
      const trimmedById = new Map(
        trimmedDrafts
          .filter((student) => typeof student.id === "number")
          .map((student) => [student.id, student])
      );

      const deletions = [];
      existingById.forEach((_, id) => {
        if (!trimmedById.has(id)) {
          deletions.push(id);
        }
      });

      for (const studentId of deletions) {
        await deleteStudentRequest(token, studentId);
      }

      for (const student of trimmedDrafts) {
        if (typeof student.id === "number") {
          const existing = existingById.get(student.id);
          if (
            existing &&
            (existing.name !== student.name || existing.lesson_length !== student.lessonLength)
          ) {
            await updateStudentRequest(token, student.id, {
              name: student.name,
              lesson_length: student.lessonLength,
            });
          }
        } else {
          await createStudentRequest(token, {
            schedule_id: schedule.id,
            name: student.name,
            lesson_length: student.lessonLength,
          });
        }
      }

      await refetchSchedule();
      setIsEditingStudents(false);
      setDraftStudents([]);
    } catch (err) {
      console.error("Failed to save students", err);
      setStudentEditError(err.message ?? "Unable to save students.");
    } finally {
      setStudentSaving(false);
    }
  };

  const handleSaveSchedule = async () => {
    if (!schedule || results.length === 0) {
      return;
    }

    setSavingSchedule(true);
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
      console.error("Failed to save schedule", err);
      setError(err.message);
    } finally {
      setSavingSchedule(false);
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

  const unscheduledDetails = useMemo(() => {
    return (unscheduled ?? []).map((id) => {
      const student = resolvedStudents.byId.get(id);
      return {
        id,
        name: student?.name ?? String(id),
        submitted: student?.submitted ?? true,
      };
    });
  }, [resolvedStudents, unscheduled]);

  const pendingUnsubmitted = useMemo(
    () => unscheduledDetails.filter((detail) => detail.submitted === false),
    [unscheduledDetails]
  );
  const unableToPlace = useMemo(
    () => unscheduledDetails.filter((detail) => detail.submitted !== false),
    [unscheduledDetails]
  );
  const pendingNames = pendingUnsubmitted.map((detail) => detail.name);
  const unableNames = unableToPlace.map((detail) => detail.name);

  const shareScheduleText = useMemo(() => {
    if (!results?.length) {
      return "";
    }

    const sorted = [...results].sort((a, b) => {
      const aTime = new Date(a.start_time).getTime();
      const bTime = new Date(b.start_time).getTime();
      return aTime - bTime;
    });

    return sorted
      .map((lesson) => {
        const student = resolvedStudents.byId.get(lesson.student_id);
        const name = student?.name ?? "Student";
        const start = parseISO(lesson.start_time);
        const dayLabel = format(start, "EEEE, MMMM d");
        const rangeLabel = formatRangeLabel(lesson.start_time, lesson.end_time);
        return `${name} – ${dayLabel} ${rangeLabel}`;
      })
      .join("\n");
  }, [resolvedStudents, results]);

  const handleShareSchedule = async () => {
    if (!shareScheduleText) {
      return;
    }

    const success = await copyToClipboard(shareScheduleText);
    if (success) {
      setShareScheduleCopied(true);
      setTimeout(() => setShareScheduleCopied(false), 1500);
    }
  };

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
      <Tooltip content="Copied!" open={shareLinkCopied} placement="bottom">
        <span>
          <Button
            variant="outlined"
            color="purple"
            className={primaryButtonOutlinedClasses}
            onClick={handleCopyShareLink}
            disabled={!shareLink}
          >
            Share link
          </Button>
        </span>
      </Tooltip>
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
              {pendingUnsubmitted.length > 0 ? (
                <Typography variant="small" className="text-sm text-orange-600">
                  {`${formatNameList(pendingNames)} ${
                    pendingUnsubmitted.length === 1 ? "has" : "have"
                  } not submitted availability yet.`}
                </Typography>
              ) : null}
              {unableToPlace.length > 0 ? (
                <Typography variant="small" className="text-sm text-orange-600">
                  {`Unable to place ${unableToPlace.length === 1 ? "student" : "students"}: ${formatNameList(unableNames)}`}
                </Typography>
              ) : null}
              <div className="flex flex-wrap justify-end gap-3">
                <Tooltip content="Copied!" open={shareScheduleCopied} placement="top">
                  <span>
                    <Button
                      variant="outlined"
                      color="purple"
                      className={primaryButtonOutlinedClasses}
                      onClick={handleShareSchedule}
                      disabled={!shareScheduleText}
                    >
                      Share schedule
                    </Button>
                  </span>
                </Tooltip>
                <Button
                  color="purple"
                  className={primaryButtonFilledClasses}
                  onClick={handleSaveSchedule}
                  disabled={lessonCards.length === 0 || savingSchedule}
                >
                  {savingSchedule ? "Saving…" : "Save schedule"}
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
            {isEditingStudents ? (
              <div className="space-y-4">
                {draftStudents.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center">
                    <Typography variant="small" className="text-slate-500">
                      Add students to start scheduling lessons.
                    </Typography>
                  </div>
                ) : (
                  <List className="divide-y divide-slate-100 rounded-2xl border border-slate-100">
                    {draftStudents.map((student) => (
                      <ListItem key={student.id} className="block space-y-4 py-4">
                        <div className="space-y-4 md:grid md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-4 md:space-y-0">
                          <Input
                            label="Student name"
                            value={student.name}
                            color="purple"
                            onChange={(event) =>
                              handleDraftStudentChange(student.id, {
                                name: event.target.value,
                              })
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
                                    handleDraftStudentChange(student.id, {
                                      lessonLength: length,
                                    })
                                  }
                                >
                                  {length} min
                                </Button>
                              ))}
                            </ButtonGroup>
                            <Chip
                              value={student.submitted ? "Submitted" : "Pending"}
                              size="sm"
                              color={student.submitted ? "green" : "gray"}
                              variant={student.submitted ? "filled" : "outlined"}
                            />
                            <IconButton
                              color="red"
                              variant="text"
                              size="sm"
                              onClick={() => handleRemoveDraftStudent(student.id)}
                              aria-label={`Remove ${student.name || "student"}`}
                            >
                              <TrashIcon className="h-5 w-5" />
                            </IconButton>
                          </div>
                        </div>
                      </ListItem>
                    ))}
                  </List>
                )}
                {studentEditError ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {studentEditError}
                  </div>
                ) : null}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Button variant="outlined" color="gray" onClick={handleAddDraftStudent}>
                    Add student
                  </Button>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="text" color="gray" onClick={handleCancelStudentEdit} disabled={studentSaving}>
                      Cancel
                    </Button>
                    <Button
                      color="purple"
                      className={primaryButtonFilledClasses}
                      onClick={handleSaveStudents}
                      disabled={studentSaving}
                    >
                      {studentSaving ? "Saving…" : "Save changes"}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {(students ?? []).length > 0 ? (
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
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center">
                    <Typography variant="small" className="text-slate-500">
                      No students have been added yet.
                    </Typography>
                  </div>
                )}
                <Button color="gray" variant="text" onClick={startEditingStudents}>
                  Add or edit students
                </Button>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </TeacherLayout>
  );
}
