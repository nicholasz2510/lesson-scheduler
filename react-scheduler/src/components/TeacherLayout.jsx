import PropTypes from "prop-types";
import { Link, NavLink } from "react-router-dom";
import { Button, IconButton, Typography } from "@material-tailwind/react";
import { MenuIcon } from "./icons";
import { teacherProfile } from "../data/mockData";
import logo from "../assets/cropped_logo.png";

const navItems = [
  { label: "Dashboard", to: "/teacher/dashboard" },
  { label: "Create schedule", to: "/teacher/schedules/new" },
];

export default function TeacherLayout({ pageTitle, actions, children }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white/90 backdrop-blur md:flex">
          <div className="px-6 py-6">
            <Link to="/teacher/dashboard" aria-label="MusiCal dashboard">
              <img src={logo} alt="MusiCal" className="h-16 w-auto" />
            </Link>
          </div>
          <nav className="flex-1 space-y-1 px-4">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `block rounded-lg px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? "bg-[#ede8f7] text-[#62439d]"
                      : "text-slate-600 hover:bg-slate-100"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="border-t border-slate-100 px-6 py-4">
            <div>
              <Typography variant="small" className="font-semibold text-slate-700">
                {teacherProfile.name}
              </Typography>
              <Typography variant="small" className="text-slate-500">
                {teacherProfile.email}
              </Typography>
            </div>
            <Button
              size="sm"
              variant="text"
              color="gray"
              className="mt-4 w-full justify-start"
            >
              Sign out
            </Button>
          </div>
        </aside>
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
            <div className="flex items-center justify-between px-4 py-4 md:px-8">
              <div className="flex items-center gap-4">
                <IconButton variant="text" className="text-slate-500 md:hidden">
                  <MenuIcon className="h-5 w-5" />
                </IconButton>
                <div>
                  <Typography variant="small" className="uppercase tracking-wide text-slate-400">
                    Professor portal
                  </Typography>
                  <Typography variant="h5" className="font-display text-slate-800">
                    {pageTitle}
                  </Typography>
                </div>
              </div>
              <div className="flex items-center gap-3">{actions}</div>
            </div>
          </header>
          <main className="flex-1 px-4 py-6 md:px-8 md:py-10">{children}</main>
        </div>
      </div>
    </div>
  );
}

TeacherLayout.propTypes = {
  pageTitle: PropTypes.string.isRequired,
  actions: PropTypes.node,
  children: PropTypes.node,
};

TeacherLayout.defaultProps = {
  actions: null,
  children: null,
};
