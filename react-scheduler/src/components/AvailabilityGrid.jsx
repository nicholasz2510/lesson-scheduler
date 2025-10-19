import PropTypes from "prop-types";
import { Fragment, useState, useRef, useEffect } from "react"; // 👈 1. Import useEffect
import { Card, CardBody, Typography } from "@material-tailwind/react";
import { formatSlotLabel, timeSlots } from "../data/mockData";
import { primaryButtonFilledClasses } from "../utils/theme";

// (formatDateHeader function remains the same)
const formatDateHeader = (dateString) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const date = new Date(year, month - 1, day);
    const dayName = dayNames[date.getDay()];
    const monthName = monthNames[month - 1];
    return `${dayName}, ${monthName} ${day}`;
};

export default function AvailabilityGrid({
  dates,
  availability,
  onToggle,
  readonly,
  title,
  subtitle,
}) {
  const dateColumns = Math.max(dates.length, 1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [dragEnd, setDragEnd] = useState(null);
  const [dragValue, setDragValue] = useState(null);
  const [hasMoved, setHasMoved] = useState(false);

  const autoScrollInterval = useRef(null);
  const scrollContainerRef = useRef(null);

  // 👇 3. useEffect to manage GLOBAL event listeners for a smoother drag/scroll experience
  useEffect(() => {
     // This function handles auto-scrolling based on the mouse's global X position
     const handleGlobalMouseMove = (event) => {
       if (!isDragging || !scrollContainerRef.current) return;

       // Mark that we've moved (to distinguish from clicks)
       setHasMoved(true);

       const container = scrollContainerRef.current;
       const rect = container.getBoundingClientRect();
       const mouseX = event.clientX;
       const scrollThreshold = 50; // Pixels from the edge
       const scrollSpeed = 10;

       // Clear any existing interval
       if (autoScrollInterval.current) {
         clearInterval(autoScrollInterval.current);
         autoScrollInterval.current = null;
       }

       // Check if mouse is near the right edge of the container
       if (rect.right - mouseX < scrollThreshold && mouseX > rect.right) {
         autoScrollInterval.current = setInterval(() => {
           container.scrollLeft += scrollSpeed;
         }, 16);
       }
       // Check if mouse is near the left edge of the container
       else if (mouseX - rect.left < scrollThreshold && mouseX < rect.left) {
         autoScrollInterval.current = setInterval(() => {
           container.scrollLeft -= scrollSpeed;
         }, 16);
       }
     };

     // This function handles the end of a drag action
     const handleGlobalMouseUp = () => {
       if (isDragging) {
         // Stop any active auto-scrolling
         if (autoScrollInterval.current) {
           clearInterval(autoScrollInterval.current);
           autoScrollInterval.current = null;
         }

         // Only apply drag selection if we actually moved (not just a click)
         if (hasMoved && dragStart && dragEnd && onToggle) {
           const startDateIndex = dates.indexOf(dragStart.date);
           const endDateIndex = dates.indexOf(dragEnd.date);
           const startSlotIndex = timeSlots.indexOf(dragStart.slot);
           const endSlotIndex = timeSlots.indexOf(dragEnd.slot);

           const minDateIndex = Math.min(startDateIndex, endDateIndex);
           const maxDateIndex = Math.max(startDateIndex, endDateIndex);
           const minSlotIndex = Math.min(startSlotIndex, endSlotIndex);
           const maxSlotIndex = Math.max(startSlotIndex, endSlotIndex);

           for (let d = minDateIndex; d <= maxDateIndex; d++) {
             for (let s = minSlotIndex; s <= maxSlotIndex; s++) {
               onToggle(dates[d], timeSlots[s], dragValue);
             }
           }
         }

         // Reset all drag-related state
         setIsDragging(false);
         setDragStart(null);
         setDragEnd(null);
         setDragValue(null);
         setHasMoved(false);
       }
     };

    // If dragging, attach listeners to the window
    if (isDragging) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }

    // Cleanup function: remove listeners when the component unmounts or dragging stops
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      // Ensure interval is cleared on cleanup
      if (autoScrollInterval.current) {
        clearInterval(autoScrollInterval.current);
        autoScrollInterval.current = null;
      }
    };
     // Re-run this effect whenever the isDragging state changes
   }, [isDragging, dragStart, dragEnd, dragValue, hasMoved, dates, onToggle]);


  const handleMouseDown = (date, slot, event) => {
    if (readonly) return;
    event.preventDefault();
    const currentValue = availability?.[date]?.[slot] || false;
    setIsDragging(true);
    setDragStart({ date, slot });
    setDragEnd({ date, slot });
    setDragValue(!currentValue);
    setHasMoved(false); // Reset movement flag
  };

  const handleCellMouseMove = (date, slot) => {
    if (isDragging) {
      setDragEnd({ date, slot });
    }
  };

  const isInDragSelection = (date, slot) => {
    if (!isDragging || !dragStart || !dragEnd) return false;

    const startDateIndex = dates.indexOf(dragStart.date);
    const endDateIndex = dates.indexOf(dragEnd.date);
    const startSlotIndex = timeSlots.indexOf(dragStart.slot);
    const endSlotIndex = timeSlots.indexOf(dragEnd.slot);

    const currentDateIndex = dates.indexOf(date);
    const currentSlotIndex = timeSlots.indexOf(slot);

    const minDateIndex = Math.min(startDateIndex, endDateIndex);
    const maxDateIndex = Math.max(startDateIndex, endDateIndex);
    const minSlotIndex = Math.min(startSlotIndex, endSlotIndex);
    const maxSlotIndex = Math.max(startSlotIndex, endSlotIndex);

    return currentDateIndex >= minDateIndex && currentDateIndex <= maxDateIndex &&
      currentSlotIndex >= minSlotIndex && currentSlotIndex <= maxSlotIndex;
  };

  return (
    <Card className="w-full">
      {/* 👇 4. Attach the ref. No more onMouseMove/onMouseLeave needed here. */}
      <CardBody
        ref={scrollContainerRef}
        className="overflow-x-auto p-0"
      >
        <div className="min-w-full">
          {/* ... Card header content ... */}
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
              style={{ gridTemplateColumns: `90px repeat(${dateColumns}, minmax(90px, 1fr))` }}
              onMouseUp={() => console.log('This will not be used, global handler takes over.')}
            >
              {/* ... Grid header ... */}
              <div className="sticky left-0 z-10 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400 border-r-2 border-slate-300">
                Time
              </div>
              {dates.map((date) => (
                <div
                  key={date}
                  className="border-l border-slate-200 px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-400"
                  style={{ fontSize: 'clamp(0.65rem, 1.2vw, 0.75rem)' }}
                >
                  {formatDateHeader(date)}
                </div>
              ))}
              {timeSlots.map((slot, slotIndex) => {
                const shouldShowLabel = slotIndex % 2 === 0;
                const hourLabel = shouldShowLabel ? formatSlotLabel(slot) : '';

                return (
                  <Fragment key={slot}>
                    <div className="sticky left-0 z-10 bg-white/95 border-t border-slate-100 border-r-2 border-slate-300 px-3 py-1 text-xs font-medium text-slate-500 min-h-[32px] flex items-center">
                      {hourLabel}
                    </div>
                    {dates.map((date) => {
                      const isActive = availability?.[date]?.[slot];
                      const isInDrag = isInDragSelection(date, slot);
                      const displayValue = isDragging && isInDrag ? dragValue : isActive;

                      return (
                        <button
                          key={`${date}-${slot}`}
                          type="button"
                          onMouseDown={(e) => handleMouseDown(date, slot, e)}
                          onMouseMove={() => handleCellMouseMove(date, slot)}
                          // onMouseUp is no longer needed here
                          onClick={() =>
                            !readonly && !isDragging && onToggle?.(date, slot, !isActive)
                          }
                          className={`border-t border-l border-slate-100 px-0 py-2 text-xs transition select-none ${
                            displayValue
                              ? `${primaryButtonFilledClasses} text-white`
                              : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                          } ${readonly ? "cursor-default" : "cursor-pointer"}`}
                        >
                        </button>
                      );
                    })}
                  </Fragment>
                );
              })}
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

// (PropTypes and defaultProps remain the same)
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