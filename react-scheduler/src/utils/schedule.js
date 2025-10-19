import { format } from "date-fns";

const pad = (value) => value.toString().padStart(2, "0");

export const formatScheduleDates = (dates) => {
  if (!dates?.length) return "";
  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  });

  if (dates.length === 1) {
    return formatter.format(new Date(dates[0]));
  }

  const first = formatter.format(new Date(dates[0]));
  const last = formatter.format(new Date(dates[dates.length - 1]));
  return `${first} – ${last}`;
};

export const formatSlotLabel = (slot) => {
  if (!slot) {
    return "";
  }
  const [hour, minute] = slot.split(":").map(Number);
  const date = new Date();
  date.setHours(hour, minute ?? 0, 0, 0);
  return format(date, "h:mm a");
};

export const generateTimeSlots = (startTime, endTime, stepMinutes = 30) => {
  if (!startTime || !endTime) {
    return [];
  }

  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  const startTotal = startHour * 60 + (startMinute ?? 0);
  const endTotal = endHour * 60 + (endMinute ?? 0);

  if (Number.isNaN(startTotal) || Number.isNaN(endTotal) || endTotal <= startTotal) {
    return [];
  }

  const slots = [];
  for (let minutes = startTotal; minutes < endTotal; minutes += stepMinutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    slots.push(`${pad(hours)}:${pad(mins)}`);
  }
  return slots;
};

export const createAvailabilityMap = (dates, timeSlots) => {
  const map = {};
  dates.forEach((date) => {
    map[date] = {};
    timeSlots.forEach((slot) => {
      map[date][slot] = false;
    });
  });
  return map;
};

const extractDateTimeParts = (value) => {
  if (!value) {
    return [null, null];
  }

  const [datePart, timePartRaw] = value.split("T");
  if (!timePartRaw) {
    return [datePart, null];
  }
  const match = timePartRaw.match(/^(\d{2}:\d{2})/);
  return [datePart, match ? match[1] : null];
};

export const buildAvailabilityMapFromEntries = (dates, timeSlots, entries) => {
  const map = createAvailabilityMap(dates, timeSlots);
  if (!entries?.length) {
    return map;
  }

  entries.forEach((entry) => {
    const start = typeof entry === "string" ? entry : entry?.start_time;
    const [datePart, timePart] = extractDateTimeParts(start ?? "");
    if (datePart && timePart && map[datePart]?.[timePart] !== undefined) {
      map[datePart][timePart] = true;
    }
  });

  return map;
};

export const availabilityMapToStartTimes = (availability) => {
  if (!availability) {
    return [];
  }

  const payload = [];
  Object.entries(availability).forEach(([date, slots]) => {
    Object.entries(slots).forEach(([slot, isSelected]) => {
      if (isSelected) {
        payload.push(`${date}T${slot}:00`);
      }
    });
  });
  return payload;
};

export const summarizeAvailabilityWindow = (timeSlots) => {
  if (!timeSlots?.length) {
    return "";
  }
  const first = formatSlotLabel(timeSlots[0]);
  const last = formatSlotLabel(timeSlots[timeSlots.length - 1]);
  return `${first} – ${last}`;
};
