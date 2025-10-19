import { useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Button,
  Card,
  CardBody,
  Checkbox,
  Chip,
  Typography,
} from "@material-tailwind/react";
import { addMinutes, format } from "date-fns";
import TeacherLayout from "../components/TeacherLayout";
import AvailabilityGrid from "../components/AvailabilityGrid";
import {
  createBlankAvailability,
  formatScheduleDates,
  mockScheduleDetails,
  timeSlots,
} from "../data/mockData";
import { copyToClipboard, getAppOrigin } from "../utils/environment";
import useDocumentTitle from "../utils/useDocumentTitle";
import {
  brandColor,
  primaryButtonFilledClasses,
  primaryButtonOutlinedClasses,
  primaryCheckboxClasses,
  primaryChipClasses,
} from "../utils/theme";

const cloneAvailability = (source, dates) => {
  if (!source) {
    return createBlankAvailability(dates);
  }
  const cloned = {};
  dates.forEach((date) => {
    cloned[date] = { ...(source[date] ?? {}) };
    timeSlots.forEach((slot) => {
      if (typeof cloned[date][slot] !== "boolean") {
        cloned[date][slot] = false;
      }
    });
  });
  return cloned;
};

const parseSlotMinutes = (slot) => {
  const [hours, minutes] = slot.split(":").map(Number);
  return hours * 60 + minutes;
};

const formatResultLabel = (result) => {
  const startMinutes = parseSlotMinutes(result.start);
  const endMinutes = parseSlotMinutes(result.end) + 30;
  const baseDate = new Date(`${result.date}T00:00:00`);
  const startTime = format(addMinutes(baseDate, startMinutes), "h:mm a");
  const endTime = format(addMinutes(baseDate, endMinutes), "h:mm a");
  return `${startTime} – ${endTime}`;
};

export default function ScheduleDetail() {
  const { scheduleId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const scheduleData = useMemo(() => {
    if (location.state?.schedule) {
      const incoming = location.state.schedule;
      return {
        ...incoming,
        linkSlug: incoming.id,
        availability: incoming.availability ?? createBlankAvailability(incoming.dates),
        students: (incoming.students ?? []).map((student) => ({
          submitted: false,
          ...student,
        })),
      };
    }
    const fallback = mockScheduleDetails[scheduleId] ?? mockScheduleDetails["spring-recital-week"];
    return {
      ...fallback,
      students: fallback.students.map((student) => ({
        ...student,
        submitted: Boolean(student.submitted),
      })),
    };
  }, [location.state, scheduleId]);

  useDocumentTitle(`${scheduleData.title} – Professor view`);

  const [availability, setAvailability] = useState(() =>
    cloneAvailability(scheduleData.availability, scheduleData.dates)
  );
  const [students, setStudents] = useState(scheduleData.students);
  const [results, setResults] = useState([]);

  const shareLink = `${getAppOrigin()}/s/${scheduleData.linkSlug ?? scheduleData.id}`;

  const handleToggleSlot = (date, slot, value) => {
    setAvailability((previous) => ({
      ...previous,
      [date]: {
        ...previous[date],
        [slot]: value !== undefined ? value : !previous[date][slot],
      },
    }));
  };

  const handleToggleSubmitted = (id) => {
    setStudents((previous) =>
      previous.map((student) =>
        student.id === id
          ? { ...student, submitted: !student.submitted }
          : student
      )
    );
  };

  const handleRunScheduling = () => {
    // TODO: replace with real scheduling algorithm that optimizes lesson order.
    const submittedStudents = students.filter((student) => student.submitted);
    const allSlots = [];
    scheduleData.dates.forEach((date) => {
      timeSlots.forEach((slot, index) => {
        if (availability?.[date]?.[slot]) {
          allSlots.push({ date, slot, index });
        }
      });
    });

    let pointer = 0;
    const generatedResults = [];

    submittedStudents.forEach((student) => {
      const slotsNeeded = Math.max(1, Math.round(student.lessonLength / 30));
      if (pointer + slotsNeeded > allSlots.length) {
        return;
      }
      const startSlot = allSlots[pointer];
      const endSlot = allSlots[pointer + slotsNeeded - 1];
      generatedResults.push({
        student: student.name || "Unnamed student",
        date: startSlot.date,
        start: startSlot.slot,
        end: endSlot.slot,
      });
      pointer += slotsNeeded;
    });

    setResults(generatedResults);
  };

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
      >
        Schedule!
      </Button>
    </>
  );

  return (
    <TeacherLayout pageTitle={scheduleData.title} actions={actions}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Typography variant="small" className="text-slate-500">
            Dates
          </Typography>
          <Typography variant="h5" className="font-display text-slate-800">
            {formatScheduleDates(scheduleData.dates)}
          </Typography>
        </div>
        <Chip
          value="Professor view"
          color="purple"
          variant="filled"
          className={primaryChipClasses}
        />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <AvailabilityGrid
            dates={scheduleData.dates}
            availability={availability}
            onToggle={handleToggleSlot}
            title="Set your availability"
            subtitle="Toggle the times you are willing to teach."
          />
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
              {results.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center">
                  <Typography variant="small" className="text-slate-500">
                    Run the scheduler once students have submitted their availability.
                  </Typography>
                </div>
              ) : (
                <div className="space-y-3">
                  {results.map((result) => (
                    <div
                      key={`${result.student}-${result.date}-${result.start}`}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white p-4"
                    >
                      <div>
                        <Typography variant="h6" className="font-display text-slate-800">
                          {result.student}
                        </Typography>
                        <Typography variant="small" className="text-slate-500">
                          {format(new Date(result.date), "EEEE, MMMM d")}
                        </Typography>
                      </div>
                      <Typography
                        variant="h6"
                        className="font-display"
                        style={{ color: brandColor }}
                      >
                        {formatResultLabel(result)}
                      </Typography>
                    </div>
                  ))}
                </div>
              )}
              <Typography variant="small" className="text-slate-400">
                Edit your availability to block out breaks, then press Schedule! again to refresh.
              </Typography>
            </CardBody>
          </Card>
        </div>
        <Card className="h-max">
          <CardBody className="space-y-5">
            <Typography variant="h6" className="font-display text-slate-800">
              Students
            </Typography>
            <div className="space-y-3">
              {students.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3"
                >
                  <div>
                    <Typography variant="small" className="font-medium text-slate-700">
                      {student.name || "Unnamed student"}
                    </Typography>
                    <Typography variant="small" className="text-slate-500">
                      {student.lessonLength} minute lesson
                    </Typography>
                  </div>
                  <Checkbox
                    color="purple"
                    className={primaryCheckboxClasses}
                    checked={student.submitted}
                    onChange={() => handleToggleSubmitted(student.id)}
                    label="Submitted?"
                    crossOrigin=""
                  />
                </div>
              ))}
            </div>
            <Button
              color="gray"
              variant="text"
              onClick={() => navigate("/teacher/schedules/new", {
                state: { title: scheduleData.title, dates: scheduleData.dates, students },
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
