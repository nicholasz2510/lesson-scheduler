import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

const brandColor = "#62439d";
const brandSurface = "#f3e8ff";
const brandSurfaceLight = "#faf5ff";
const primaryButtonFilledClasses = "bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition duration-300 ease-in-out";
const primaryInputFocusClasses = "focus:ring-2 focus:ring-purple-500 focus:border-purple-500";
const primaryCheckboxClasses = "h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500";

const useDocumentTitle = (title) => {
  useEffect(() => {
    document.title = title;
  }, [title]);
};

export default function TeacherSignIn() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useDocumentTitle("Professor sign in");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/teachers/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sign in.');
      }

      if (data.token) {
        localStorage.setItem('jwt_token', data.token);
        navigate("/teacher/dashboard");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="relative flex min-h-screen items-center justify-center bg-gray-50 px-4 py-16"
      style={{
        background: `linear-gradient(135deg, ${brandSurface} 0%, ${brandSurfaceLight} 55%, #f8fafc 100%)`,
      }}
    >
      {error && (
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-xl shadow-2xl text-center max-w-sm w-full">
            <h3 className="text-xl font-bold text-red-600 mb-3">Login Failed</h3>
            <p className="text-slate-700 mb-6">{error}</p>
            <button
              onClick={() => setError(null)}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg transition duration-300"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      <div
        className="absolute inset-x-0 top-0 -z-10 h-72 blur-3xl"
        style={{
          background: "linear-gradient(120deg, rgba(98, 67, 157, 0.35) 0%, rgba(175, 149, 224, 0.2) 45%, transparent 100%)",
        }}
      />
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg">
        <div className="space-y-6 p-8">
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-bold font-display text-slate-800">
              Professor sign in
            </h2>
            <p className="text-sm text-slate-500">
              Access your MusiCal schedules and manage availability.
            </p>
          </div>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-left text-slate-600 block">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${primaryInputFocusClasses}`}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-left text-slate-600 block">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${primaryInputFocusClasses}`}
                disabled={isLoading}
              />
            </div>
            
            <button
              type="submit"
              className={`w-full ${primaryButtonFilledClasses}`}
              disabled={isLoading}
            >
              {isLoading ? 'Signing In...' : 'Sign in'}
            </button>
          </form>
          <p className="text-sm text-center text-slate-500">
            Need an account?{" "}
            <Link to="/teacher/create-account" className="font-medium" style={{ color: brandColor }}>
              Create one
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

