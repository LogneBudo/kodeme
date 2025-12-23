import { db } from "./firebase";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";

async function clearFirestore() {
  console.log("🗑️  Clearing Firestore database...");

  // Delete all time_slots
  const slotsSnapshot = await getDocs(collection(db, "time_slots"));
  console.log(`Deleting ${slotsSnapshot.size} time slots...`);
  await Promise.all(
    slotsSnapshot.docs.map((document) => deleteDoc(doc(db, "time_slots", document.id)))
  );

  // Delete all appointments
  const aptsSnapshot = await getDocs(collection(db, "appointments"));
  console.log(`Deleting ${aptsSnapshot.size} appointments...`);
  await Promise.all(
    aptsSnapshot.docs.map((document) => deleteDoc(doc(db, "appointments", document.id)))
  );

  console.log("✅ Database cleared successfully!");
}

clearFirestore()
  .then(() => {
    console.log("Script complete. You can now stop the process.");
    if (typeof process !== 'undefined') process.exit(0);
  })
  .catch((error) => {
    console.error("Error clearing database:", error);
    if (typeof process !== 'undefined') process.exit(1);
  });
