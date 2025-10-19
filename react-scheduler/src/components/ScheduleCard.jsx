import PropTypes from "prop-types";
import {
  Card,
  CardBody,
  IconButton,
  Menu,
  MenuHandler,
  MenuItem,
  MenuList,
  Typography,
} from "@material-tailwind/react";
import { DotsVerticalIcon } from "./icons";
import { formatScheduleDates } from "../utils/schedule";
import { brandColor } from "../utils/theme";

export default function ScheduleCard({ schedule, onOpen, onDelete }) {
  const totalStudents = schedule.student_count ?? 0;
  const submittedCount = schedule.submitted_count ?? 0;
  const pendingStudents = schedule.pending_students ?? [];

  const formatPendingList = (names) => {
    if (!names.length) {
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

  const submissionSummary = `${submittedCount}/${totalStudents} students submitted`;
  const pendingSummary =
    pendingStudents.length > 0
      ? `Still waiting on ${formatPendingList(pendingStudents)}`
      : "All students have submitted";

  return (
    <Card className="h-full cursor-pointer transition hover:-translate-y-1 hover:shadow-xl" onClick={() => onOpen(schedule)}>
      <CardBody className="flex h-full flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Typography variant="h6" className="font-display text-slate-800">
              {schedule.title}
            </Typography>
            <Typography variant="small" className="text-slate-500">
              {formatScheduleDates(schedule.dates)}
            </Typography>
          </div>
          <Menu placement="left-start">
            <MenuHandler>
              <IconButton
                size="sm"
                variant="text"
                className="!rounded-full text-slate-400 hover:bg-slate-100"
                onClick={(event) => event.stopPropagation()}
              >
                <DotsVerticalIcon className="h-5 w-5" />
              </IconButton>
            </MenuHandler>
            <MenuList>
              <MenuItem
                className="text-red-500"
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete(schedule);
                }}
              >
                Delete schedule
              </MenuItem>
            </MenuList>
          </Menu>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <Typography variant="small" className="text-slate-600">
            {pendingSummary}
          </Typography>
        </div>
        <div className="mt-auto flex items-center justify-between text-sm text-slate-500">
          <span>{submissionSummary}</span>
          <span className="font-medium" style={{ color: brandColor }}>
            Open schedule
          </span>
        </div>
      </CardBody>
    </Card>
  );
}

ScheduleCard.propTypes = {
  schedule: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string.isRequired,
    dates: PropTypes.arrayOf(PropTypes.string).isRequired,
    start_time: PropTypes.string,
    end_time: PropTypes.string,
    student_count: PropTypes.number,
    submitted_count: PropTypes.number,
    pending_students: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  onOpen: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};
