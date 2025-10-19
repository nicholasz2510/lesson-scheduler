import { apiRequest } from "./client";

export const registerTeacher = (payload) =>
  apiRequest("/api/teachers/register", { method: "POST", data: payload });

export const loginTeacher = (payload) =>
  apiRequest("/api/teachers/login", { method: "POST", data: payload });

export const fetchCurrentTeacher = (token) =>
  apiRequest("/api/teachers/me", { token });

export const logoutTeacher = (token) =>
  apiRequest("/api/teachers/logout", { method: "POST", token });

export const listSchedules = (token) =>
  apiRequest("/api/schedules/", { token });

export const createSchedule = (token, payload) =>
  apiRequest("/api/schedules/", { method: "POST", token, data: payload });

export const getSchedule = (token, scheduleId) =>
  apiRequest(`/api/schedules/${scheduleId}`, { token });

export const updateSchedule = (token, scheduleId, payload) =>
  apiRequest(`/api/schedules/${scheduleId}`, { method: "PUT", token, data: payload });

export const deleteSchedule = (token, scheduleId) =>
  apiRequest(`/api/schedules/${scheduleId}`, { method: "DELETE", token });

export const generateSchedule = (token, scheduleId, payload) =>
  apiRequest(`/api/schedules/${scheduleId}/generate`, { method: "POST", token, data: payload });

export const finalizeSchedule = (token, scheduleId, payload) =>
  apiRequest(`/api/schedules/${scheduleId}/finalize`, { method: "POST", token, data: payload });

export const syncTeacherAvailability = (token, payload) =>
  apiRequest("/api/availabilities/teacher/sync", { method: "POST", token, data: payload });

export const syncStudentAvailability = (payload) =>
  apiRequest("/api/availabilities/student/sync", { method: "POST", data: payload });

export const fetchPublicSchedule = (slug) =>
  apiRequest(`/api/schedules/${slug}/public`);

export const listStudents = (token, scheduleId) => {
  const query = scheduleId ? `?schedule_id=${scheduleId}` : "";
  return apiRequest(`/api/students/${query}`, { token });
};

export const createStudent = (token, payload) =>
  apiRequest("/api/students/", { method: "POST", token, data: payload });

export const updateStudent = (token, studentId, payload) =>
  apiRequest(`/api/students/${studentId}`, { method: "PUT", token, data: payload });

export const deleteStudent = (token, studentId) =>
  apiRequest(`/api/students/${studentId}`, { method: "DELETE", token });
