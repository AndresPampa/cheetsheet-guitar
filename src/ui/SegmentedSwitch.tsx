interface SegmentedSwitchProps<T extends string> {
  /** Accessible name of the group: `Idioma`. */
  label: string
  /** `name` replaces a symbol-only `label` (☾) as the button's accessible name. */
  options: Array<{ value: T; label: string; name?: string; lang?: string }>
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
          aria-label={option.name}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
