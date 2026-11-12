// Side-view plane heading right. 24px grid, 2px rounded stroke.
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
      <path d="M3 13.5h15.5a2.5 2.5 0 0 0 0-5H15L10 3H8l2.5 5.5H6L4.5 6.5H3l1 3.5z" />
      <path d="M10 13.5L8 19h2l4.5-5.5" />
    </svg>
  )
}
