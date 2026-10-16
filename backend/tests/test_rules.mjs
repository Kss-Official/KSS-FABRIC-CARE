import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  connectFirestoreEmulator, 
  collection, 
  doc, 
  getDoc, 
  setDoc 
} from 'firebase/firestore';
import { 
  getAuth, 
  connectAuthEmulator, 
  signInWithEmailAndPassword 
} from 'firebase/auth';

const app = initializeApp({
  projectId: 'fabricare-demo',
  apiKey: 'demo-api-key'
});

const auth = getAuth(app);
connectAuthEmulator(auth, 'http://127.0.0.1:9099');

const db = getFirestore(app);
connectFirestoreEmulator(db, '127.0.0.1', 8080);

async function runRulesTest() {
  console.log('--- Testing Firestore Security Rules ---');

  // Test 1: Anonymous / Unauthenticated write should fail
  try {
    await setDoc(doc(db, 'orders', 'unauth_order'), { dummy: true });
    console.error('FAIL: Unauthenticated write succeeded!');
    process.exit(1);
  } catch (err) {
    console.log('PASS: Client write denied as expected:', err.code);
  }

  // Sign in as customer
  const custCred = await signInWithEmailAndPassword(auth, 'customer@fabricare.test', 'Test@1234');
  const custUid = custCred.user.uid;
  console.log('Signed in as customer:', custUid);

  // Test 2: Authenticated customer write must be denied (client never writes)
  try {
    await setDoc(doc(db, 'orders', 'cust_order'), { customer_id: custUid, dummy: true });
    console.error('FAIL: Client write by authenticated customer succeeded!');
    process.exit(1);
  } catch (err) {
    console.log('PASS: Authenticated client write denied as expected:', err.code);
  }

  // Test 3: Customer reading someone else's notification
  try {
    const notifDoc = await getDoc(doc(db, 'notifications', 'other_user_notif'));
    if (notifDoc.exists() && notifDoc.data().user_id !== custUid) {
      console.error('FAIL: Read other user notification!');
      process.exit(1);
    }
    console.log('PASS: Other user notification inaccessible / not found');
  } catch (err) {
    console.log('PASS: Other user notification read denied:', err.code);
  }

  console.log('--- ALL FIRESTORE RULES TESTS PASSED ---');
  process.exit(0);
}

runRulesTest().catch(err => {
  console.error('Error during rules test:', err);
  process.exit(1);
});
