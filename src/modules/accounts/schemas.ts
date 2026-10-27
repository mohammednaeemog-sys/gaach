import { z } from "zod";
import { PURPOSES, SOILS, SUNLIGHT } from "@/lib/constants";

const blank = (v: unknown) => (v === "" || v === null ? undefined : v);

export const siteSchema = z.object({
  districtId: z.preprocess(blank, z.coerce.number({ message: "Choose a district." }).int().positive("Choose a district.")),
  spaceM: z.preprocess(
    blank,
    z.coerce
      .number({ message: "Enter the space in metres, for example 3." })
      .min(0.5, "Space must be at least 0.5 m.")
      .max(100, "Enter a space under 100 m."),
  ),
  sunlight: z.enum(SUNLIGHT, { message: "Choose how much sun the spot gets." }),
  soil: z.enum(SOILS, { message: "Choose a soil type." }),
  purpose: z.enum(PURPOSES, { message: "Choose what the tree is for." }),
});
