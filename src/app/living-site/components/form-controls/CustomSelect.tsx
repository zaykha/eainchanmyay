"use client";

import React, { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import "./form-controls.css";

type CustomSelectProps = {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  status?: "default" | "error" | "success";
  disabled?: boolean;
  children: React.ReactNode;
};

type SelectLeafOption = {
  kind: "option";
  key: string;
  value: string;
  label: React.ReactNode;
};

type SelectGroupOption = {
  kind: "group";
  key: string;
  label: React.ReactNode;
  options: SelectLeafOption[];
};

type SelectMenuItem = SelectLeafOption | SelectGroupOption;

function collectOptions(children: React.ReactNode): SelectMenuItem[] {
  return React.Children.toArray(children).flatMap((child, childIndex) => {
    if (!child || typeof child !== "object" || !("props" in child)) return [];
    const element = child as React.ReactElement<{ value?: string; label?: React.ReactNode; children?: React.ReactNode }>;

    if (element.type === "optgroup") {
      const groupLabel = element.props.label ?? element.props.children;
      const options = React.Children.toArray(element.props.children)
        .map((nestedChild, nestedIndex) => {
          if (!nestedChild || typeof nestedChild !== "object" || !("props" in nestedChild)) return null;
          const nestedElement = nestedChild as React.ReactElement<{ value?: string; children?: React.ReactNode }>;
          return {
            kind: "option" as const,
            key: String(nestedElement.props.value ?? `group-${childIndex}-option-${nestedIndex}`),
            value: nestedElement.props.value ?? "",
            label: nestedElement.props.children,
          };
        })
        .filter(Boolean) as SelectLeafOption[];

      return options.length
        ? [
            {
              kind: "group" as const,
              key: `group-${childIndex}-${String(groupLabel)}`,
              label: groupLabel,
              options,
            },
          ]
        : [];
    }

    return [
      {
        kind: "option" as const,
        key: String(element.props.value ?? `option-${childIndex}`),
        value: element.props.value ?? "",
        label: element.props.children,
      },
    ];
  });
}

export function CustomSelect({
  id,
  name,
  label,
  value,
  onChange,
  error,
  status = "default",
  disabled,
  children,
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const filled = value !== undefined && value !== null && String(value) !== "";

  const items = useMemo(() => collectOptions(children), [children]);
  const flatOptions = useMemo(
    () =>
      items.flatMap((item) => (item.kind === "group" ? item.options : [item])),
    [items]
  );

  const activeOption = flatOptions.find((option) => option.value === value);

  return (
    <div className="Field" data-filled={filled} data-status={error ? "error" : status}>
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
          {items.map((item) =>
            item.kind === "group" ? (
              <div key={item.key} className="SelectGroup">
                <div className="SelectGroupLabel">{item.label}</div>
                {item.options.map((option) => (
                  <button
                    key={option.key}
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
            ) : (
              <button
                key={item.key}
                type="button"
                className="SelectOption"
                data-active={item.value === value}
                onClick={() => {
                  onChange(item.value);
                  setOpen(false);
                }}
              >
                {item.label}
              </button>
            )
          )}
        </div>
      )}
      {error && <div className="ErrorText">{error}</div>}
    </div>
  );
}
