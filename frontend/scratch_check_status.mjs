import { initializeApp } from './node_modules/firebase/app/dist/index.mjs';
import { getDatabase, ref, get } from './node_modules/firebase/database/dist/index.mjs';
import { getAuth, signInWithEmailAndPassword } from './node_modules/firebase/auth/dist/index.mjs';

const firebaseConfig = {
  apiKey: 'AIzaSyBs7OqbOeIIcldEkaJQTCKw_zBF-Sa7Au0',
  authDomain: 'fabric-care-1f384.firebaseapp.com',
  projectId: 'fabric-care-1f384',
  databaseURL: 'https://fabric-care-1f384-default-rtdb.firebaseio.com/',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

async function main() {
  await signInWithEmailAndPassword(auth, 'admin@fabricare.com', 'Test@1234');
  const ordersSnap = await get(ref(db, 'orders'));
  const tasksSnap = await get(ref(db, 'tasks'));
  const orders = ordersSnap.val() || {};
  const tasks = tasksSnap.val() || {};
  for (const [k, v] of Object.entries(orders)) {
    if (v.code === 'FC-54462' || v.order_number === 'FC-54462') {
      console.log('ORDER in RTDB:', k, {
        status: v.status,
        raw_status: v.raw_status,
        stage: v.stage,
        tracker_stage: v.tracker_stage,
        startedAt: v.startedAt,
        arrivedAt: v.arrivedAt,
        collectedAt: v.collectedAt
      });
    }
  }
  for (const [k, v] of Object.entries(tasks)) {
    if (v.orderCode === 'FC-54462' || v.order_number === 'FC-54462' || v.orderId === '-P4Z8VhmiZBNFcAjknlc') {
      console.log('TASK in RTDB:', k, {
        status: v.status,
        tracker_stage: v.tracker_stage,
        startedAt: v.startedAt,
        arrivedAt: v.arrivedAt,
        collectedAt: v.collectedAt
      });
    }
  }
  process.exit(0);
}
main();
