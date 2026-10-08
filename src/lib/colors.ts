export interface ColorPreset {
  name: string;
  hex: string;
}

export const PRESET_COLORS: ColorPreset[] = [
  { name: "Club Green", hex: "#1B4D3E" },
  { name: "Black", hex: "#111111" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Gold", hex: "#D4AF37" },
  { name: "Navy Blue", hex: "#001F3F" },
  { name: "Blue", hex: "#1E40AF" },
  { name: "Wine", hex: "#722F37" },
  { name: "Burgundy", hex: "#800020" },
  { name: "Maroon", hex: "#800000" },
  { name: "Red", hex: "#DC2626" },
  { name: "Royal Blue", hex: "#2563EB" },
  { name: "Sky Blue", hex: "#38BDF8" },
  { name: "Forest Green", hex: "#15803D" },
  { name: "Yellow", hex: "#EAB308" },
  { name: "Grey", hex: "#6B7280" },
  { name: "Khaki / Brown", hex: "#A07855" },
  { name: "Orange", hex: "#EA580C" },
  { name: "Purple", hex: "#7E22CE" },
  { name: "Pink", hex: "#EC4899" },
  { name: "Emerald", hex: "#10B981" },
  { name: "Teal", hex: "#0D9488" },
];

export const COLOR_HEX_MAP: Record<string, string> = {
  "club green": "#1B4D3E",
  "black": "#111111",
  "white": "#FFFFFF",
  "gold": "#D4AF37",
  "navy blue": "#001F3F",
  "navy": "#001F3F",
  "blue": "#1E40AF",
  "royal blue": "#2563EB",
  "sky blue": "#38BDF8",
  "light blue": "#93C5FD",
  "wine": "#722F37",
  "burgundy": "#800020",
  "maroon": "#800000",
  "red": "#DC2626",
  "forest green": "#15803D",
  "green": "#16A34A",
  "yellow": "#EAB308",
  "grey": "#6B7280",
  "gray": "#6B7280",
  "khaki / brown": "#A07855",
  "khaki": "#A07855",
  "brown": "#7B3F00",
  "orange": "#EA580C",
  "purple": "#7E22CE",
  "pink": "#EC4899",
  "emerald": "#10B981",
  "teal": "#0D9488",
  "charcoal": "#374151",
  "beige": "#F5F5DC",
  "olive": "#808000",
  "cream": "#FFFDD0",
  "lavender": "#E6E6FA",
  "coral": "#FF7F50",
  "turquoise": "#40E0D0",
  "silver": "#C0C0C0",
  "indigo": "#4B0082",
};

/**
 * Returns hex color string for a given color name, with fallback.
 */
export function getColorHex(name: string): string {
  if (!name) return "#1B4D3E";
  const normalized = name.trim().toLowerCase();
  if (COLOR_HEX_MAP[normalized]) {
    return COLOR_HEX_MAP[normalized];
  }
  // Check if any key is contained in the name (e.g. "dark blue" -> "blue")
  for (const [key, hex] of Object.entries(COLOR_HEX_MAP)) {
    if (normalized.includes(key)) {
      return hex;
    }
  }
  return "#1B4D3E";
}

/**
 * Capitalizes each word nicely, e.g. "wine" -> "Wine", "royal blue" -> "Royal Blue"
 */
export function formatColorName(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}
