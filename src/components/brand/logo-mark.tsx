export const brand = {
  navy: "#0A1628",
  blue: "#2F6BFF",
  blueHover: "#1F54E8",
  blueSoft: "#E8EFFF",
} as const;

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 80 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M4 22h16M4 36h22M4 50h14"
        stroke={brand.blue}
        strokeWidth="5.5"
        strokeLinecap="round"
      />
      <rect
        x="22.5"
        y="13.5"
        width="42"
        height="42"
        rx="9"
        stroke={brand.navy}
        strokeWidth="4.5"
      />
      <path
        d="M34 36.5 43.5 46 74 12"
        stroke={brand.blue}
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
