"use client";

import { useEffect, useRef, useState } from "react";

type Option = {
  value: string;
  label: string;
};

type AdminStoreDropdownProps = {
  name: string;
  defaultValue: string;
  options: Option[];
  disabled?: boolean;
};

export default function AdminStoreDropdown({
  name,
  defaultValue,
  options,
  disabled = false,
}: AdminStoreDropdownProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(defaultValue);

  const selectedOption =
    options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <input type="hidden" name={name} value={value} />

      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex min-h-[2.85rem] w-full items-center justify-between gap-3 rounded-[0.9rem] border border-white/10 bg-white/[0.035] px-3.5 py-3 text-left text-sm text-white outline-none transition hover:border-white/25 focus:border-white/40 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="truncate">{selectedOption?.label ?? "Seleccionar"}</span>

        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className={`h-4 w-4 shrink-0 text-white/45 transition ${
            open ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+0.45rem)] z-50 overflow-hidden rounded-[0.9rem] border border-white/10 bg-[#080808] shadow-2xl shadow-black/60">
          <div role="listbox" className="max-h-64 overflow-y-auto p-1.5">
            {options.map((option) => {
              const active = option.value === value;

              return (
                <button
                  key={`${name}-${option.value}`}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    setValue(option.value);
                    setOpen(false);
                  }}
                  className={`flex min-h-10 w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm transition ${
                    active
                      ? "bg-white text-black"
                      : "text-white/70 hover:bg-white/[0.08] hover:text-white"
                  }`}
                >
                  <span className="truncate">{option.label}</span>
                  {active && <span className="text-xs">✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
