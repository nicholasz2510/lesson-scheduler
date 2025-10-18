export const getAppOrigin = () =>
  typeof window !== "undefined" && window.location?.origin
    ? window.location.origin
    : "http://localhost:5173";

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
