import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  CardBody,
  Checkbox,
  Input,
  Typography,
} from "@material-tailwind/react";

export default function TeacherSignIn() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("emartinez@music.edu");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);

  const handleSubmit = (event) => {
    event.preventDefault();
    // TODO: replace with server authentication request once backend is ready.
    navigate("/teacher/dashboard");
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-slate-100 px-4 py-16">
      <div className="absolute inset-x-0 top-0 -z-10 h-72 bg-gradient-to-br from-emerald-400/30 via-emerald-300/20 to-transparent blur-3xl" />
      <Card className="w-full max-w-md">
        <CardBody className="space-y-6 p-8">
          <div className="space-y-2 text-center">
            <Typography variant="h4" className="font-display text-slate-800">
              Teacher sign in
            </Typography>
            <Typography variant="small" className="text-slate-500">
              Access your lesson schedules and manage availability.
            </Typography>
          </div>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Typography variant="small" className="text-left text-slate-600">
                Email
              </Typography>
              <Input
                size="lg"
                color="green"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
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
                color="green"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                crossOrigin=""
              />
            </div>
            <div className="flex items-center justify-between">
              <Checkbox
                color="green"
                checked={remember}
                onChange={() => setRemember((value) => !value)}
                label="Remember me"
                ripple={false}
                crossOrigin=""
              />
              <Typography as="button" type="button" variant="small" className="text-emerald-600">
                Forgot password?
              </Typography>
            </div>
            <Button type="submit" color="green" size="lg" className="w-full">
              Sign in
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
