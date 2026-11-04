interface ChipAddProps {
  /** Pointer hint, e.g. "Agregar Dm7 a la progresión". */
  title: string
  disabled: boolean
  onClick: () => void
}

/**
 * The "+" on a chord chip: a pointer shortcut to the progression. Out of the tab order and hidden
 * from screen readers (56 extra stops otherwise); they open the chip and use + Add in the chord
 * panel. The sign is drawn in CSS so it stays out of the chip's text.
 */
export function ChipAdd({ title, disabled, onClick }: ChipAddProps) {
  return (
    <button
      type="button"
      className="chip-add"
      tabIndex={-1}
      aria-hidden="true"
      title={title}
      disabled={disabled}
      // A click would focus it (Chromium): focus must not land on an aria-hidden button.
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    />
  )
}
