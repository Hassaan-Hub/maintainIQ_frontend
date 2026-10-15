// Labelled form control used by every form. Renders an <input> by default and
// an <textarea> or <select> when `as` is set, keeping labels and inline errors
// consistent without a UI library.
export default function FormField({
  id,
  label,
  as = "input",
  type = "text",
  value,
  onChange,
  error,
  autoComplete,
  placeholder,
  rows = 4,
  children,
  required = false,
  maxLength,
  min,
  max,
  step,
  disabled = false,
  readOnly = false,
  hint,
}) {
  const errorId = error ? `${id}-error` : undefined;
  const hintId = hint ? `${id}-hint` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  const commonProps = {
    id,
    name: id,
    value,
    onChange,
    disabled,
    "aria-invalid": error ? "true" : "false",
    "aria-describedby": describedBy,
    className: error ? "input input-error" : "input",
  };

  let control;
  if (as === "textarea") {
    control = (
      <textarea {...commonProps} rows={rows} placeholder={placeholder} maxLength={maxLength} readOnly={readOnly} />
    );
  } else if (as === "select") {
    control = (
      <select {...commonProps} readOnly={readOnly}>
        {children}
      </select>
    );
  } else {
    control = (
      <input
        {...commonProps}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        maxLength={maxLength}
        min={min}
        max={max}
        step={step}
        readOnly={readOnly}
      />
    );
  }

  return (
    <div className="field">
      <label htmlFor={id}>
        {label}
        {required ? <span className="req" aria-hidden="true"> *</span> : null}
      </label>
      {control}
      {hint ? (
        <p className="field-hint muted" id={hintId}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="field-error" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
