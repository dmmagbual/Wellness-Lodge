import { collection, getDocs, getDoc, doc, query, where, orderBy } from "firebase/firestore";
import { db } from "./firebase";
import type {
  RoomCategory,
  RatePeriod,
  CarRentalVehicle,
  FunctionHallPackage,
  MenuItem,
  PastEvent,
  LodgeSettings,
} from "@wellness-lodge/shared";

export async function fetchRoomCategories(): Promise<RoomCategory[]> {
  const snap = await getDocs(query(collection(db, "roomCategories"), where("active", "==", true)));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as RoomCategory)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function fetchRatePeriods(categoryId: string): Promise<RatePeriod[]> {
  const snap = await getDocs(
    query(collection(db, "ratePeriods"), where("categoryId", "==", categoryId), where("active", "==", true))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as RatePeriod);
}

export async function fetchCarRentalFleet(): Promise<CarRentalVehicle[]> {
  const snap = await getDocs(query(collection(db, "carRentalVehicles"), where("active", "==", true)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CarRentalVehicle);
}

export async function fetchFunctionHallPackages(): Promise<FunctionHallPackage[]> {
  const snap = await getDocs(query(collection(db, "functionHallPackages"), where("active", "==", true)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as FunctionHallPackage);
}

export async function fetchMenu(): Promise<MenuItem[]> {
  const snap = await getDocs(query(collection(db, "menuItems"), where("active", "==", true)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as MenuItem);
}

export async function fetchPastEvents(): Promise<PastEvent[]> {
  const snap = await getDocs(
    query(collection(db, "pastEvents"), where("approved", "==", true), orderBy("sortOrder", "asc"))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PastEvent);
}

export async function fetchSettings(): Promise<LodgeSettings | null> {
  const snap = await getDoc(doc(db, "settings", "public"));
  if (!snap.exists()) return null;
  return snap.data() as LodgeSettings;
}
