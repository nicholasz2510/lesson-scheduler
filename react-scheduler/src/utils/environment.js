export const getAppOrigin = () => {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }

  const configuredOrigin = import.meta.env?.VITE_APP_ORIGIN?.trim();
  if (configuredOrigin) {
    return configuredOrigin.replace(/\/$/, "");
  }

  return "";
};

export const copyToClipboard = async (value) => {
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(value);
      return;
    } catch (error) {
      console.warn("Clipboard copy failed; falling back to prompt.", error);
    }
  }

  if (typeof window !== "undefined") {
    window.prompt("Copy this text", value);
  }
};
