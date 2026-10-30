interface ShownSpokenProps {
  shown: string
  /** Read instead of `shown` by screen readers: `Locrio natural 6` for `Locrio ♮6`. */
  spoken: string
  className?: string
}

/** A text with signs that screen readers read in words; split only when the two differ. */
export function ShownSpoken({ shown, spoken, className }: ShownSpokenProps) {
  if (shown === spoken) return <span className={className}>{shown}</span>
  return (
    <>
      <span className={className} aria-hidden="true">
        {shown}
      </span>
      <span className="sr-only">{spoken}</span>
    </>
  )
}
