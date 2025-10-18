import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Card, CardBody, Input, Typography } from "@material-tailwind/react";
import useDocumentTitle from "../utils/useDocumentTitle";
import {
  brandColor,
  brandSurface,
  brandSurfaceLight,
  primaryButtonFilledClasses,
  primaryInputFocusClasses,
} from "../utils/theme";

export default function TeacherSignUp() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useDocumentTitle("Create professor account");

  const handleSubmit = (event) => {
    event.preventDefault();
    // TODO: replace with server request when backend is available.
    navigate("/teacher/dashboard", {
      state: {
        account: {
          name,
          email,
        },
      },
    });
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
              Create your professor account
            </Typography>
            <Typography variant="small" className="text-slate-500">
              Join MusiCal to build schedules and gather availability from your studio.
            </Typography>
          </div>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Typography variant="small" className="text-left text-slate-600">
                Name
              </Typography>
              <Input
                size="lg"
                color="purple"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                className={primaryInputFocusClasses}
                crossOrigin=""
              />
            </div>
            <div className="space-y-2">
              <Typography variant="small" className="text-left text-slate-600">
                Email
              </Typography>
              <Input
                type="email"
                size="lg"
                color="purple"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
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
                required
                className={primaryInputFocusClasses}
                crossOrigin=""
              />
            </div>
            <Button
              type="submit"
              color="purple"
              size="lg"
              className={`w-full ${primaryButtonFilledClasses}`}
            >
              Create account
            </Button>
          </form>
          <Typography variant="small" className="text-center text-slate-500">
            Already have an account?{" "}
            <Link to="/" className="font-medium" style={{ color: brandColor }}>
              Sign in
            </Link>
            .
          </Typography>
        </CardBody>
      </Card>
    </div>
  );
}
