import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, doc, setDoc, updateDoc, arrayUnion, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA0C8dIx0plY4UHOO5K4K0LOO_ZApnnkkA",
  authDomain: "mom-s-fridge-508ae.firebaseapp.com",
  projectId: "mom-s-fridge-508ae",
  storageBucket: "mom-s-fridge-508ae.firebasestorage.app",
  messagingSenderId: "872039324844",
  appId: "1:872039324844:web:6ae4dafcc7619756b29309",
  measurementId: "G-CWG0XXRG26"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- THEME TOGGLE LOGIC ---
const themeToggleBtn = document.getElementById('theme-toggle');
if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
}
themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    if (document.body.classList.contains('dark-mode')) {
        localStorage.setItem('theme', 'dark');
    } else {
        localStorage.setItem('theme', 'light');
    }
});
// --------------------------

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

document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('isMom'); 
    signOut(auth);
});

onAuthStateChanged(auth, (user) => {
    if (user) {
        loginScreen.style.display = 'none';
        mainApp.style.display = 'block';
        greeting.innerText = `Hello, ${user.displayName}!`;

        const isMom = localStorage.getItem('isMom') === 'true';
        
        if (isMom) {
            momControls.style.display = 'block';
            momPollControls.style.display = 'block';
        } else {
            momControls.style.display = 'none';
            momPollControls.style.display = 'none';
        }

        onSnapshot(collection(db, "fridge"), (snapshot) => {
            fridgeList.innerHTML = ''; 
            
            snapshot.forEach((docItem) => {
                const li = document.createElement('li');
                li.innerText = docItem.data().name;
                li.style.marginBottom = "8px";

                if (isMom) {
                    const deleteBtn = document.createElement('button');
                    deleteBtn.innerText = "X";
                    deleteBtn.style.backgroundColor = "#d62828"; 
                    deleteBtn.style.color = "white";
                    deleteBtn.style.padding = "2px 6px";
                    deleteBtn.style.marginLeft = "10px";
                    
                    deleteBtn.addEventListener('click', async () => {
                        await deleteDoc(doc(db, "fridge", docItem.id));
                    });
                    li.appendChild(deleteBtn);
                }
                fridgeList.appendChild(li);
            });
        });

    } else {
        loginScreen.style.display = 'block';
        mainApp.style.display = 'none';
    }
});

document.getElementById('add-item-btn').addEventListener('click', async () => {
    const itemInput = document.getElementById('new-item');
    if (itemInput.value !== "") {
        await addDoc(collection(db, "fridge"), {
            name: itemInput.value
        });
        itemInput.value = ""; 
    }
});

document.getElementById('submit-note-btn').addEventListener('click', async () => {
    const noteInput = document.getElementById('dinner-note');
    const user = auth.currentUser;
    
    if (noteInput.value !== "" && user) {
        await addDoc(collection(db, "suggestions"), {
            text: noteInput.value,
            author: user.displayName,
            uid: user.uid 
        });
        noteInput.value = ""; 
    }
});

onSnapshot(collection(db, "suggestions"), (snapshot) => {
    const allNotesDiv = document.getElementById('all-notes');
    allNotesDiv.innerHTML = ''; 
    const isMom = localStorage.getItem('isMom') === 'true';
    const currentUser = auth.currentUser;
    
    snapshot.forEach((docItem) => {
        const data = docItem.data();
        const noteContainer = document.createElement('div');
        noteContainer.style.marginBottom = '10px';
        
        // Changed to use CSS variable for author name color
        noteContainer.innerHTML = `<strong style="color: var(--primary-accent);">${data.author}:</strong> ${data.text}`;
        
        const isMyNote = currentUser && data.uid === currentUser.uid;
        if (isMom || isMyNote) {
            const deleteBtn = document.createElement('button');
            deleteBtn.innerText = "Delete";
            deleteBtn.style.backgroundColor = "#d62828";
            deleteBtn.style.color = "white";
            deleteBtn.style.padding = "2px 6px";
            deleteBtn.style.marginLeft = "10px";
            
            deleteBtn.addEventListener('click', async () => {
                await deleteDoc(doc(db, "suggestions", docItem.id));
            });
            noteContainer.appendChild(deleteBtn);
        }
        allNotesDiv.appendChild(noteContainer);
    });
});

document.getElementById('create-poll-btn').addEventListener('click', async () => {
    const opt1 = document.getElementById('poll-option-1').value;
    const opt2 = document.getElementById('poll-option-2').value;

    if (opt1 !== "" && opt2 !== "") {
        await setDoc(doc(db, "polls", "current"), {
            option1: { name: opt1, votes: 0 },
            option2: { name: opt2, votes: 0 },
            voters: [] 
        });
        document.getElementById('poll-option-1').value = "";
        document.getElementById('poll-option-2').value = "";
    }
});

onSnapshot(doc(db, "polls", "current"), (docSnapshot) => {
    const activePollDiv = document.getElementById('active-poll');
    
    if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        const user = auth.currentUser;
        const hasVoted = user && data.voters.includes(user.uid);

        // Changed poll boxes to use CSS variables so they swap colors properly
        activePollDiv.innerHTML = `
            <p style="color: #d62828; font-size: 0.9em; font-style: italic; margin-bottom: 15px;">* if u vote u cant change your vote</p>
            <div style="margin-bottom: 15px; background-color: var(--bg-color); border: 1px solid var(--border-color); padding: 10px; border-radius: 5px;">
                <strong>${data.option1.name}</strong>: ${data.option1.votes} votes
                ${!hasVoted ? `<button id="vote-opt1" style="margin-left: 10px;">Vote</button>` : ''}
            </div>
            <div style="background-color: var(--bg-color); border: 1px solid var(--border-color); padding: 10px; border-radius: 5px;">
                <strong>${data.option2.name}</strong>: ${data.option2.votes} votes
                ${!hasVoted ? `<button id="vote-opt2" style="margin-left: 10px;">Vote</button>` : ''}
            </div>
            ${hasVoted ? `<p style="color: var(--primary-accent); margin-top: 10px; font-weight: bold;">Thanks for voting!</p>` : ''}
        `;

        if (!hasVoted && user) {
            document.getElementById('vote-opt1').addEventListener('click', async () => {
                await updateDoc(doc(db, "polls", "current"), {
                    "option1.votes": data.option1.votes + 1,
                    voters: arrayUnion(user.uid) 
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

document.getElementById('delete-poll-btn').addEventListener('click', async () => {
    await deleteDoc(doc(db, "polls", "current"));
});
