let db;
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const noteInput = document.getElementById('note');
const galleryList = document.getElementById('galleryList');
const snapBtn = document.getElementById('snapBtn');
const saveBtn = document.getElementById('saveBtn');
const retakeBtn = document.getElementById('retakeBtn');

// 1. DB Setup
const request = indexedDB.open('MemoirDB', 1);
request.onupgradeneeded = e => e.target.result.createObjectStore('entries', { keyPath: 'id', autoIncrement: true });
request.onsuccess = e => db = e.target.result;

// 2. Camera Setup
navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
  .then(stream => video.srcObject = stream);

// 3. Capture Photo Logic
snapBtn.onclick = () => {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0);
  
  video.classList.add('hidden');
  canvas.classList.remove('hidden');
  snapBtn.classList.add('hidden');
  saveBtn.classList.remove('hidden');
  retakeBtn.classList.remove('hidden');
};

// 4. Retake Logic
retakeBtn.onclick = () => {
  video.classList.remove('hidden');
  canvas.classList.add('hidden');
  snapBtn.classList.remove('hidden');
  saveBtn.classList.add('hidden');
  retakeBtn.classList.add('hidden');
};

// 5. Save Entry
saveBtn.onclick = () => {
  const entry = {
    image: canvas.toDataURL('image/jpeg', 0.7),
    text: noteInput.value,
    date: new Date().toLocaleString()
  };
  const tx = db.transaction('entries', 'readwrite');
  tx.objectStore('entries').add(entry);
  tx.oncomplete = () => {
    noteInput.value = "";
    showPage('gallery');
  };
};

function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');
  
  if (pageId === 'capture') {
    retakeBtn.click(); // Reset camera view automatically
  } else {
    loadGallery();
  }
}

function loadGallery() {
  galleryList.innerHTML = "";
  db.transaction('entries').objectStore('entries').openCursor(null, 'prev').onsuccess = e => {
    const cursor = e.target.result;
    if (cursor) {
      const div = document.createElement('div');
      div.className = 'gallery-item';
      div.innerHTML = `<small>${cursor.value.date}</small><img src="${cursor.value.image}"><p>${cursor.value.text}</p>`;
      galleryList.appendChild(div);
      cursor.continue();
    }
  };
}

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');