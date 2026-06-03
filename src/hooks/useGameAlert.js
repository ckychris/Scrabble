import { useEffect, useRef, useState } from "react";
import sound from "../services/soundSynth";

// Manages the transient board alert message (e.g. invalid-move warnings),
// including its auto-dismiss timers and the accompanying error sound.
export function useGameAlert(soundEnabled) {
  const [alertMessage, setAlertMessage] = useState(null);
  const alertTimeoutRef = useRef(null);

  useEffect(
    () => () => {
      if (alertTimeoutRef.current) {
        clearTimeout(alertTimeoutRef.current);
        alertTimeoutRef.current = null;
      }
    },
    [],
  );

  const triggerAlert = (msg) => {
    if (alertTimeoutRef.current) {
      clearTimeout(alertTimeoutRef.current);
    }
    setAlertMessage(null);

    // Briefly clear first so re-triggering the same message replays the
    // animation, then show the message and schedule auto-dismiss.
    const tid = setTimeout(() => {
      setAlertMessage(msg);
      if (soundEnabled) sound.playIncorrect();

      alertTimeoutRef.current = setTimeout(() => {
        setAlertMessage(null);
      }, 3000);
    }, 20);
    alertTimeoutRef.current = tid;
  };

  return { alertMessage, triggerAlert };
}
