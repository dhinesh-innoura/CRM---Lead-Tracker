"use client";

import { useEffect, useRef, useState } from "react";

export default function ApplyFiltersButton() {
  const [applying, setApplying] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Listen on the form's "submit" event, not this button's "click" —
    // disabling a submit button from its own click handler runs before the
    // browser decides whether to submit the form, so it silently cancels
    // the submission (disabled buttons can't submit). "submit" only fires
    // once the browser has already committed to navigating, so setting
    // state here can't race the actual filter application.
    const form = buttonRef.current?.form;
    if (!form) return;
    const handleSubmit = () => setApplying(true);
    form.addEventListener("submit", handleSubmit);
    return () => form.removeEventListener("submit", handleSubmit);
  }, []);

  return (
    <button
      ref={buttonRef}
      type="submit"
      disabled={applying}
      className="col-span-2 rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60 lg:col-span-1"
    >
      {applying ? "Applying..." : "Apply"}
    </button>
  );
}
