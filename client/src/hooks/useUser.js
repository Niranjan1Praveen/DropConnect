"use client";
import { useEffect, useState } from "react";

// Fetches the logged-in user's Mongo profile (name, avatar, role) once
export function useUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/user")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed to fetch user"))))
      .then(setUser)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { user, loading, error };
}
