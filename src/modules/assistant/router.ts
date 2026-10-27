// Intent routing and conversation state for the assistant.
//
// Routing is plain code, so it is fast, free and testable. It decides:
// - whether a message is clearly out of scope or an attempt to change the
//   rules (refused without calling the AI at all),
// - which intent the message has, which guides the AI and drives offline mode,
// - which tree, site and symptom the conversation is about (memory).

export const INTENTS = [
  "greeting",
  "tree_recommendation",
  "recommendation_explanation",
  "tree_comparison",
  "tree_care",
  "care_troubleshooting",
  "product_question",
  "personal_context",
  "tree_info",
  "insufficient_information",
  "out_of_scope",
] as const;
export type Intent = (typeof INTENTS)[number];

export const SYMPTOMS: Record<string, { label: string; re: RegExp }> = {
  "yellow-leaves": { label: "yellow leaves", re: /\byellow(ing|ish)?\b|\bpale (leaves|leaf)\b|chlorosis|হলুদ/ },
  wilting: { label: "wilting or drooping", re: /\bwilt(ing|ed|s)?\b|\bdroop(ing|y|s)?\b|\blimp\b|নেতিয়ে|ঝিমিয়ে/ },
  "leaf-spots": { label: "spots or mould on leaves", re: /\bspots?\b|\bpowder(y)?\b|\bmou?ld\b|\bfung(us|al)\b|\bblack (patches|marks)\b|\bbrown (patches|edges|tips)\b|দাগ/ },
  "leaf-drop": { label: "leaves falling", re: /leaves? (are |is )?(falling|dropping|fall|drop)|losing (its |the )?leaves|পাতা ঝরে/ },
  "fruit-drop": { label: "flowers or fruit falling", re: /(fruits?|flowers?|mukul|buds?) (are |is )?(falling|dropping|fall|drop)|ফল ঝরে|মুকুল ঝরে/ },
  "poor-growth": { label: "poor or slow growth", re: /not growing|(grow(s|ing)?|growth) (very )?slow(ly)?|slow(ly)? grow|stunted|no new (leaves|growth)|বাড়ছে না/ },
  "curled-leaves": { label: "curled leaves", re: /\bcurl(ed|ing|s)?\b|কুঁকড়ে/ },
  "holes-in-leaves": { label: "holes or chewed leaves", re: /\bholes?\b|\bchewed\b|\beaten\b|caterpillars?|worms?\b|শুঁয়োপোকা/ },
  "sticky-leaves": { label: "sticky leaves or ants", re: /\bsticky\b|honeydew|\bants?\b.*(leaves|tree|stem)|sooty/ },
  general: { label: "a plant problem", re: /\b(sick|unhealthy|dying|not (doing |looking )?(well|good|healthy)|something (is )?wrong|problem with|diseased?)\b|অসুস্থ/ },
  pests: { label: "insects or pests", re: /\b(insects?|bugs?|pests?|aphids?|mealy ?bugs?|scales?|whitefl(y|ies)|mites?|termites?|hoppers?)\b|পোকা/ },
};

export type Slot = "tree" | "describe" | "pattern" | "soil" | "watering" | "place" | "recent" | "pestlook";

export const SLOT_QUESTIONS: Record<Slot, string> = {
  tree: "Which tree is it? If you bought it on Gaach, its name or nickname is enough.",
  describe: "What exactly do you see? For example yellow or spotted leaves, drooping, insects, leaves or fruit falling, or no new growth.",
  pattern: "Which leaves are affected: the old lower leaves, the new leaves at the top, or leaves all over? And are the veins still green?",
  soil: "How does the soil feel about 5 to 10 cm down near the stem: dry, moist, or wet with water standing after rain or watering?",
  watering: "How often do you water it, and has there been heavy rain or a long dry spell lately?",
  place: "Is it in the ground or in a pot or drum, and roughly how many hours of direct sun does it get?",
  recent: "Did anything change recently, for example it was planted or moved in the last few weeks, you added fertilizer, or you noticed insects under the leaves?",
  pestlook: "What do you see on the plant: tiny green or black insects, white cottony clumps, small bumps stuck to stems, silvery trails inside leaves, or holes and chewed edges? Look under the leaves too.",
};

export const SYMPTOM_SLOTS: Record<string, Slot[]> = {
  "yellow-leaves": ["tree", "pattern", "soil", "watering", "place"],
  wilting: ["tree", "soil", "watering", "recent"],
  "leaf-spots": ["tree", "pattern", "recent"],
  "leaf-drop": ["tree", "soil", "watering", "recent"],
  "fruit-drop": ["tree", "watering", "pestlook"],
  "poor-growth": ["tree", "place", "soil", "recent"],
  "curled-leaves": ["tree", "pestlook"],
  "holes-in-leaves": ["tree", "pestlook"],
  "sticky-leaves": ["tree", "pestlook"],
  pests: ["tree", "pestlook"],
  general: ["tree", "describe"],
};

export type Trouble = { symptom: string; slots: Partial<Record<Slot, string>>; asked: Slot | null; done: boolean };

export type ConvoState = {
  treeSlug?: string; // tree being discussed
  compareSlugs?: string[]; // trees in the last comparison
  siteName?: string; // saved site being discussed
  lastIntent?: Intent;
  trouble?: Trouble;
};

export function parseState(json: string): ConvoState {
  try {
    const s = JSON.parse(json);
    return s && typeof s === "object" ? s : {};
  } catch {
    return {};
  }
}

// ---------- scope ----------

// Words that only make sense in a tree conversation
const TOPICAL = /\b(trees?|plants?|planting|saplings?|seedlings?|seeds?|soil|fertili[sz]\w*|compost|manure|mulch|leaf|leaves|roots?|prune|pruning|pests?|insects?|disease|fung\w*|garden\w*|rooftop|backyard|fruits?|flowers?|shade|canopy|nursery|gaach|monsoon|drought|graft\w*|transplant\w*|neem|guava|mango|lemon|coconut|papaya|jackfruit|litchi|lychee|palm|bamboo|hibiscus|teak|mahogany|hedge|timber|trunk|branch\w*|bark)\b|গাছ|চারা|সার|মাটি|পাতা|ফল|ফুল|বীজ|কলম|যত্ন|ছাদ|টব|পোকা/i;
const DOMAIN = /\b(sites?|trees?|plants?|planting|saplings?|seedlings?|seeds?|soil|water(ing)?|fertili[sz]\w*|compost|manure|mulch|leaf|leaves|roots?|prune|pruning|pests?|insects?|bugs?|disease|fung\w*|grow\w*|garden\w*|rooftop|roof|backyard|yard|balcony|fruits?|flowers?|sun(light)?|shade|orders?|buy|price|cost|deliver\w*|stock|cart|checkout|care|yellow\w*|wilt\w*|flood\w*|drum|pots?|branch\w*|trunk|bark|harvest|hedge|timber|spray|canopy|tall|height|spread|sapling|nursery|gaach|compare|recommend\w*|suggest\w*|site|district|monsoon|rain\w*|drought|salt\w*|coastal|graft\w*|transplant\w*|cutting|stake|neem|guava|mango|lemon|lime|coconut|papaya|jackfruit|litchi|lychee|palm|bamboo|hibiscus|teak|mahogany)\b|গাছ|চারা|সার|মাটি|পানি|পাতা|ফল|ফুল|রোদ|বীজ|কলম|যত্ন|দাম|কিনতে|ছাদ|টব|পোকা|অর্ডার/i;

// Attempts to change the assistant's rules or reach other people's data
const MANIPULATION = /ignore (all |any |your |the |previous |prior |above |earlier )*(rules|instructions|prompts?)|system prompt|developer mode|jailbreak|\bDAN\b|you are now (an?|the)|no (rules|restrictions|limits)|reveal (your|the) (rules|instructions|prompt)|disregard (your|the|all)|override (your|the)|pretend (you are|to be)|\badmin (password|access|mode)\b|i am the (admin|developer|owner)|as the (site )?admin/i;
const OTHER_USERS = /\b(other|another|someone else'?s?|all|every) (users?|customers?|people'?s?|buyers?)\b.*\b(orders?|data|sites?|purchases?|chats?|address|phone|email)|\b(orders?|data|sites?|purchases?|chats?|address|phone|email)\b.*\b(of|for|from) (other|another|all) (users?|customers?)|user ?id|\bdatabase\b.*\b(dump|all rows|export)/i;

// Clearly unrelated requests
const OFF_TOPIC = /\b(capital of|python|javascript|code|program(ming)?|election|president|prime minister|politic\w*|jokes?|poems?|poetry|songs?|lyrics|equation|solve|math\w*|weather (in|tomorrow|today)|translate|football|cricket|world cup|movies?|films?|phones?|iphone|samsung|laptops?|blockchain|crypto|bitcoin|stock (market|exchange)|invest\w*|recipes?|cook\w*|biryani|medicine|fever|diet|lose weight|homework|assignment|essays?|story|stories|harry potter|hack\w*|wifi|password|email (to|for)|cv|resume|visa|exam|loan|dating|girlfriend|boyfriend|celebrit\w*|games?|bitcoin)\b/i;

export const CHEMICAL_DOSE = /\b(dose|dosage|how much|how many (ml|grams?)|ml|grams?|mix)\b.*\b(pesticides?|insecticides?|fungicides?|herbicides?|chemicals?|poison|chlorpyrifos|imidacloprid|cypermethrin|malathion|carbendazim|mancozeb|carbofuran|sevin|ripcord|furadan)\b|\b(chlorpyrifos|imidacloprid|cypermethrin|malathion|carbendazim|mancozeb|carbofuran|furadan)\b/i;

export function hasDomainWords(text: string): boolean {
  return DOMAIN.test(text);
}

export type ScopeCheck = { inScope: true } | { inScope: false; reason: string };

// Hard rules applied before any AI call. Only clear cases are refused here;
// anything uncertain is left to the AI, which has its own refusal rule.
// "Rahim Uddin's saved sites": a named person's account data
const NAMED_PERSON_DATA = /\b[A-Z][a-z]+(?: [A-Z][a-z]+)?'s (saved )?(sites?|orders?|address|phone( number)?|email|purchases?|account|cart|chats?)\b/;

export function preScreen(message: string): ScopeCheck {
  if (MANIPULATION.test(message)) return { inScope: false, reason: "tried to change the assistant's rules" };
  if (OTHER_USERS.test(message) || NAMED_PERSON_DATA.test(message)) return { inScope: false, reason: "asked for other users' data" };
  if (OFF_TOPIC.test(message) && !TOPICAL.test(message.replace(OFF_TOPIC, ""))) return { inScope: false, reason: "off-topic" };
  return { inScope: true };
}

// ---------- intent ----------

const FOLLOW_UP = /^(and |but |so |ok(ay)?[, ]|what about|how about|is it|does it|can it|will it|which one|that one|this one|it |its |they |them |why|how|what|when|where|yes|no|yeah|nope|sure|thanks|thank you)|\b(it|this|that|these|those|them|one)\b/i;

export function detectSymptom(text: string): string | null {
  const t = text.toLowerCase();
  // more specific symptoms first
  for (const key of ["sticky-leaves", "fruit-drop", "leaf-drop", "holes-in-leaves", "curled-leaves", "leaf-spots", "yellow-leaves", "wilting", "poor-growth", "pests", "general"]) {
    if (SYMPTOMS[key].re.test(t)) return key;
  }
  return null;
}

export function classify(message: string, state: ConvoState, treesNamed: number, siteMentioned = false): { intent: Intent; reason?: string } {
  const m = message.toLowerCase().trim();
  const pre = preScreen(message);
  if (!pre.inScope) return { intent: "out_of_scope", reason: pre.reason };
  if (/^(hi|hello|hey|salam|assalamu ?alaikum|good (morning|evening|afternoon)|thanks|thank you|ধন্যবাদ|হ্যালো|আসসালামু)\b/.test(m) && m.split(/\s+/).length <= 5) return { intent: "greeting" };

  // "What can you do?", "who are you?", "help": explain what the advisor does
  if (/\bwhat ?(can|could|do) ?(you|u) ?(do|help)|\bwho (are|r) (you|u)\b|\bwhat (are|r) (you|u)\b|\bhow (can|do|could) (you|u) help\b|^(help|help me|menu|options)\W*$/.test(m) && !hasDomainWords(m.replace(/\bhelp\b/g, ""))) return { intent: "greeting" };

  // Chemical doses are a care-safety question, answered with the safety guide
  if (CHEMICAL_DOSE.test(m)) return { intent: "tree_care" };
  const inTrouble = state.trouble && !state.trouble.done;
  const justDiagnosed = state.lastIntent === "care_troubleshooting" && state.trouble?.done;
  const otherTopic = /\b(compare|price|cost|buy|recommend|suggest|stock|deliver\w*|order)\b/.test(m);
  if (detectSymptom(m) && !/\b(price|cost|buy|stock)\b/.test(m)) return { intent: "care_troubleshooting" };
  if (inTrouble && !otherTopic && m.split(/\s+/).length <= 40) return { intent: "care_troubleshooting" };
  // Extra details right after an answer about a problem refine that answer
  if (justDiagnosed && !otherTopic && !/\?$/.test(m) && m.split(/\s+/).length <= 25) return { intent: "care_troubleshooting" };

  // The user's own purchases and sites
  if (/\b(have i|did i) (bought|buy|ordered|order|purchased|planted)|\bi (bought|ordered|purchased|planted)\b|\bmy (orders?|purchases?|saved sites?|sites)\b|\bwhat (should|do) i do next\b|\bnext step/.test(m)) return { intent: "personal_context" };

  if (/\bwhy\b.*\b(not|n't|no)\b.*\b(recommend|suggest|show|list|includ|appear)|\bwhy\b.*\b(recommend|suggest)|\bwhy\b.*\b(on|in) (the|my|this) (list|results)\b|not (recommended|suggested|in (the|my) results)|exclud/.test(m)) return { intent: "recommendation_explanation" };
  if (/\b(is|are) [\w ]{1,25} (a )?(good|ok|okay|suitable|right|fine) (choice |option |fit |idea )?for (my|our|the)\b|\b(is|are) (my|the|our) [\w ]{2,20} (good|ok|okay|suitable|right|fine) for\b|\bcan i (grow|plant) [\w ]{1,25} (on|in|at) my\b|\b(will|would|does) [\w ]{1,25} (grow|fit|survive) (on|in|at) my\b/.test(m)) return { intent: "recommendation_explanation" };
  if (/\b(compare|comparison|vs\.?|versus|difference between|differences)\b/.test(m) || (treesNamed >= 2 && /\b(better|which|or|cheaper|taller|smaller|bigger|less|more)\b/.test(m))) return { intent: "tree_comparison" };
  if (/\b(price|prices|cost|costs|taka|tk|৳|in stock|stock|available|availability|buy|purchase|deliver\w*|payment|pay|cash on delivery|cod)\b|\bdo you (have|sell|stock)\b|\bwhat sizes?\b|\bsizes? (are |do you )?(available|have|sell)|\bhow much (is|are|does (it|a|an|the) [\w ]{0,30}cost|for)\b|\border\b|দাম|কিনতে|অর্ডার/.test(m)) return { intent: "product_question" };
  if (/\b(which|what)\b[\w\s]{0,25}\b(trees?|plants?)\b|\b(best|good|suitable|right) (tree|trees|plant|plants)\b|\b(recommend|suggest)\w*\b|\bshould i (plant|grow)\b|\bwhat (can|should) i (plant|grow)\b|\bsuits?\b|\bfit (my|in|a)\b|\bfor my (place|rooftop|roof|backyard|yard|garden|balcony|site|land|village)\b|\b(small|tiny|little|limited|narrow|big|large|small size|little size) (space|place|area|yard|garden|balcony|rooftop|roof|spot|land|plot)\b|\bi (have|got) (a |an |only a |only )?(very )?(small |tiny |little |big |large )?(size )?(rooftop|roof|balcony|yard|backyard|garden|land|space|place|plot)\b/.test(m)) return { intent: "tree_recommendation" };
  if (siteMentioned && !/\b(recommend\w*|suggest\w*|suits?|good for|which tree|what tree|plant|grow)\b/.test(m)) return { intent: "personal_context" };
  // A question about a tree's own attributes
  if (treesNamed >= 1 && /\b(handle|tolerate|survive|cope|need|needs|tall|height|wide|width|big|spread|season|when does|scientific|bangla|name|grow in|like|take|salt\w*|flood\w*|drought)\b/.test(m) && !/\bhow (do|should|can) i\b|\bhow to\b|\bhow often\b|\bwhen should i\b|fertili|prune|pit\b/.test(m)) return { intent: "tree_info" };
  if (/\bmy (tree|trees|plant|plants|sapling|saplings)\b|\bmy [a-z]+ tree\b/.test(m)) return { intent: "personal_context" };
  if (/\b(water|watering|fertili[sz]\w*|compost|manure|prune|pruning|plant(ing)?|pit|mulch|soil|sun(light)?|shade|care|repot|transplant|stake|protect|harvest|graft|grow)\b|সার|পানি|যত্ন|লাগাব|মাটি/.test(m)) return { intent: "tree_care" };
  if (treesNamed >= 1) return { intent: "tree_info" };
  if (hasDomainWords(m)) return { intent: "insufficient_information" };
  // Short follow-ups lean on the conversation so far
  if ((state.treeSlug || state.lastIntent) && (FOLLOW_UP.test(m) || m.split(/\s+/).length <= 8)) return { intent: state.lastIntent && state.lastIntent !== "out_of_scope" && state.lastIntent !== "greeting" ? state.lastIntent : "insufficient_information" };
  return { intent: "out_of_scope", reason: "no tree topic found" };
}

// ---------- troubleshooting memory ----------

function fillSlotsFromText(text: string, slots: Partial<Record<Slot, string>>) {
  const m = text.toLowerCase();
  if (!slots.pattern && /\b(old|older|lower|bottom|new|young|top|upper|all over|whole|every leaf|veins?)\b/.test(m)) slots.pattern = text;
  if (!slots.soil && /\b(soggy|wet|waterlogged|standing water|puddle|dry|moist|damp|muddy)\b/.test(m)) slots.soil = text;
  if (!slots.watering && /\b(every (day|morning|evening|other day|\d+ days?|week)|daily|twice|once a|times a|not watered|forgot to water|never water)\b/.test(m)) slots.watering = text;
  if (!slots.place && /\b(pot|drum|tub|container|rooftop|roof|balcony|ground|garden|yard|hours? of (direct )?sun|full sun|shade)\b/.test(m)) slots.place = text;
  if (!slots.recent && /\b(transplant\w*|moved|planted (it )?(last|\d)|new(ly)? planted|fertili[sz]\w*|urea|sprayed|storm|nothing changed|no change)\b/.test(m)) slots.recent = text;
  if (!slots.pestlook && /\b(green|black|white|cotton\w*|bumps?|scales?|silver\w*|trails?|holes?|chewed|insects?|bugs?|aphids?|mealy\w*|ants?|no insects|nothing under)\b/.test(m)) slots.pestlook = text;
}

// Updates the troubleshooting details from the user's latest message and
// returns the next question to ask, or null when enough is known.
export function updateTrouble(state: ConvoState, message: string, treeSlug: string | null): { trouble: Trouble; nextSlot: Slot | null } {
  const symptom = detectSymptom(message);
  let t = state.trouble;
  const sameProblem = t && (!symptom || symptom === t.symptom || t.symptom === "general" || symptom === "general");
  if (!t || !sameProblem || (t.done && symptom && symptom !== t.symptom)) t = { symptom: symptom ?? "general", slots: {}, asked: null, done: false };
  else t = { ...t, slots: { ...t.slots }, done: false };
  // A vague problem becomes specific once the user describes what they see
  if (t.symptom === "general" && symptom && symptom !== "general") t.symptom = symptom;
  // The answer to the question asked last turn fills that slot
  if (t.asked && !t.slots[t.asked]) t.slots[t.asked] = message.slice(0, 300);
  if (treeSlug) t.slots.tree = treeSlug;
  fillSlotsFromText(message, t.slots);
  const giveUp = /\b(don'?t know|not sure|no idea|skip|just tell me|whatever)\b/i.test(message);
  const required = SYMPTOM_SLOTS[t.symptom] ?? ["tree"];
  const next = giveUp ? null : required.find((s) => !t!.slots[s]) ?? null;
  t.asked = next;
  if (!next) t.done = true;
  return { trouble: t, nextSlot: next };
}

// Short summary of what the conversation has established (memory)
export function summarize(state: ConvoState, treeName: string | null): string {
  const parts: string[] = [];
  if (treeName) parts.push(`Tree being discussed: ${treeName}.`);
  if (state.siteName) parts.push(`Site being discussed: "${state.siteName}".`);
  if (state.trouble) {
    const t = state.trouble;
    const known = Object.entries(t.slots).filter(([k]) => k !== "tree").map(([k, v]) => `${k}: "${v}"`);
    parts.push(`Troubleshooting ${SYMPTOMS[t.symptom]?.label ?? t.symptom}${t.done ? " (enough details collected)" : ""}.${known.length ? " Details from the user: " + known.join("; ") + "." : ""}`);
  }
  return parts.join(" ");
}
