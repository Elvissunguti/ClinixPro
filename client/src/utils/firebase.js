import { initializeApp } from 'firebase/app'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'

const firebaseConfig = {
    apiKey: "AIzaSyBoPRsp418pKlYwxYgBldhDNycoUqMVd8c",
    authDomain: "clinic-admin-80aa4.firebaseapp.com",
    projectId: "clinic-admin-80aa4",
    storageBucket: "clinic-admin-80aa4.firebasestorage.app",
    messagingSenderId: "898698767518",
    appId: "1:898698767518:web:c3baec836bc3b06e095f8f",
    measurementId: "G-Q4SPW1QQZG"
  };
  

const app = initializeApp(firebaseConfig)
const storage = getStorage(app)

// Uploads a file to Firebase Storage and returns its public download URL
export async function uploadImage(file, folder = 'users') {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const fileRef = ref(storage, `${folder}/${Date.now()}-${safeName}`)
    await uploadBytes(fileRef, file, { contentType: file.type })
    return await getDownloadURL(fileRef)
}




