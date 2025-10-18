import PropTypes from "prop-types";
import { Fragment } from "react";
import { Card, CardBody, Tooltip, Typography } from "@material-tailwind/react";
import { format } from "date-fns";
import { formatSlotLabel, timeSlots } from "../data/mockData";
import { primaryButtonFilledClasses } from "../utils/theme";

const formatDateHeader = (dateString) =>
  format(new Date(dateString), "EEE, MMM d");

export default function AvailabilityGrid({
  dates,
  availability,
  onToggle,
  readonly,
  title,
  subtitle,
}) {
  const dateColumns = Math.max(dates.length, 1);

  return (
    <Card className="w-full">
      <CardBody className="overflow-x-auto p-0">
        <div className="min-w-full">
          <div className="border-b border-slate-200 px-6 py-4">
            <Typography variant="h6" className="font-display text-slate-800">
              {title}
            </Typography>
            {subtitle ? (
              <Typography variant="small" className="text-slate-500">
                {subtitle}
              </Typography>
            ) : null}
          </div>
          <div className="px-6 pb-6">
            <div
              className="grid"
              style={{ gridTemplateColumns: `140px repeat(${dateColumns}, minmax(160px, 1fr))` }}
            >
              <div className="sticky left-0 z-10 bg-white/95 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Time
              </div>
              {dates.map((date) => (
                <div
                  key={date}
                  className="border-l border-slate-200 px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-400"
                >
                  {formatDateHeader(date)}
                </div>
              ))}
              {timeSlots.map((slot) => (
                <Fragment key={slot}>
                  <div className="border-t border-slate-100 px-3 py-2 text-sm font-medium text-slate-500">
                    {formatSlotLabel(slot)}
                  </div>
                  {dates.map((date) => {
                    const isActive = availability?.[date]?.[slot];
                    return (
                      <Tooltip
                        key={`${date}-${slot}`}
                        content={
                          readonly
                            ? isActive
                              ? "Available"
                              : "Unavailable"
                            : isActive
                            ? "Click to mark unavailable"
                            : "Click to mark available"
                        }
                      >
                        <button
                          type="button"
                          onClick={() =>
                            !readonly && onToggle?.(date, slot, !isActive)
                          }
                          className={`border-t border-l border-slate-100 px-2 py-4 text-sm transition ${
                            isActive
                              ? `${primaryButtonFilledClasses} text-white`
                              : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                          } ${readonly ? "cursor-default" : "cursor-pointer"}`}
                        >
                          {isActive ? "Available" : "Blocked"}
                        </button>
                      </Tooltip>
                    );
                  })}
                </Fragment>
              ))}
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

AvailabilityGrid.propTypes = {
  dates: PropTypes.arrayOf(PropTypes.string).isRequired,
  availability: PropTypes.object,
  onToggle: PropTypes.func,
  readonly: PropTypes.bool,
  title: PropTypes.string,
  subtitle: PropTypes.string,
};

AvailabilityGrid.defaultProps = {
  availability: {},
  onToggle: undefined,
  readonly: false,
  title: "",
  subtitle: "",
};
