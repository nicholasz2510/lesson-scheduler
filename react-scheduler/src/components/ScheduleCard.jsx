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
import {
  formatScheduleDates,
  generateTimeSlots,
  summarizeAvailabilityWindow,
} from "../utils/schedule";
import {
  brandColor,
  brandColorDeep,
  brandSurface,
  brandSurfaceLight,
} from "../utils/theme";

export default function ScheduleCard({ schedule, onOpen, onDelete }) {
  const timeSlots = generateTimeSlots(schedule.start_time, schedule.end_time);
  const availabilityPreview = summarizeAvailabilityWindow(timeSlots);

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
        <div
          className="rounded-xl p-4"
          style={{
            background: `linear-gradient(90deg, ${brandSurface} 0%, ${brandSurfaceLight} 100%)`,
          }}
        >
          <Typography variant="small" style={{ color: brandColor }}>
            Availability preview
          </Typography>
          <Typography variant="paragraph" className="font-medium" style={{ color: brandColorDeep }}>
            {availabilityPreview || "Set availability"}
          </Typography>
        </div>
        <div className="mt-auto flex items-center justify-between text-sm text-slate-500">
          <span>{schedule.student_count ?? 0} students</span>
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
  }).isRequired,
  onOpen: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};
