import { getDatabase } from "../src/lib/db";

async function main() {
  console.log("Starting CivicSignal AI database seeding...");
  const db = getDatabase();

  try {
    await db.resetToDemo();
    const depts = await db.getDepartments();
    const complaints = await db.getComplaints();
    const analyses = await db.getAnalyses();

    console.log("Seeding complete!");
    console.log(`- Loaded ${depts.length} departments`);
    console.log(`- Loaded ${complaints.length} complaints`);
    console.log(`- Loaded ${analyses.length} precomputed analyses`);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
}

main();
