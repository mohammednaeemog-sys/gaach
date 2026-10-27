// Care knowledge base used by the AI Tree Advisor (FR-7.3, FR-7.4).
//
// Each guide is split into sections; the assistant retrieves sections, not
// whole guides, so a recommendation always stays next to its cautions.
//
// PROVENANCE. Every guide names the publisher whose guidance it follows and
// starts as UNREVIEWED. The source link points to the publisher's site, not a
// specific page, because the exact pages could not be checked from here. A
// competent reviewer should compare each guide with the source, correct it,
// and mark it reviewed in Admin > Care guides. The assistant tells users when
// guidance has not been reviewed yet.
import type { CareStageKey } from "../../src/lib/constants";

export type GuideSection = { heading: string; text: string };
export type SeedGuide = {
  slug: string;
  title: string;
  topic: "planting" | "watering" | "feeding" | "troubleshooting" | "pests" | "disease" | "site" | "safety" | "species";
  species: string[]; // tree slugs this guide is specific to; empty means general
  stage: CareStageKey | "";
  symptoms: string[]; // symptom keys used by the troubleshooting flow
  sourceTitle: string;
  sourceUrl: string;
  sections: GuideSection[];
};

const DAE = { sourceTitle: "Department of Agricultural Extension (DAE), Bangladesh: fruit and tree planting guidance", sourceUrl: "https://dae.gov.bd/" };
const BARI = { sourceTitle: "Bangladesh Agricultural Research Institute (BARI): fruit crop production technology", sourceUrl: "https://bari.gov.bd/" };
const UCIPM = { sourceTitle: "University of California Statewide IPM Program: pest notes for home gardens", sourceUrl: "https://ipm.ucanr.edu/" };
const UF = { sourceTitle: "University of Florida IFAS Extension (EDIS): tropical fruit and landscape tree publications", sourceUrl: "https://edis.ifas.ufl.edu/" };
const RHS = { sourceTitle: "Royal Horticultural Society (RHS): planting, watering and plant problems advice", sourceUrl: "https://www.rhs.org.uk/" };
const FAO = { sourceTitle: "Food and Agriculture Organization of the United Nations (FAO): tree planting and agroforestry guidance", sourceUrl: "https://www.fao.org/" };
const BFD = { sourceTitle: "Bangladesh Forest Department: social and coastal afforestation", sourceUrl: "https://bforest.gov.bd/" };

export const GUIDES: SeedGuide[] = [
  {
    slug: "planting-a-sapling",
    title: "Planting a sapling",
    topic: "planting",
    species: [],
    stage: "PLANTING_DAY",
    symptoms: [],
    ...DAE,
    sections: [
      { heading: "Best time to plant", text: "In Bangladesh most trees are planted at the start of the monsoon (June to August), when rain keeps the soil moist while new roots grow. Planting is also possible in the dry season if you can water regularly. Plant in the cool of the evening or on a cloudy day." },
      { heading: "Preparing the pit", text: "Dig a pit about two to three times wider than the root ball; 45 to 60 cm wide and deep suits most fruit and shade trees. Keep the topsoil separate. Mix the topsoil with well-rotted cow dung or compost and leave the pit for 7 to 10 days if you can, so the manure settles. Do not put fresh dung or chemical fertilizer in the pit." },
      { heading: "Setting the plant", text: "Water the sapling an hour before planting. Cut away the polybag carefully so the root ball stays whole. Set the plant so the top of the root ball is level with the ground, not deeper; a grafted plant's graft joint must stay above the soil. Fill in with the mixed soil and press firmly with your hands or feet to remove air pockets." },
      { heading: "After planting", text: "Make a shallow basin around the stem and water slowly until the soil is soaked. Tie the stem loosely to a stake with a soft string in a figure-of-eight loop. Put a fence or tree guard around it if goats or cattle are about." },
    ],
  },
  {
    slug: "first-week-aftercare",
    title: "Caring for a new tree in its first week",
    topic: "planting",
    species: [],
    stage: "FIRST_WEEK",
    symptoms: ["wilting"],
    ...RHS,
    sections: [
      { heading: "Watering", text: "Water every morning or evening unless it has rained. The aim is moist soil around the root ball, not standing water. Push a finger into the soil near the stem: if it is still wet from yesterday, skip watering that day." },
      { heading: "Transplant shock", text: "Leaves may droop or a few may turn yellow and fall in the first days. This is usually transplant shock while roots settle, and it often recovers within one to two weeks if watering is steady. Shade the plant at midday in very hot weather with a palm leaf or shade net." },
      { heading: "What not to do", text: "Do not add fertilizer in the first weeks; tender new roots can be damaged. Do not prune healthy leaves. Do not water heavily to 'help' a drooping plant if the soil is already wet, because waterlogged roots also make leaves droop." },
    ],
  },
  {
    slug: "first-season-care",
    title: "Care during the first season",
    topic: "planting",
    species: [],
    stage: "FIRST_SEASON",
    symptoms: [],
    ...DAE,
    sections: [
      { heading: "Weeds and mulch", text: "Keep a circle about 1 m wide around the stem free of weeds and grass, which compete for water and nutrients. Spread dry leaves, straw or rice husk 5 to 8 cm deep over this circle, keeping it a hand's width away from the stem." },
      { heading: "Watering through the season", text: "In dry weather most young trees need water every two to three days; drought-tolerant trees need less. In the monsoon, rain is usually enough, and the main task is making sure water drains away and does not stand around the stem." },
      { heading: "First feeding", text: "About one to two months after planting, when new leaves appear, a light feed of compost or well-rotted manure spread around the drip line (not touching the stem) is usually enough. Follow the tree's own care plan for amounts." },
    ],
  },
  {
    slug: "ongoing-care",
    title: "Ongoing care for established trees",
    topic: "planting",
    species: [],
    stage: "ONGOING",
    symptoms: [],
    ...UF,
    sections: [
      { heading: "Feeding", text: "Established trees are usually fed once or twice a year, at the start and end of the monsoon. Spread compost or manure around the drip line, the circle under the outer edge of the branches, where most feeding roots are, and water it in. Fruit trees often need more than shade trees." },
      { heading: "Watering", text: "Deep watering once a week in the dry season is better than a little water every day, because it encourages deep roots. Many established trees need no extra water in the monsoon." },
      { heading: "Checking the tree", text: "Walk around the tree every few weeks. Look for dead or crossing branches, damage on the trunk, insects under leaves, and changes in leaf colour. Problems found early are easier to manage." },
    ],
  },
  {
    slug: "watering-basics",
    title: "How much and how often to water",
    topic: "watering",
    species: [],
    stage: "",
    symptoms: ["wilting", "yellow-leaves"],
    ...RHS,
    sections: [
      { heading: "Check before you water", text: "The most reliable test is to push a finger or a stick 5 to 10 cm into the soil near the root ball. If it is dry at that depth, water. If it is moist, wait. Both too little and too much water can make leaves droop or turn yellow." },
      { heading: "Water deeply, not little and often", text: "Water slowly so it soaks down to the roots, rather than a quick splash that only wets the surface. A basin around the stem helps water sink in. Morning or evening watering loses less to evaporation." },
      { heading: "Containers and rooftops", text: "Trees in drums and tubs dry out much faster than trees in the ground, especially on hot rooftops, and may need daily water in summer. The container must have drainage holes so extra water can escape." },
    ],
  },
  {
    slug: "waterlogging-and-drainage",
    title: "Waterlogging and poor drainage",
    topic: "troubleshooting",
    species: [],
    stage: "",
    symptoms: ["yellow-leaves", "wilting", "leaf-drop", "poor-growth"],
    ...UF,
    sections: [
      { heading: "Signs", text: "Water that stands around the stem for hours after rain or watering, soil that smells sour, leaves turning yellow and dropping, and wilting even though the soil is wet are common signs that roots are short of air." },
      { heading: "Why it matters", text: "Roots need air as well as water. In soil that stays saturated, roots can die and root rot can follow. Many trees, for example papaya and most citrus, are sensitive to waterlogging; others such as hijal and koroch tolerate it well." },
      { heading: "What to do", text: "Stop watering until the top soil dries. Dig a shallow channel so rain water flows away from the stem. For new plantings in low ground, plant on a raised mound or bed. In containers, check that drainage holes are open. If the tree keeps declining, ask a local agricultural extension officer to look at the roots." },
    ],
  },
  {
    slug: "yellow-leaves",
    title: "Why leaves turn yellow",
    topic: "troubleshooting",
    species: [],
    stage: "",
    symptoms: ["yellow-leaves"],
    ...RHS,
    sections: [
      { heading: "Symptoms alone are not a diagnosis", text: "Yellow leaves have several possible causes, and the pattern matters. Before deciding, check which leaves are affected (old lower leaves, new top leaves, or all), whether the soil is wet or dry, how often the tree is watered, how much sun it gets, and whether anything changed recently such as transplanting or a long rainy spell." },
      { heading: "Mostly old, lower leaves", text: "If the oldest leaves turn evenly yellow first while new leaves stay green, a shortage of nitrogen is one common possibility, especially in poor or sandy soil or in containers. A feed of compost or well-rotted manure around the drip line often helps. Some old leaves yellowing and falling is also normal." },
      { heading: "New leaves yellow with green veins", text: "When young leaves are pale or yellow but their veins stay green, a shortage of iron, zinc or manganese is possible. This is common in citrus. It can be caused by the soil rather than missing nutrients, for example waterlogged or very alkaline soil. Correcting drainage and adding compost is a low-risk first step; a soil test or extension officer can confirm." },
      { heading: "Yellowing with wet soil or drooping", text: "If the soil stays wet and leaves yellow and droop, too much water or poor drainage is a likely cause. Let the soil dry, improve drainage, and water less often. See the guide on waterlogging." },
      { heading: "Yellowing with spots, sticky leaves or insects", text: "Yellow patches with spots may point to a leaf disease. Yellow, curled leaves with sticky honeydew or black sooty mould often mean sap-sucking insects such as aphids, mealybugs or scale; check under the leaves." },
      { heading: "Newly planted trees", text: "A few yellow leaves in the first weeks after planting are often transplant shock and usually stop once roots settle, if watering is steady." },
    ],
  },
  {
    slug: "wilting-and-drooping",
    title: "Wilting and drooping leaves",
    topic: "troubleshooting",
    species: [],
    stage: "",
    symptoms: ["wilting"],
    ...RHS,
    sections: [
      { heading: "Check the soil first", text: "Wilting has two opposite common causes: too little water and too much water. Check the soil 5 to 10 cm deep. Dry soil suggests the tree needs a slow, deep watering. Wet soil suggests the roots are waterlogged; do not add more water." },
      { heading: "Heat and new plants", text: "Young trees often droop in the hottest part of the day and recover by evening; that is usually heat stress, not a disease. Newly planted trees may droop for a week or two while roots settle." },
      { heading: "When to worry", text: "If a tree stays wilted in the morning when the soil is moist, or the stem near the soil is soft, dark or cracked, roots or the stem base may be damaged by rot, insects or injury. Ask a local agricultural extension officer to inspect it." },
    ],
  },
  {
    slug: "poor-growth",
    title: "A tree that is not growing",
    topic: "troubleshooting",
    species: [],
    stage: "",
    symptoms: ["poor-growth"],
    ...FAO,
    sections: [
      { heading: "Common causes", text: "Slow growth often comes from too little sun, poor or compacted soil, competition from weeds and grass, too small a container, waterlogging, or roots still settling after planting. Some trees, like bel and arjun, are naturally slow." },
      { heading: "What to check", text: "Compare the site with the tree's needs on its Gaach page: sunlight, soil and space. Clear weeds around the stem, add mulch, and feed with compost at the start of the monsoon. A tree in a container may need a bigger one." },
      { heading: "Be patient in the first season", text: "Many trees put energy into roots for the first months and show little top growth. If leaves are healthy and green, slow early growth is not necessarily a problem." },
    ],
  },
  {
    slug: "leaf-spots-and-fungal-disease",
    title: "Leaf spots, mould and fungal disease",
    topic: "disease",
    species: [],
    stage: "",
    symptoms: ["leaf-spots", "yellow-leaves", "leaf-drop"],
    ...UCIPM,
    sections: [
      { heading: "Signs", text: "Brown or black spots on leaves, white powder on leaf surfaces (powdery mildew), dark sunken patches on young leaves, flowers or fruit (for example anthracnose in mango), or black sooty coating that wipes off (sooty mould, which grows on insect honeydew)." },
      { heading: "Low-risk first steps", text: "Remove and destroy badly affected leaves and fallen leaves under the tree. Prune crowded branches so air moves through the canopy. Water the soil, not the leaves, and avoid watering in the evening. For sooty mould, control the sap-sucking insects that cause it." },
      { heading: "If sprays are considered", text: "Fungicides should be chosen for the specific disease and crop, ideally with advice from an agricultural extension officer, and used exactly as the label says. See the guide on using sprays safely. The Gaach assistant does not recommend specific chemical doses." },
    ],
  },
  {
    slug: "sap-sucking-pests",
    title: "Aphids, mealybugs, scale insects and whiteflies",
    topic: "pests",
    species: [],
    stage: "",
    symptoms: ["pests", "sticky-leaves", "curled-leaves", "yellow-leaves"],
    ...UCIPM,
    sections: [
      { heading: "How to recognise them", text: "These small insects feed on sap, usually under leaves and on new shoots. Aphids are tiny soft green or black insects in groups; mealybugs look like white cottony clumps; scale insects are small bumps stuck to stems and leaves; whiteflies fly up in a cloud when the plant is shaken. They leave sticky honeydew, often followed by black sooty mould, and ants may run up and down the stem." },
      { heading: "First steps without chemicals", text: "Spray affected leaves with a strong jet of water to knock insects off. Prune and destroy badly infested shoots. Wipe small infestations off with a cloth. Ladybird beetles and other natural enemies eat these pests, so avoid broad sprays that kill them." },
      { heading: "Mild sprays", text: "Insecticidal soap solution and neem oil sprays are commonly used against soft-bodied insects. They work only on contact, so spray the undersides of leaves, test on a few leaves first, and spray in the cool evening, not in hot sun. Repeat after about a week if needed. Follow the product label." },
    ],
  },
  {
    slug: "leaf-eating-caterpillars-and-leaf-miners",
    title: "Caterpillars, leaf miners and chewed leaves",
    topic: "pests",
    species: [],
    stage: "",
    symptoms: ["pests", "holes-in-leaves", "curled-leaves"],
    ...UCIPM,
    sections: [
      { heading: "Signs", text: "Holes or chewed edges on leaves usually mean caterpillars or beetles. Silvery winding trails inside young leaves, often with curled leaves, are the work of leaf miners; the citrus leaf miner is common on lemon and other citrus." },
      { heading: "What to do", text: "Pick caterpillars off by hand and remove badly damaged shoots. Young trees can lose some leaves without lasting harm. Leaf miners mostly damage new flushes of growth; established trees usually tolerate them. Neem-based sprays on new shoots are a commonly used mild option." },
    ],
  },
  {
    slug: "fruit-drop",
    title: "Flowers or young fruit falling",
    topic: "troubleshooting",
    species: [],
    stage: "",
    symptoms: ["fruit-drop"],
    ...BARI,
    sections: [
      { heading: "Some drop is normal", text: "Fruit trees such as mango and litchi set far more fruit than they can carry and naturally shed many young fruits. Heavy drop is more of a concern." },
      { heading: "Possible causes", text: "Water stress during flowering and fruit growth, sudden weather changes, hot dry winds, pests such as mango hoppers or fruit flies, and diseases such as anthracnose can all increase fruit drop. Young trees in their first years may drop all fruit." },
      { heading: "What helps", text: "Keep watering steady during flowering and fruit growth in the dry season, mulch to keep soil moisture even, collect and destroy fallen infested fruit, and ask a local extension officer about pest control for your crop." },
    ],
  },
  {
    slug: "mango-care",
    title: "Mango: flowering, hoppers and anthracnose",
    topic: "species",
    species: ["mango-himsagar", "mango-amrapali"],
    stage: "",
    symptoms: ["pests", "leaf-spots", "fruit-drop", "sticky-leaves"],
    ...BARI,
    sections: [
      { heading: "Flowering season", text: "Mango flowers in late winter to spring (around January to March in Bangladesh). Mango hoppers, small wedge-shaped insects that jump when disturbed, feed on flower clusters and leave honeydew and sooty mould; heavy attacks can cause flowers and young fruit to drop." },
      { heading: "Anthracnose", text: "Anthracnose causes dark spots on young leaves, blackened flower clusters and dark sunken spots on fruit, and is worse in humid, rainy weather. Pruning to open the canopy and removing infected parts and fallen leaves reduces it." },
      { heading: "Young trees", text: "Many growers remove flowers from very young grafted trees in their first one to two years so the tree puts energy into growing. Water young mango trees in the dry season, but avoid waterlogging." },
    ],
  },
  {
    slug: "citrus-care",
    title: "Lemon and other citrus",
    topic: "species",
    species: ["lemon"],
    stage: "",
    symptoms: ["yellow-leaves", "curled-leaves", "pests", "leaf-spots"],
    ...UF,
    sections: [
      { heading: "Drainage", text: "Citrus roots are sensitive to waterlogging. Plant on slightly raised ground and make sure rain water drains away. In containers, use a drum with drainage holes." },
      { heading: "Yellow leaves in citrus", text: "Yellow new leaves with green veins are common in citrus and often relate to micronutrients (iron, zinc, manganese) or to wet or alkaline soil limiting uptake. Even yellowing of older leaves can point to low nitrogen. Check drainage and watering first; compost helps, and an extension officer or soil test can confirm a nutrient problem." },
      { heading: "Leaf miners and canker", text: "Curled new leaves with silvery trails are usually citrus leaf miner. Raised corky spots with yellow halos on leaves, twigs or fruit may be citrus canker, a bacterial disease; remove affected twigs, avoid working on wet trees, and ask an extension officer for advice." },
    ],
  },
  {
    slug: "papaya-care",
    title: "Papaya care",
    topic: "species",
    species: ["papaya"],
    stage: "",
    symptoms: ["wilting", "yellow-leaves", "leaf-drop"],
    ...BARI,
    sections: [
      { heading: "Very sensitive to standing water", text: "Papaya roots rot quickly in waterlogged soil, often killing the plant within days of standing water. Plant on a raised mound in well-drained soil and never let water collect at the base." },
      { heading: "Feeding and growth", text: "Papaya grows fast and fruits within about a year, so it benefits from regular compost or manure. It does best in full sun and shelter from strong wind." },
      { heading: "Virus symptoms", text: "Mottled, crinkled or distorted leaves can be signs of a virus spread by aphids. There is no cure for an infected plant; removing it early helps protect other plants nearby. Confirm with an extension officer." },
    ],
  },
  {
    slug: "palm-care",
    title: "Coconut, date and other palms",
    topic: "species",
    species: ["coconut", "date-palm", "palmyra", "areca-palm"],
    stage: "",
    symptoms: ["yellow-leaves", "poor-growth"],
    ...UF,
    sections: [
      { heading: "Planting depth", text: "Palms should be planted so the base of the stem sits at soil level. Planting too deep is a common cause of slow decline." },
      { heading: "Yellow fronds", text: "The oldest, lowest fronds of a palm naturally yellow and die. Yellowing of many fronds can relate to nutrient shortages such as potassium or magnesium, or to poor drainage. Do not cut green fronds, as the palm moves nutrients from older fronds to new ones." },
      { heading: "Salt and coastal sites", text: "Coconut and palmyra tolerate coastal conditions and salty wind well, which makes them common choices in the south of Bangladesh." },
    ],
  },
  {
    slug: "fertilizing-and-compost",
    title: "Feeding trees with compost and manure",
    topic: "feeding",
    species: [],
    stage: "",
    symptoms: ["poor-growth", "yellow-leaves"],
    ...DAE,
    sections: [
      { heading: "Organic matter first", text: "Well-rotted cow dung, compost and vermicompost improve soil structure and supply nutrients slowly, and are hard to overdo. They are the safest feed for home trees." },
      { heading: "Where and when", text: "Spread feed in a ring under the outer edge of the branches (the drip line), not against the stem, then mix it lightly into the top soil and water it in. The usual times are the start of the monsoon and after it ends." },
      { heading: "Chemical fertilizers", text: "Chemical fertilizers such as urea, TSP and MoP can help when a real shortage exists, but too much can burn roots, and needs vary by tree, age and soil. Follow the tree's care plan on Gaach or local extension advice for amounts. Never put chemical fertilizer in the planting pit or against the stem." },
    ],
  },
  {
    slug: "mulching",
    title: "Mulching around trees",
    topic: "planting",
    species: [],
    stage: "",
    symptoms: ["wilting", "poor-growth"],
    ...RHS,
    sections: [
      { heading: "Why mulch", text: "A layer of mulch keeps soil cooler and moist for longer, reduces weeds, and slowly adds organic matter. It is one of the simplest ways to help young trees through dry weather." },
      { heading: "How to mulch", text: "Use dry leaves, straw, rice husk or wood chips, 5 to 8 cm deep, in a circle around the tree. Leave a gap of about a hand's width around the stem so the bark stays dry and does not rot." },
    ],
  },
  {
    slug: "pruning-and-training",
    title: "Pruning and shaping young trees",
    topic: "planting",
    species: [],
    stage: "ONGOING",
    symptoms: [],
    ...UF,
    sections: [
      { heading: "What to remove", text: "Remove dead, diseased or broken branches at any time. Remove branches that cross and rub, and shoots growing from below the graft joint on grafted trees, because they come from the rootstock." },
      { heading: "How to cut", text: "Use clean, sharp tools. Cut just outside the branch collar, the slightly swollen ring where a branch joins the trunk, rather than flush against the trunk, and do not leave long stubs." },
      { heading: "How much", text: "Avoid removing more than about a quarter of the leaves in one year. For fruit trees, light pruning after harvest is common. For large trees or branches near power lines, get professional help." },
    ],
  },
  {
    slug: "rooftop-and-container-trees",
    title: "Growing trees in drums on rooftops",
    topic: "site",
    species: [],
    stage: "",
    symptoms: ["wilting", "poor-growth"],
    ...DAE,
    sections: [
      { heading: "Choosing the container", text: "Use a half drum or large tub of at least 40 to 100 litres for small fruit trees such as lemon, guava or dwarf mango varieties, with several drainage holes in the bottom. Raise it on bricks so water can drain and the roof stays dry." },
      { heading: "Soil mix", text: "A common mix is roughly equal parts garden soil and well-rotted compost or cow dung, with some sand or brick chips at the bottom for drainage. Avoid heavy clay alone." },
      { heading: "Care on a roof", text: "Rooftop containers heat up and dry fast, so water daily in summer and mulch the top. Feed little and often, since nutrients wash out. Check with a building engineer before placing many heavy drums on a roof." },
    ],
  },
  {
    slug: "coastal-and-saline-sites",
    title: "Trees for salty, coastal soil",
    topic: "site",
    species: [],
    stage: "",
    symptoms: [],
    ...BFD,
    sections: [
      { heading: "The challenge", text: "In coastal districts, salty soil and water damage the roots of many trees, causing leaf burn at the edges and poor growth. Salinity is often worse in the dry season." },
      { heading: "Better choices", text: "Trees with high salt tolerance, such as keora, coconut, palmyra and koroch, are used in coastal planting. Gaach's recommendation engine removes trees with low salt tolerance for districts marked as salty." },
      { heading: "Helping a tree cope", text: "Plant on raised mounds at the start of the monsoon, when rain washes salt down, add plenty of organic matter, and mulch to reduce evaporation, which draws salt up." },
    ],
  },
  {
    slug: "flood-prone-sites",
    title: "Trees for flood-prone land",
    topic: "site",
    species: [],
    stage: "",
    symptoms: [],
    ...FAO,
    sections: [
      { heading: "Choosing trees", text: "Only some trees survive standing water for weeks. Hijal, koroch, arjun and bamboo are used on low, flood-prone land and pond banks. Gaach removes trees with low flood tolerance for flood-prone regions." },
      { heading: "Planting", text: "Plant at the start of the monsoon on the highest available ground, embankments or raised mounds, so roots establish before water rises. Young trees need staking against moving water." },
    ],
  },
  {
    slug: "dry-season-and-drought",
    title: "Helping trees through the dry season",
    topic: "site",
    species: [],
    stage: "",
    symptoms: ["wilting", "leaf-drop"],
    ...FAO,
    sections: [
      { heading: "Water wisely", text: "In the dry months (roughly November to April), young trees need regular deep watering. Water early in the morning or in the evening, and fill the basin around the stem so water soaks in." },
      { heading: "Keep moisture in", text: "Mulch thickly, keep weeds away, and shade very young saplings from the afternoon sun. Drought-tolerant trees such as neem, palmyra, bel and amloki cope better in dry regions." },
    ],
  },
  {
    slug: "storm-and-monsoon-protection",
    title: "Protecting young trees from wind and heavy rain",
    topic: "site",
    species: [],
    stage: "",
    symptoms: [],
    ...DAE,
    sections: [
      { heading: "Staking", text: "Tie young trees to a strong bamboo stake with soft string or cloth in a loose figure-of-eight loop, so the stem can move a little but not snap. Check ties every few months so they do not cut into the growing bark." },
      { heading: "Before storms", text: "Remove dead or weak branches before the cyclone and monsoon season. After a storm, straighten leaning young trees gently, firm the soil around the roots, and remove broken branches with clean cuts." },
    ],
  },
  {
    slug: "protecting-saplings-from-animals",
    title: "Protecting saplings from goats, cattle and other damage",
    topic: "site",
    species: [],
    stage: "",
    symptoms: ["holes-in-leaves"],
    ...BFD,
    sections: [
      { heading: "Tree guards", text: "Goats and cattle can strip a sapling in minutes. A guard of bamboo slats, wire mesh or brick around the young tree, about 1 to 1.5 m high, protects it for its first few years." },
      { heading: "Termites and the stem base", text: "Termites can attack the stem base and roots of young trees in dry soil. Keep the base clear of dead wood and debris, and ask an extension officer if you see mud tunnels on the stem." },
    ],
  },
  {
    slug: "using-sprays-safely",
    title: "Using sprays safely",
    topic: "safety",
    species: [],
    stage: "",
    symptoms: ["pests", "leaf-spots"],
    ...UCIPM,
    sections: [
      { heading: "Try the mildest option first", text: "Start with non-chemical steps: removing affected parts, washing pests off with water, and encouraging natural enemies. If a spray is needed, soap solutions and neem oil are milder than synthetic pesticides." },
      { heading: "If you use any spray", text: "Choose a product registered for that crop and pest, and follow the label exactly for dose, timing and the waiting period before eating fruit. Wear gloves, long sleeves and a mask. Spray in calm, cool weather. Keep children, animals, ponds and food away, and wash hands afterwards. Never mix products unless the label says so." },
      { heading: "Where to get advice", text: "For anything beyond mild sprays, ask your local Upazila agriculture office or Department of Agricultural Extension officer. The Gaach assistant does not give chemical doses." },
    ],
  },
  {
    slug: "choosing-the-right-tree",
    title: "Choosing the right tree for your space",
    topic: "planting",
    species: [],
    stage: "",
    symptoms: [],
    ...FAO,
    sections: [
      { heading: "Space", text: "Check the canopy spread a tree reaches when mature, not its size as a sapling. A tree planted too close to a building or wall will need heavy pruning or may damage the structure. Gaach removes trees that are wider than the space you enter." },
      { heading: "Sun and soil", text: "Most fruit trees need full sun (six hours or more) to fruit well. A few trees and shrubs tolerate partial shade. Match the soil too: clay holds water, sand drains fast, loam suits most trees." },
      { heading: "Local conditions", text: "Rainfall, flooding, dry spells and salty soil differ across Bangladesh. Gaach maps each district to a regional profile and removes trees that cannot survive it. Conditions on a particular plot can still differ from the district profile, for example a raised yard in a flood-prone district." },
    ],
  },
];
