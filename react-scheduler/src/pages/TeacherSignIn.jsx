import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  CardBody,
  Checkbox,
  Input,
  Typography,
} from "@material-tailwind/react";
import useDocumentTitle from "../utils/useDocumentTitle";
import {
  brandColor,
  brandSurface,
  brandSurfaceLight,
  primaryButtonFilledClasses,
  primaryCheckboxClasses,
  primaryInputFocusClasses,
} from "../utils/theme";

export default function TeacherSignIn() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("emartinez@music.edu");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);

  useDocumentTitle("Professor sign in");

  const handleSubmit = (event) => {
    event.preventDefault();
    // TODO: replace with server authentication request once backend is ready.
    navigate("/teacher/dashboard");
  };

  return (
    <div
      className="relative flex min-h-screen items-center justify-center px-4 py-16"
      style={{
        background: `linear-gradient(135deg, ${brandSurface} 0%, ${brandSurfaceLight} 55%, #f8fafc 100%)`,
      }}
    >
      <div
        className="absolute inset-x-0 top-0 -z-10 h-72 blur-3xl"
        style={{
          background:
            "linear-gradient(120deg, rgba(98, 67, 157, 0.35) 0%, rgba(175, 149, 224, 0.2) 45%, transparent 100%)",
        }}
      />
      <Card className="w-full max-w-md">
        <CardBody className="space-y-6 p-8">
          <div className="space-y-2 text-center">
            <Typography variant="h4" className="font-display text-slate-800">
              Professor sign in
            </Typography>
            <Typography variant="small" className="text-slate-500">
              Access your MusiCal schedules and manage availability.
            </Typography>
          </div>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Typography variant="small" className="text-left text-slate-600">
                Email
              </Typography>
              <Input
                size="lg"
                color="purple"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={primaryInputFocusClasses}
                crossOrigin=""
              />
            </div>
            <div className="space-y-2">
              <Typography variant="small" className="text-left text-slate-600">
                Password
              </Typography>
              <Input
                type="password"
                size="lg"
                color="purple"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={primaryInputFocusClasses}
                crossOrigin=""
              />
            </div>
            <div className="flex items-center justify-between">
              <Checkbox
                color="purple"
                checked={remember}
                onChange={() => setRemember((value) => !value)}
                label="Remember me"
                ripple={false}
                className={primaryCheckboxClasses}
                crossOrigin=""
              />
              <Typography
                as="button"
                type="button"
                variant="small"
                style={{ color: brandColor }}
              >
                Forgot password?
              </Typography>
            </div>
            <Button
              type="submit"
              color="purple"
              size="lg"
              className={`w-full ${primaryButtonFilledClasses}`}
            >
              Sign in
            </Button>
          </form>
          <Typography variant="small" className="text-center text-slate-500">
            Need an account?{" "}
            <Link to="/teacher/create-account" className="font-medium" style={{ color: brandColor }}>
              Create one
            </Link>
            .
          </Typography>
        </CardBody>
      </Card>
    </div>
  );
}
