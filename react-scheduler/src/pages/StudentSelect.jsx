import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardBody, Typography } from "@material-tailwind/react";
import { fetchPublicSchedule } from "../api";
import useDocumentTitle from "../utils/useDocumentTitle";
import { brandColor, brandSurface, brandSurfaceLight } from "../utils/theme";

export default function StudentSelect() {
  const { scheduleId } = useParams();
  const navigate = useNavigate();

  const [schedule, setSchedule] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useDocumentTitle(
    schedule ? `${schedule.title} – Choose your name` : "Choose your name"
  );

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetchPublicSchedule(scheduleId);
        if (isMounted) {
          setSchedule(response);
        }
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

    load();

    return () => {
      isMounted = false;
    };
  }, [scheduleId]);

  if (isLoading) {
    return (
      <div
        className="min-h-screen px-4 py-16"
        style={{
          background: `linear-gradient(135deg, ${brandSurface} 0%, ${brandSurfaceLight} 60%, #f8fafc 100%)`,
        }}
      >
        <Card className="mx-auto w-full max-w-3xl shadow-xl">
          <CardBody className="p-10 text-center text-slate-500">Loading…</CardBody>
        </Card>
      </div>
    );
  }

  if (!schedule || error) {
    return (
      <div
        className="min-h-screen px-4 py-16"
        style={{
          background: `linear-gradient(135deg, ${brandSurface} 0%, ${brandSurfaceLight} 60%, #f8fafc 100%)`,
        }}
      >
        <Card className="mx-auto w-full max-w-3xl shadow-xl">
          <CardBody className="p-10 text-center text-red-600">
            {error || "We couldn’t find this schedule."}
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen px-4 py-16"
      style={{
        background: `linear-gradient(135deg, ${brandSurface} 0%, ${brandSurfaceLight} 60%, #f8fafc 100%)`,
      }}
    >
      <Card className="mx-auto w-full max-w-3xl shadow-xl">
        <CardBody className="space-y-8 p-10">
          <div className="space-y-2 text-center">
            <Typography
              variant="small"
              className="uppercase tracking-wide"
              style={{ color: brandColor }}
            >
              {schedule.title}
            </Typography>
            <Typography variant="h4" className="font-display text-slate-800">
              Who’s filling availability?
            </Typography>
            <Typography variant="small" className="text-slate-500">
              Choose your name to continue. If you don’t see your name, contact your teacher.
            </Typography>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
              {schedule.students.map((student) => (
                <button
                  key={student.id}
                  type="button"
                  onClick={() => navigate(`/s/${schedule.slug ?? schedule.id}/${student.id}`)}
                  className="rounded-2xl border border-slate-100 bg-white px-6 py-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-[#cfc0ec] hover:shadow-lg"
                >
                  <Typography variant="h6" className="font-display text-slate-800">
                    {student.name}
                  </Typography>
                  <Typography variant="small" className="text-slate-500">
                    {student.lesson_length} minute lesson
                  </Typography>
                </button>
              ))}
            </div>
        </CardBody>
      </Card>
    </div>
  );
}
