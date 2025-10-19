import { addDays, format } from "date-fns";

export const timeSlots = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
];

export const formatScheduleDates = (dates) => {
  if (!dates?.length) return "";
  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  });
  if (dates.length === 1) {
    return formatter.format(new Date(dates[0]));
  }
  return `${formatter.format(new Date(dates[0]))} – ${formatter.format(
    new Date(dates[dates.length - 1])
  )}`;
};


export const formatSlotLabel = (slot) => {
  const [hour, minute] = slot.split(":").map(Number);
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return format(date, "h:mm a");
};

const makeWindowAvailability = (dates, windowStart, windowEnd) => {
  const startMinutes = parseInt(windowStart.split(":")[0], 10) * 60;
  const endMinutes = parseInt(windowEnd.split(":")[0], 10) * 60;
  const avail = {};
  dates.forEach((date) => {
    avail[date] = {};
    timeSlots.forEach((slot) => {
      const [hour, minute] = slot.split(":").map(Number);
      const minutes = hour * 60 + minute;
      avail[date][slot] = minutes >= startMinutes && minutes < endMinutes;
    });
  });
  return avail;
};

export const createBlankAvailability = (dates) => {
  const avail = {};
  dates.forEach((date) => {
    avail[date] = {};
    timeSlots.forEach((slot) => {
      avail[date][slot] = false;
    });
  });
  return avail;
};

export const mockSchedules = [
  {
    id: "spring-recital-week",
    title: "Spring Recital Week",
    dates: ["2025-03-17", "2025-03-18", "2025-03-19", "2025-03-20"],
    availabilityPreview: "10:00 AM – 3:00 PM",
    students: 12,
  },
  {
    id: "juries-midterm",
    title: "Juries Midterm Block",
    dates: ["2025-04-05", "2025-04-06"],
    availabilityPreview: "9:00 AM – 1:00 PM",
    students: 8,
  },
  {
    id: "makeup-lessons",
    title: "Make-Up Lessons",
    dates: ["2025-05-01"],
    availabilityPreview: "12:00 PM – 5:00 PM",
    students: 5,
  },
];

const studentRoster = [
  { id: "alex", name: "Alex Chen", lessonLength: 60, submitted: true },
  { id: "brianna", name: "Brianna Patel", lessonLength: 30, submitted: false },
  { id: "cam", name: "Cam Nguyen", lessonLength: 60, submitted: true },
  { id: "dani", name: "Dani Romero", lessonLength: 30, submitted: false },
];

export const mockScheduleDetails = {
  "spring-recital-week": {
    id: "spring-recital-week",
    title: "Spring Recital Week",
    linkSlug: "spring-recital-week",
    schedulingType: "specific-dates",
    dates: ["2025-03-17", "2025-03-18", "2025-03-19", "2025-03-20"],
    students: studentRoster,
    availability: makeWindowAvailability(
      ["2025-03-17", "2025-03-18", "2025-03-19", "2025-03-20"],
      "09:00",
      "15:30"
    ),
  },
  "juries-midterm": {
    id: "juries-midterm",
    title: "Juries Midterm Block",
    linkSlug: "juries-midterm",
    schedulingType: "specific-dates",
    dates: ["2025-04-05", "2025-04-06"],
    students: studentRoster,
    availability: makeWindowAvailability(
      ["2025-04-05", "2025-04-06"],
      "09:00",
      "13:30"
    ),
  },
  "makeup-lessons": {
    id: "makeup-lessons",
    title: "Make-Up Lessons",
    linkSlug: "makeup-lessons",
    schedulingType: "specific-dates",
    dates: ["2025-05-01"],
    students: studentRoster,
    availability: makeWindowAvailability(["2025-05-01"], "12:00", "16:30"),
  },
};

export const teacherProfile = {
  name: "Prof. Elena Martinez",
  email: "emartinez@music.edu",
};
