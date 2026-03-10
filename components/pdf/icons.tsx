import { Svg, Path } from "@react-pdf/renderer";

const defaultSize = 8;

// Strip alpha channel from 8-digit hex to produce a valid 6-digit hex
// react-pdf SVG fill does not support 8-digit hex or currentColor
function solidHex(color: string): string {
  if (/^#[0-9a-fA-F]{8}$/.test(color)) {
    return color.slice(0, 7);
  }
  return color;
}

interface IconProps {
  size?: number;
  color?: string;
}

export function EmailIcon({ size = defaultSize, color = "#000000" }: IconProps) {
  const c = solidHex(color);
  return (
    <Svg viewBox="0 0 20 20" width={size} height={size}>
      <Path
        fill={c}
        d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z"
      />
      <Path
        fill={c}
        d="M19 8.839l-7.831 3.916a2.75 2.75 0 01-2.338 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z"
      />
    </Svg>
  );
}

export function PhoneIcon({ size = defaultSize, color = "#000000" }: IconProps) {
  const c = solidHex(color);
  return (
    <Svg viewBox="0 0 20 20" width={size} height={size}>
      <Path
        fill={c}
        d="M2 3.5A1.5 1.5 0 013.5 2h1.148a1.5 1.5 0 011.465 1.175l.716 3.223a1.5 1.5 0 01-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 006.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 011.767-1.052l3.223.716A1.5 1.5 0 0118 15.352V16.5a1.5 1.5 0 01-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 012.43 8.326 13.019 13.019 0 012 5V3.5z"
      />
    </Svg>
  );
}

export function LocationIcon({ size = defaultSize, color = "#000000" }: IconProps) {
  const c = solidHex(color);
  return (
    <Svg viewBox="0 0 20 20" width={size} height={size}>
      <Path
        fill={c}
        fillRule="evenodd"
        d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
      />
    </Svg>
  );
}

// --- Section icons ---

export function SummaryIcon({ size = defaultSize, color = "#000000" }: IconProps) {
  const c = solidHex(color);
  return (
    <Svg viewBox="0 0 20 20" width={size} height={size}>
      <Path
        fill={c}
        fillRule="evenodd"
        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
      />
    </Svg>
  );
}

export function ExperienceIcon({ size = defaultSize, color = "#000000" }: IconProps) {
  const c = solidHex(color);
  return (
    <Svg viewBox="0 0 20 20" width={size} height={size}>
      <Path
        fill={c}
        fillRule="evenodd"
        d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h4a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h2zm4-1a1 1 0 00-1 1v1h2V6a1 1 0 00-1-1z"
      />
    </Svg>
  );
}

export function ProjectsIcon({ size = defaultSize, color = "#000000" }: IconProps) {
  const c = solidHex(color);
  return (
    <Svg viewBox="0 0 20 20" width={size} height={size}>
      <Path
        fill={c}
        d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
      />
    </Svg>
  );
}

export function SkillsIcon({ size = defaultSize, color = "#000000" }: IconProps) {
  const c = solidHex(color);
  return (
    <Svg viewBox="0 0 20 20" width={size} height={size}>
      <Path
        fill={c}
        fillRule="evenodd"
        d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
      />
    </Svg>
  );
}

export function EducationIcon({ size = defaultSize, color = "#000000" }: IconProps) {
  const c = solidHex(color);
  return (
    <Svg viewBox="0 0 20 20" width={size} height={size}>
      <Path
        fill={c}
        fillRule="evenodd"
        d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0z"
      />
    </Svg>
  );
}

export function InterestsIcon({ size = defaultSize, color = "#000000" }: IconProps) {
  const c = solidHex(color);
  return (
    <Svg viewBox="0 0 20 20" width={size} height={size}>
      <Path
        fill={c}
        fillRule="evenodd"
        d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
      />
    </Svg>
  );
}
