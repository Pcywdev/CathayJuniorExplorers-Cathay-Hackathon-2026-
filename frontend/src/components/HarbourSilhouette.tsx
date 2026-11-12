// Hong Kong harbour skyline as a flat silhouette in Line, with the Peak behind. Background decoration, so it sits quietly.
export function HarbourSilhouette({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 393 120" preserveAspectRatio="xMidYMax slice" className={`block w-full ${className}`} aria-hidden="true">
      {/* the Peak ridge */}
      <path d="M0 74c40-22 80-50 128-50s70 30 106 26 64-34 102-34 44 18 57 26v78H0z" className="fill-line" opacity="0.5" />
      {/* towers */}
      <path
        className="fill-line"
        d="M8 120V86h18v34zM30 120V66h20v54zM54 120V78l11-14 11 14v42zM82 120V50l12-12 12 12v70zM110 120V70h16v50zM130 120V40h8l5-14 5 14h8v80zM160 120V60l10-10 10 10v60zM184 120V84h18v36zM206 120V58h14v62zM224 120V90h20v30zM248 120V64h16v56zM268 120V80h22v40zM294 120V54l9-9 9 9v66zM316 120V76h18v44zM338 120V92h22v28zM364 120V70h14v50zM382 120V88h11v32z"
      />
      {/* water line */}
      <path d="M0 116h393v4H0z" className="fill-line" />
    </svg>
  )
}
