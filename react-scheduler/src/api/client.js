const getBaseUrl = () => {
  const raw = import.meta.env?.VITE_API_BASE_URL ?? "";
  const trimmed = typeof raw === "string" ? raw.trim() : "";

  if (!trimmed) {
    return "";
  }

  return trimmed.replace(/\/$/, "");
};

export const apiRequest = async (path, { method = "GET", data, token, headers, ...options } = {}) => {
  const baseUrl = getBaseUrl();
  const url = path.startsWith("http") ? path : `${baseUrl}${path}`;

  const requestHeaders = {
    Accept: "application/json",
    ...(data !== undefined ? { "Content-Type": "application/json" } : {}),
    ...headers,
  };

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body: data !== undefined ? JSON.stringify(data) : undefined,
    ...options,
  });

  let payload = null;
  if (response.status !== 204) {
    const text = await response.text();
    payload = text ? JSON.parse(text) : null;
  }

  if (!response.ok) {
    const message = payload?.error || `Request failed with status ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
};
