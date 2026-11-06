import { TreeForm } from "@/components/admin/TreeForm";

export const metadata = { title: "New tree" };

export default function NewTree() {
  return (
    <div className="card p-5">
      <h1 className="page-title mb-4">New tree</h1>
      <TreeForm
        t={{
          name: "", slug: "", banglaName: "", scientificName: "", description: "", shape: "round", color: "#2e7d32",
          matureHeightM: 0, canopySpreadM: 0, growthRate: "", sunlight: "", soils: "", purposes: "", waterNeed: "",
          rainfall: "", floodTolerance: "", droughtTolerance: "", salinityTolerance: "", fruitingSeason: "", plantMonths: "", cautions: "",
          published: false, imageUrl: null, imageCredit: "", imageSourceUrl: "",
        }}
      />
    </div>
  );
}
