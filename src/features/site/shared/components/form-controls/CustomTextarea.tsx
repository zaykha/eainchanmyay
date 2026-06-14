"use client";

import "./form-controls.css";

type CustomTextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  id: string;
  name: string;
  label: string;
  error?: string | null;
  status?: "default" | "error" | "success";
};

export function CustomTextarea({
  id,
  name,
  label,
  value,
  onChange,
  rows = 4,
  error,
  status = "default",
  ...rest
}: CustomTextareaProps) {
  const filled = value !== undefined && value !== null && String(value) !== "";
  return (
    <div className="Field" data-filled={filled} data-status={error ? "error" : status}>
      <label className="Label" htmlFor={id}>
        {label}
      </label>
      <textarea
        className="Control"
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        rows={rows}
        {...rest}
      />
      {error && <div className="ErrorText">{error}</div>}
    </div>
  );
}
