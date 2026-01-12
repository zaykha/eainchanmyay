"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import "./form-controls.css";

type CustomSelectProps = {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  disabled?: boolean;
  children: React.ReactNode;
};

export function CustomSelect({
  id,
  name,
  label,
  value,
  onChange,
  error,
  disabled,
  children,
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const filled = value !== undefined && value !== null && String(value) !== "";

  const options = useMemo(
    () =>
      (Array.isArray(children) ? children : [children])
        .map((child) => {
          if (!child || typeof child !== "object" || !("props" in child)) return null;
          const element = child as React.ReactElement<{ value?: string; children?: React.ReactNode }>;
          return {
            value: element.props.value ?? "",
            label: element.props.children,
          };
        })
        .filter(Boolean) as { value: string; label: React.ReactNode }[],
    [children]
  );

  const activeOption = options.find((option) => option.value === value);

  return (
    <div className="Field" data-filled={filled} data-status={error ? "error" : "default"}>
      <label className="Label" htmlFor={id}>
        {label}
      </label>
      <button
        type="button"
        className="Control SelectTrigger"
        id={id}
        name={name}
        onClick={() => {
          if (disabled) return;
          setOpen((prev) => !prev);
        }}
        onBlur={() => {
          setTimeout(() => setOpen(false), 120);
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
      >
        <span className="SelectValue">{activeOption?.label}</span>
        <ChevronDown size={16} className={`SelectIcon ${open ? "open" : ""}`} />
      </button>
      {open && (
        <div className="SelectMenu" role="listbox">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className="SelectOption"
              data-active={option.value === value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
      {error && <div className="ErrorText">{error}</div>}
    </div>
  );
}
