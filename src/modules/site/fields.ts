// Contact details shown in the footer and on the Contact page.
// Admins edit them in Admin → Site info; anything left empty is simply not shown.
export const SITE_FIELDS = [
  { key: "hotline", label: "Hotline number", placeholder: "+880 1XXX-XXXXXX" },
  { key: "hotlineNote", label: "Hotline hours", placeholder: "Every day, 9am to 9pm" },
  { key: "phone", label: "Other phone", placeholder: "+880 1XXX-XXXXXX" },
  { key: "email", label: "Contact email", placeholder: "hello@example.com" },
  { key: "outlets", label: "Nursery or outlet addresses (one per line, as Name: address)", placeholder: "Dhanmondi: House 12, Road 5, Dhaka", multiline: true },
  { key: "facebook", label: "Facebook page link", placeholder: "https://facebook.com/..." },
  { key: "instagram", label: "Instagram link", placeholder: "https://instagram.com/..." },
  { key: "youtube", label: "YouTube link", placeholder: "https://youtube.com/@..." },
  { key: "whatsapp", label: "WhatsApp number", placeholder: "+880 1XXX-XXXXXX" },
] as const;

export type SiteKey = (typeof SITE_FIELDS)[number]["key"];
export type SiteInfo = Record<SiteKey, string>;

