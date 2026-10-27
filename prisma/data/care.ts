// Staged care templates (FR-6.2). Each tree gets four stages; the text is
// filled with the tree's own name, fertilizer and caution notes.
import type { CareKind, SeedTree } from "./trees";

type Stage = { planting: string; watering: string; fertilizing: string; protection: string };

const PIT: Record<CareKind, string> = {
  fruit: "Dig a pit about 60 cm wide and 60 cm deep. Mix the topsoil with 10 kg of rotted cow dung or compost and leave it 7 to 10 days before planting.",
  palm: "Dig a pit about 75 cm wide and deep. Fill with topsoil mixed with compost, and plant so the base of the stem sits at soil level, not buried.",
  ornamental: "Dig a pit about 50 cm wide and deep and mix the soil with 5 kg of compost.",
  timber: "Dig a pit about 45 cm wide and deep. Mix in 3 to 5 kg of compost. Space timber trees 3 to 4 m apart.",
  shrub: "Dig a hole about 30 cm wide and deep, or use a drum or tub of at least 40 litres with drainage holes. Mix soil with a third compost.",
  wetland: "Plant at the start of the monsoon on low ground, pond banks or embankments. A 30 cm pit with a little compost is enough.",
  bamboo: "Dig a pit about 60 cm wide and deep and fill it with soil and cow dung. Lay the rhizome with the bud facing up, 15 cm below the surface.",
};

export function careStagesFor(t: SeedTree): Record<string, Stage> {
  const n = t.name.split(" (")[0];
  const dryish = t.droughtTolerance === "HIGH";
  const thirsty = t.waterNeed === "HIGH";
  return {
    PLANTING_DAY: {
      planting: `${PIT[t.care]} Plant ${n} in the cool of the evening. Remove the polybag carefully without breaking the root ball, set it in the pit, press the soil firmly and make a shallow basin around the stem.`,
      watering: "Water slowly until the soil is soaked right down to the roots.",
      fertilizing: "Do not add chemical fertilizer on planting day; the compost in the pit is enough.",
      protection: `Tie the stem loosely to a bamboo stake. Put a bamboo or net fence around it to keep goats and cattle away.${t.cautions && t.cautions !== "None significant." ? " Note: " + t.cautions : ""}`,
    },
    FIRST_WEEK: {
      planting: "Check that the plant is still upright after rain or wind and re-tie the stake if needed. Leaves may droop for a few days; that is normal.",
      watering: thirsty
        ? "Water every day unless it rains. Keep the soil moist but do not let water stand around the stem."
        : "Water every day in the morning or evening unless it rains. Stop if the soil is still wet from the day before.",
      fertilizing: "No fertilizer yet. New roots are tender and can burn.",
      protection: "Shade the plant at midday with a palm leaf or net if the weather is very hot. Watch for ants and cutworms at the base.",
    },
    FIRST_SEASON: {
      planting: "Pull weeds in a circle about 1 m wide around the stem. Spread dry leaves or straw as mulch to keep the soil cool and moist.",
      watering: dryish
        ? "Water twice a week in dry weather. In the monsoon, rainfall is usually enough."
        : "Water every 2 to 3 days in dry weather. In the monsoon, make sure rain water drains away.",
      fertilizing: `After 4 to 6 weeks, start feeding: ${t.fertilizer.charAt(0).toLowerCase() + t.fertilizer.slice(1)}. Spread it in a ring 20 cm away from the stem and water it in.`,
      protection: "Check leaves weekly for insects, leaf curl or spots. For soft insects, spray a neem oil solution diluted as the bottle says, testing it on a few leaves first. Keep the fence in place.",
    },
    ONGOING: {
      planting: t.care === "fruit"
        ? "Prune dead, crossing and crowded branches after harvest to keep the tree open to light."
        : t.care === "timber"
          ? "Remove low side branches gradually to grow a straight trunk."
          : t.care === "bamboo"
            ? "Harvest culms that are 3 years or older and keep the clump thinned."
            : "Trim lightly after flowering to keep a good shape.",
      watering: dryish
        ? "Once established it rarely needs watering except in long dry spells."
        : "Water deeply every week or two in the dry season (November to April).",
      fertilizing: `${t.fertilizer}.`,
      protection: `${t.cautions && t.cautions !== "None significant." ? t.cautions + " " : ""}If leaves yellow or the tree looks weak, use the assistant on this page to describe the problem.`,
    },
  };
}
