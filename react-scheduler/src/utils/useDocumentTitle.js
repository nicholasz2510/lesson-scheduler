import { useEffect } from "react";

const APP_NAME = "MusiCal";

export default function useDocumentTitle(title) {
  useEffect(() => {
    if (title) {
      document.title = `${title} | ${APP_NAME}`;
    } else {
      document.title = APP_NAME;
    }
  }, [title]);
}
