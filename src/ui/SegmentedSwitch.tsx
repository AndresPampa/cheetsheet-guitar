interface SegmentedSwitchProps<T extends string> {
  /** Accessible name of the group: `Idioma`. */
  label: string
  options: Array<{ value: T; label: string; lang?: string }>
  value: T
  onChange: (value: T) => void
}

/** A group of toggle buttons (aria-pressed) where exactly one is on, like Triads / Sevenths. */
export function SegmentedSwitch<T extends string>({
  label,
  options,
  value,
  onChange,
}: SegmentedSwitchProps<T>) {
  return (
    <div className="segmented-switch" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          lang={option.lang}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
