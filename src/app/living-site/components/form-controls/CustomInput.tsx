"use client";

import "./form-controls.css";

type CustomInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  name: string;
  label: string;
  error?: string | null;
};

export function CustomInput({
  id,
  name,
  label,
  value,
  onChange,
  type = "text",
  error,
  ...rest
}: CustomInputProps) {
  const filled = value !== undefined && value !== null && String(value) !== "";
  return (
    <div className="Field" data-filled={filled} data-status={error ? "error" : "default"}>
      <label className="Label" htmlFor={id}>
        {label}
      </label>
      <input
        className="Control"
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        {...rest}
      />
      {error && <div className="ErrorText">{error}</div>}
    </div>
  );
}
