type SectionLabelProps = {
  number: number
  children: string
  className?: string
}

// Typografisch nummerierter Abschnitt, z. B. „01 — WERKE“.
export default function SectionLabel({
  number,
  children,
  className = '',
}: SectionLabelProps) {
  return (
    <p className={`section-label ${className}`}>
      {String(number).padStart(2, '0')} — {children}
    </p>
  )
}
