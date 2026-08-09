export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-label="Spudonomics logo"
    >
      {/* Potato tuber outline */}
      <path
        d="M9 12c-2.5 1-4 3.5-3.5 6.5C6 22 9.5 25 14 25.5c4.5.5 9-1.5 11-5 1.6-2.8 1.3-6.3-1-8.3-1.6-1.4-3.7-1.7-5.5-2.5-1.7-.7-3-2-4.9-2.2-1.8-.2-3.3.6-4.6 1.7Z"
        fill="currentColor"
        opacity="0.15"
      />
      <path
        d="M9 12c-2.5 1-4 3.5-3.5 6.5C6 22 9.5 25 14 25.5c4.5.5 9-1.5 11-5 1.6-2.8 1.3-6.3-1-8.3-1.6-1.4-3.7-1.7-5.5-2.5-1.7-.7-3-2-4.9-2.2-1.8-.2-3.3.6-4.6 1.7Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {/* Upward growth / margin arrow through the tuber */}
      <path
        d="M8.5 20.5 13 16l3 3 6.5-7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18.5 12h4v4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
