import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, doc, setDoc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
const roleSelection = document.getElementById('role-selection');
const passwordSection = document.getElementById('password-section');
const momPasswordInput = document.getElementById('mom-password');
const passwordError = document.getElementById('password-error');
// Log in
document.getElementById('sibling-login-btn').addEventListener('click', () => {
    localStorage.setItem('isMom', 'false');
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider);
});

document.getElementById('mom-login-btn').addEventListener('click', () => {
    roleSelection.style.display = 'none';
    passwordSection.style.display = 'block';
});

document.getElementById('verify-password-btn').addEventListener('click', () => {
    if (momPasswordInput.value === "MOATH278") {
        localStorage.setItem('isMom', 'true');
        passwordError.style.display = 'none';
        const provider = new GoogleAuthProvider();
        signInWithPopup(auth, provider);
    } else {
        passwordError.style.display = 'block';
    }
});

// Log out
document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('isMom'); // This line clears the flag!
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
       const isMom = localStorage.getItem('isMom') === 'true';
if (isMom) {
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
// --- POLL LOGIC ---

// 1. Mom creates the poll
document.getElementById('create-poll-btn').addEventListener('click', async () => {
    const opt1 = document.getElementById('poll-option-1').value;
    const opt2 = document.getElementById('poll-option-2').value;

    if (opt1 !== "" && opt2 !== "") {
        // We use a specific document ID called "current" so it always overwrites yesterday's poll
        await setDoc(doc(db, "polls", "current"), {
            option1: { name: opt1, votes: 0 },
            option2: { name: opt2, votes: 0 },
            voters: [] // An empty list to track who has voted today
        });
        // Clear the boxes after sending
        document.getElementById('poll-option-1').value = "";
        document.getElementById('poll-option-2').value = "";
    }
});

// 2. Everyone sees the poll and can vote
onSnapshot(doc(db, "polls", "current"), (docSnapshot) => {
    const activePollDiv = document.getElementById('active-poll');
    
    if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        const user = auth.currentUser;
        
        // Check if the currently logged-in user is already in the voters list
        const hasVoted = user && data.voters.includes(user.uid);

        // Draw the poll on the screen
        activePollDiv.innerHTML = `
            <div style="margin-bottom: 15px; background-color: #4a3b32; padding: 10px; border-radius: 5px;">
                <strong>${data.option1.name}</strong>: ${data.option1.votes} votes
                ${!hasVoted ? `<button id="vote-opt1" style="margin-left: 10px;">Vote</button>` : ''}
            </div>
            <div style="background-color: #4a3b32; padding: 10px; border-radius: 5px;">
                <strong>${data.option2.name}</strong>: ${data.option2.votes} votes
                ${!hasVoted ? `<button id="vote-opt2" style="margin-left: 10px;">Vote</button>` : ''}
            </div>
            ${hasVoted ? `<p style="color: #8ab17d; margin-top: 10px;">Thanks for voting!</p>` : ''}
        `;

        // If they haven't voted, make the vote buttons actually add a point
        if (!hasVoted && user) {
            document.getElementById('vote-opt1').addEventListener('click', async () => {
                await updateDoc(doc(db, "polls", "current"), {
                    "option1.votes": data.option1.votes + 1,
                    voters: arrayUnion(user.uid) // Adds them to the list so they can't vote again
                });
            });

            document.getElementById('vote-opt2').addEventListener('click', async () => {
                await updateDoc(doc(db, "polls", "current"), {
                    "option2.votes": data.option2.votes + 1,
                    voters: arrayUnion(user.uid)
                });
            });
        }
    } else {
        activePollDiv.innerHTML = "<p>Mom hasn't created a poll for tonight yet!</p>";
    }
});
