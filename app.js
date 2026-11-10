import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 1. REPLACE THIS WITH YOUR FIREBASE CONFIG FROM STEP 2
const firebaseConfig = {
  apiKey: "AIzaSyA0C8dIx0plY4UHOO5K4K0LOO_ZApnnkkA",
  authDomain: "mom-s-fridge-508ae.firebaseapp.com",
  projectId: "mom-s-fridge-508ae",
  storageBucket: "mom-s-fridge-508ae.firebasestorage.app",
  messagingSenderId: "872039324844",
  appId: "1:872039324844:web:6ae4dafcc7619756b29309",
  measurementId: "G-CWG0XXRG26"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// HTML Elements
const loginScreen = document.getElementById('login-screen');
const mainApp = document.getElementById('main-app');
const greeting = document.getElementById('greeting');
const momControls = document.getElementById('mom-controls');
const momPollControls = document.getElementById('mom-poll-controls');
const fridgeList = document.getElementById('fridge-list');

// Log in
document.getElementById('login-btn').addEventListener('click', () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider);
});

// Log out
document.getElementById('logout-btn').addEventListener('click', () => {
    signOut(auth);
});

// Check who is logged in
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in
        loginScreen.style.display = 'none';
        mainApp.style.display = 'block';
        greeting.innerText = `Hello, ${user.displayName}!`;

        // IMPORTANT: Put your mom's exact Google email here
        const MOMS_EMAIL = "yourmom@gmail.com"; 

        if (user.email === MOMS_EMAIL) {
            // Unhide Mom's special buttons
            momControls.style.display = 'block';
            momPollControls.style.display = 'block';
        } else {
            // Hide them for siblings
            momControls.style.display = 'none';
            momPollControls.style.display = 'none';
        }

        // Listen for fridge items from the database in real-time
        onSnapshot(collection(db, "fridge"), (snapshot) => {
            fridgeList.innerHTML = ''; // clear the old list
            snapshot.forEach((doc) => {
                const li = document.createElement('li');
                li.innerText = doc.data().name;
                fridgeList.appendChild(li);
            });
        });

    } else {
        // Nobody is signed in
        loginScreen.style.display = 'block';
        mainApp.style.display = 'none';
    }
});

// Add Item to Fridge (Mom only)
document.getElementById('add-item-btn').addEventListener('click', async () => {
    const itemInput = document.getElementById('new-item');
    if (itemInput.value !== "") {
        await addDoc(collection(db, "fridge"), {
            name: itemInput.value
        });
        itemInput.value = ""; // clear the box
    }
});
// 1. Submit a dinner suggestion
document.getElementById('submit-note-btn').addEventListener('click', async () => {
    const noteInput = document.getElementById('dinner-note');
    const user = auth.currentUser;
    
    if (noteInput.value !== "" && user) {
        await addDoc(collection(db, "suggestions"), {
            text: noteInput.value,
            author: user.displayName
        });
        noteInput.value = ""; // clear the box after sending
    }
});

// 2. Listen for suggestions and show them to everyone
onSnapshot(collection(db, "suggestions"), (snapshot) => {
    const allNotesDiv = document.getElementById('all-notes');
    allNotesDiv.innerHTML = ''; // clear the old list
    
    snapshot.forEach((doc) => {
        const data = doc.data();
        const noteElement = document.createElement('p');
        // This makes it look like: "moath: maftool"
        noteElement.innerHTML = `<strong style="color: #f4a261;">${data.author}:</strong> ${data.text}`;
        allNotesDiv.appendChild(noteElement);
    });
});
