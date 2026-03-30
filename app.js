let db;
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const noteInput = document.getElementById('note');
const galleryList = document.getElementById('galleryList');

// 1. Initialize IndexedDB
const request = indexedDB.open('MemoirDB', 1);

request.onupgradeneeded = (e) => {
  db = e.target.result;
  if (!db.objectStoreNames.contains('entries')) {
    db.createObjectStore('entries', { keyPath: 'id', autoIncrement: true });
  }
};

request.onsuccess = (e) => {
  db = e.target.result;
};

// 2. Start Camera
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: "environment" } 
    });
    video.srcObject = stream;
  } catch (err) {
    console.error("Camera error:", err);
    alert("Please enable camera access to use this app.");
  }
}

// 3. Save Entry (Photo + Text)
document.getElementById('saveBtn').onclick = () => {
  if (!db) return;

  const context = canvas.getContext('2d');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  context.drawImage(video, 0, 0);
  
  const entry = {
    image: canvas.toDataURL('image/jpeg', 0.7),
    text: noteInput.value,
    date: new Date().toLocaleString()
  };

  const transaction = db.transaction(['entries'], 'readwrite');
  const store = transaction.objectStore('entries');
  store.add(entry);
  
  transaction.oncomplete = () => {
    alert("Entry Saved!");
    noteInput.value = "";
    showPage('gallery');
  };
};

// 4. UI Navigation & Gallery Loader
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');
  if (pageId === 'gallery') loadGallery();
}

function loadGallery() {
  galleryList.innerHTML = "";
  const transaction = db.transaction('entries', 'readonly');
  const objectStore = transaction.objectStore('entries');
  
  objectStore.openCursor(null, 'prev').onsuccess = (e) => {
    const cursor = e.target.result;
    if (cursor) {
      const div = document.createElement('div');
      div.className = 'gallery-item';
      div.innerHTML = `
        <small>${cursor.value.date}</small>
        <img src="${cursor.value.image}">
        <p>${cursor.value.text || "<em>No text added.</em>"}</p>
      `;
      galleryList.appendChild(div);
      cursor.continue();
    } else if (galleryList.innerHTML === "") {
      galleryList.innerHTML = "<p>Your gallery is empty.</p>";
    }
  };
}

// 5. Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js');
  });
}

// Initialize Camera on load
startCamera();