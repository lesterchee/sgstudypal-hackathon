// Purpose: Firebase Storage ingestion utility — uploads a question image
// to Firebase Storage and creates a corresponding Firestore document in
// the user's questionQueue subcollection with status 'pending'.

import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirestore, collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import type { QueueItemStatus } from '@/lib/ai/vision-bouncer-types';

// Purpose: Lazy-initialize Storage and Firestore to avoid SSR issues in Next.js.
const storage = getStorage(app);
const db = getFirestore(app);

// Purpose: Upload a question image to Firebase Storage and sync a pending
// document to Firestore. Returns the generated docId for downstream processing
// (e.g., Vision Bouncer pipeline).
export async function uploadQuestionToQueue(
    file: File,
    uid: string
): Promise<string> {
    // Purpose: Generate a unique document ID for this queue item.
    const docRef = doc(collection(db, `users/${uid}/questionQueue`));
    const docId = docRef.id;

    // Purpose: Construct the storage path for deterministic file retrieval.
    const storagePath = `questionQueue/${uid}/${docId}/${file.name}`;
    const storageRef = ref(storage, storagePath);

    // Purpose: Upload the raw file to Firebase Storage.
    await uploadBytes(storageRef, file);

    // Purpose: Retrieve the public download URL for thumbnail rendering.
    const downloadUrl = await getDownloadURL(storageRef);

    // Purpose: Write the initial queue item document with 'pending' status.
    // The Vision Bouncer will later mutate this to 'rejected' or 'processing'.
    const queueItem: {
        fileName: string;
        storagePath: string;
        thumbnailUrl: string;
        status: QueueItemStatus;
        uploadedAt: ReturnType<typeof serverTimestamp>;
    } = {
        fileName: file.name,
        storagePath,
        thumbnailUrl: downloadUrl,
        status: 'pending',
        uploadedAt: serverTimestamp(),
    };

    await setDoc(docRef, queueItem);

    return docId;
}
