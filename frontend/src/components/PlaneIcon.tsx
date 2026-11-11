export function PlaneIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M3 12h18" />
      <path d="M14 5l7 7-7 7" />
      <path d="M8 12l-3-5" />
      <path d="M8 12l-3 5" />
    </svg>
  )
}
