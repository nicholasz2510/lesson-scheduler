import { useMemo, useState } from "react";
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
} from "@material-tailwind/react";
import TeacherLayout from "../components/TeacherLayout";
import { formatScheduleDates, upcomingDateOptions } from "../data/mockData";
import { copyToClipboard, getAppOrigin } from "../utils/environment";
import useDocumentTitle from "../utils/useDocumentTitle";

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
  const [selectedDates, setSelectedDates] = useState(location.state?.dates ?? [upcomingDateOptions[1], upcomingDateOptions[2]]);
  const [students, setStudents] = useState(location.state?.students ?? defaultStudents);

  useDocumentTitle("Create schedule");

  const shareSlug = useMemo(() => slugify(title), [title]);

  const handleToggleDate = (date) => {
    setSelectedDates((previous) =>
      previous.includes(date)
        ? previous.filter((value) => value !== date)
        : [...previous, date].sort()
    );
  };

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
              color="green"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Fall Jury Week"
              crossOrigin=""
            />
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <Typography variant="small" className="text-slate-500">
              Select all dates for this schedule
            </Typography>
            <div className="flex flex-wrap gap-3">
              {upcomingDateOptions.map((date) => {
                const isActive = selectedDates.includes(date);
                return (
                  <Button
                    key={date}
                    size="sm"
                    color={isActive ? "green" : "gray"}
                    variant={isActive ? "filled" : "outlined"}
                    onClick={() => handleToggleDate(date)}
                  >
                    {formatScheduleDates([date])}
                  </Button>
                );
              })}
            </div>
            <Typography variant="small" className="text-slate-400">
              You can add or remove dates later from the schedule page.
            </Typography>
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
                      color="green"
                      onChange={(event) =>
                        handleStudentChange(student.id, { name: event.target.value })
                      }
                      crossOrigin=""
                    />
                    <div className="flex items-center gap-3">
                      <Typography variant="small" className="text-slate-500">
                        Lesson length
                      </Typography>
                      <ButtonGroup variant="outlined" color="green" size="sm">
                        {[30, 60].map((length) => (
                          <Button
                            key={length}
                            color={student.lessonLength === length ? "green" : "gray"}
                            variant={
                              student.lessonLength === length ? "filled" : "text"
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
            <div className="rounded-2xl bg-emerald-50 p-6">
              <Typography variant="small" className="text-emerald-600">
                Share link preview
              </Typography>
              <Typography variant="h6" className="font-display text-emerald-900">
                {`${getAppOrigin()}/s/${shareSlug}`}
              </Typography>
              <Typography variant="small" className="mt-2 text-emerald-700">
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
      color="green"
      size="sm"
      onClick={() => navigate("/teacher/dashboard")}
      variant="text"
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
                <Button color="green" onClick={goNext}>
                  Continue
                </Button>
              ) : (
                <div className="flex items-center gap-3">
                  <Button
                    color="green"
                    variant="outlined"
                    onClick={() => copyToClipboard(`${getAppOrigin()}/s/${shareSlug}`)}
                  >
                    Copy link
                  </Button>
                  <Button color="green" onClick={handleFinish}>
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
