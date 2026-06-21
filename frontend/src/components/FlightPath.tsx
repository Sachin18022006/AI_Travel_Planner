interface Props {
  className?: string;
}


export default function FlightPath({ className = '' }: Props) {
  return (
    <svg
      viewBox="0 0 400 200"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M20 160 C 100 40, 180 180, 260 60 S 380 40, 380 40"
        stroke="#D4A24C"
        strokeWidth="2"
        strokeDasharray="2 10"
        strokeLinecap="round"
        opacity="0.5"
      />
      <circle cx="20" cy="160" r="4" fill="#3C9C8F" />
      <circle cx="380" cy="40" r="4" fill="#B5483D" />
      <g transform="translate(255, 66) rotate(-35)">
        <path
          d="M0 0 L16 4 L0 8 L4 4 Z"
          fill="#E4BD72"
          transform="translate(-8,-4)"
        />
      </g>
    </svg>
  );
}
