// Regional profiles are simplified for planting advice and can be edited by admins (FR-2.4, FR-8.4).
export const REGIONS = [
  { key: "HAOR", name: "North-East haor and hills", rainfall: "HIGH", floodProne: true, droughtProne: false, saline: false,
    description: "Very high rainfall, with haor wetlands that stay flooded for months." },
  { key: "BARIND", name: "Barind tract", rainfall: "LOW", floodProne: false, droughtProne: true, saline: false,
    description: "The driest part of the country, with hard red soil and hot summers." },
  { key: "TEESTA", name: "Northern Teesta plains", rainfall: "MEDIUM", floodProne: false, droughtProne: false, saline: false,
    description: "Sandy loam plains with cool winters. Good litchi and mango country." },
  { key: "JAMUNA", name: "Jamuna-Brahmaputra floodplain", rainfall: "MEDIUM", floodProne: true, droughtProne: false, saline: false,
    description: "River floodplain with yearly monsoon floods and silty soil." },
  { key: "CENTRAL", name: "Central Dhaka and Madhupur", rainfall: "MEDIUM", floodProne: false, droughtProne: false, saline: false,
    description: "Raised red soil of the Madhupur tract and the urban Dhaka area." },
  { key: "PADMA", name: "Padma floodplain", rainfall: "MEDIUM", floodProne: true, droughtProne: false, saline: false,
    description: "Low land along the Padma and Meghna that floods in the monsoon." },
  { key: "WEST", name: "Western dry plains", rainfall: "MEDIUM", floodProne: false, droughtProne: true, saline: false,
    description: "Warm western plains with long dry seasons before the monsoon." },
  { key: "SW_COAST", name: "South-West coast", rainfall: "HIGH", floodProne: true, droughtProne: false, saline: true,
    description: "Tidal coast near the Sundarbans with salty soil and cyclone surges." },
  { key: "SE_PLAINS", name: "South-East plains", rainfall: "HIGH", floodProne: true, droughtProne: false, saline: false,
    description: "Wet, low-lying plains of Cumilla and Barishal." },
  { key: "CTG_COAST", name: "Chattogram coast", rainfall: "HIGH", floodProne: false, droughtProne: false, saline: true,
    description: "Heavy-rain coastal belt with sea winds and salty soil near the shore." },
  { key: "HILLS", name: "Chattogram Hill Tracts", rainfall: "HIGH", floodProne: false, droughtProne: false, saline: false,
    description: "Steep, well-drained hills with very high rainfall." },
] as const;

// division -> [district, regionKey]
export const DIVISIONS: Record<string, [string, string][]> = {
  Dhaka: [
    ["Dhaka", "CENTRAL"], ["Faridpur", "PADMA"], ["Gazipur", "CENTRAL"], ["Gopalganj", "PADMA"],
    ["Kishoreganj", "HAOR"], ["Madaripur", "PADMA"], ["Manikganj", "JAMUNA"], ["Munshiganj", "PADMA"],
    ["Narayanganj", "CENTRAL"], ["Narsingdi", "CENTRAL"], ["Rajbari", "PADMA"], ["Shariatpur", "PADMA"],
    ["Tangail", "JAMUNA"],
  ],
  Mymensingh: [["Mymensingh", "JAMUNA"], ["Jamalpur", "JAMUNA"], ["Netrokona", "HAOR"], ["Sherpur", "JAMUNA"]],
  Chattogram: [
    ["Bandarban", "HILLS"], ["Brahmanbaria", "SE_PLAINS"], ["Chandpur", "PADMA"], ["Chattogram", "CTG_COAST"],
    ["Cumilla", "SE_PLAINS"], ["Cox's Bazar", "CTG_COAST"], ["Feni", "SE_PLAINS"], ["Khagrachhari", "HILLS"],
    ["Lakshmipur", "SE_PLAINS"], ["Noakhali", "CTG_COAST"], ["Rangamati", "HILLS"],
  ],
  Rajshahi: [
    ["Bogura", "JAMUNA"], ["Chapainawabganj", "BARIND"], ["Joypurhat", "BARIND"], ["Naogaon", "BARIND"],
    ["Natore", "BARIND"], ["Pabna", "JAMUNA"], ["Rajshahi", "BARIND"], ["Sirajganj", "JAMUNA"],
  ],
  Khulna: [
    ["Bagerhat", "SW_COAST"], ["Chuadanga", "WEST"], ["Jashore", "WEST"], ["Jhenaidah", "WEST"],
    ["Khulna", "SW_COAST"], ["Kushtia", "WEST"], ["Magura", "WEST"], ["Meherpur", "WEST"],
    ["Narail", "WEST"], ["Satkhira", "SW_COAST"],
  ],
  Barishal: [
    ["Barguna", "SW_COAST"], ["Barishal", "SE_PLAINS"], ["Bhola", "SW_COAST"], ["Jhalokati", "SE_PLAINS"],
    ["Patuakhali", "SW_COAST"], ["Pirojpur", "SW_COAST"],
  ],
  Sylhet: [["Habiganj", "HAOR"], ["Moulvibazar", "HAOR"], ["Sunamganj", "HAOR"], ["Sylhet", "HAOR"]],
  Rangpur: [
    ["Dinajpur", "TEESTA"], ["Gaibandha", "JAMUNA"], ["Kurigram", "JAMUNA"], ["Lalmonirhat", "JAMUNA"],
    ["Nilphamari", "TEESTA"], ["Panchagarh", "TEESTA"], ["Rangpur", "TEESTA"], ["Thakurgaon", "TEESTA"],
  ],
};
