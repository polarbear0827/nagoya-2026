import { APP_CONFIG } from "./config.js";

let app;
let auth;
let db;
let firestoreApi;
let unsubscribeExpenses;

export async function initFirebase({ onStatus, onExpenses }) {
  onStatus("pending", "連線 Firebase");

  try {
    const [
      appMod,
      authMod,
      firestoreMod
    ] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js"),
      import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js")
    ]);

    firestoreApi = firestoreMod;
    app = appMod.initializeApp(APP_CONFIG.firebase);
    auth = authMod.getAuth(app);
    db = firestoreMod.getFirestore(app);

    try {
      await firestoreMod.enableIndexedDbPersistence(db);
    } catch {
      // Multiple tabs or browser limitations can disable persistence. The app still works.
    }

    await authMod.signInAnonymously(auth);

    const expensesRef = getExpensesCollection();
    unsubscribeExpenses = firestoreMod.onSnapshot(
      expensesRef,
      (snapshot) => {
        const expenses = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data()
        }));
        onExpenses(expenses);
        onStatus(navigator.onLine ? "synced" : "offline", navigator.onLine ? "已同步" : "離線，使用快取");
      },
      (error) => {
        console.error(error);
        onStatus("error", "同步失敗");
      }
    );

    onStatus("synced", "已同步");
    return true;
  } catch (error) {
    console.error(error);
    onStatus("error", "Firebase 未連線");
    return false;
  }
}

export async function saveExpenseToCloud(expense) {
  if (!db || !firestoreApi) throw new Error("Firebase not initialized");
  const ref = firestoreApi.doc(getExpensesCollection(), expense.id);
  await firestoreApi.setDoc(ref, {
    ...expense,
    updatedAt: Date.now()
  }, { merge: true });
}

export async function deleteExpenseFromCloud(id) {
  if (!db || !firestoreApi) throw new Error("Firebase not initialized");
  await firestoreApi.deleteDoc(firestoreApi.doc(getExpensesCollection(), id));
}

export function disposeFirebase() {
  if (unsubscribeExpenses) unsubscribeExpenses();
}

function getExpensesCollection() {
  return firestoreApi.collection(db, "trips", APP_CONFIG.tripId, "expenses");
}
