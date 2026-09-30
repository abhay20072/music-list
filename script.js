// Playlist data. "local: true" means the song was added by the user from their computer.
const songs = [
  { title: "SoundHelix Song 1", artist: "SoundHelix", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", local: false },
  { title: "SoundHelix Song 2", artist: "SoundHelix", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", local: false },
  { title: "SoundHelix Song 3", artist: "SoundHelix", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3", local: false },
  { title: "SoundHelix Song 4", artist: "SoundHelix", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3", local: false },
  { title: "SoundHelix Song 5", artist: "SoundHelix", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3", local: false }
];

const app = document.getElementById("app");
const audio = document.getElementById("audio");
const art = document.getElementById("art");
const artLetter = document.getElementById("artLetter");
const stateText = document.getElementById("stateText");
const titleEl = document.getElementById("title");
const artistEl = document.getElementById("artist");
const currentEl = document.getElementById("current");
const durationEl = document.getElementById("duration");
const progress = document.getElementById("progress");
const volume = document.getElementById("volume");
const playBtn = document.getElementById("playBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const playIcon = document.getElementById("playIcon");
const pauseIcon = document.getElementById("pauseIcon");
const statusEl = document.getElementById("status");
const playlistEl = document.getElementById("playlist");
const countEl = document.getElementById("count");
const addBtn = document.getElementById("addBtn");
const fileInput = document.getElementById("fileInput");
const artistInput = document.getElementById("artistInput");

let currentIndex = 0;

// Convert seconds to m:ss
function formatTime(seconds) {
  if (!isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return m + ":" + (s < 10 ? "0" : "") + s;
}

function setFill(slider, percent) {
  slider.style.setProperty("--fill", percent + "%");
}

// Every song gets its own colour (hue) based on its title
function hueFor(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) % 360;
  }
  return hash;
}

function renderPlaylist() {
  playlistEl.innerHTML = "";
  countEl.textContent = songs.length + (songs.length === 1 ? " song" : " songs");

  if (songs.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty-msg";
    empty.textContent = "Playlist is empty. Add songs to start listening.";
    playlistEl.appendChild(empty);
    return;
  }

  songs.forEach((song, index) => {
    const hue = hueFor(song.title);
    const li = document.createElement("li");

    const btn = document.createElement("button");
    btn.className = "track" + (index === currentIndex ? " active" : "");
    btn.innerHTML =
      '<span class="swatch"><span class="num"></span>' +
      '<span class="eq"><i></i><i></i><i></i><i></i></span></span>' +
      '<span class="t-info"><span class="t-title"></span><span class="t-artist"></span></span>';
    btn.querySelector(".swatch").style.background =
      "linear-gradient(135deg, hsl(" + hue + " 75% 55%), hsl(" + (hue + 50) + " 75% 40%))";
    btn.querySelector(".num").textContent = index + 1;
    btn.querySelector(".t-title").textContent = song.title;
    btn.querySelector(".t-artist").textContent = song.artist;
    btn.addEventListener("click", () => {
      if (index === currentIndex) {
        togglePlay();
      } else {
        loadSong(index);
        playSong();
      }
    });
    li.appendChild(btn);

    // Delete button for every song
    const del = document.createElement("button");
    del.className = "remove";
    del.textContent = "\u00D7";
    del.setAttribute("aria-label", "Remove " + song.title);
    del.title = "Remove song";
    del.addEventListener("click", () => removeSong(index));
    li.appendChild(del);

    playlistEl.appendChild(li);
  });
}

function loadSong(index) {
  currentIndex = index;
  const song = songs[index];

  audio.src = song.src;
  titleEl.textContent = song.title;
  artistEl.textContent = song.artist;
  artLetter.textContent = song.title.charAt(0).toUpperCase();

  currentEl.textContent = "0:00";
  durationEl.textContent = "0:00";
  progress.value = 0;
  setFill(progress, 0);
  statusEl.textContent = "";
  renderPlaylist();
}

function playSong() {
  if (songs.length === 0) return;
  audio.play().catch(() => {
    statusEl.textContent = "Could not play this song. Check the file or your internet connection.";
  });
}

function togglePlay() {
  if (songs.length === 0) return;
  if (audio.paused) playSong();
  else audio.pause();
}

function nextSong() {
  if (songs.length === 0) return;
  loadSong((currentIndex + 1) % songs.length);
  playSong();
}

function prevSong() {
  if (songs.length === 0) return;
  // Past 3 seconds: restart the song. Otherwise: go to the previous song.
  if (audio.currentTime > 3) {
    audio.currentTime = 0;
    return;
  }
  loadSong((currentIndex - 1 + songs.length) % songs.length);
  playSong();
}

// ----- Add / remove songs -----
function parseFileName(fileName) {
  const name = fileName.replace(/\.[^/.]+$/, "").replace(/_/g, " ").trim();

  // "Artist - Title", "Artist \u2013 Title" (en dash) or "Artist \u2014 Title" (em dash)
  let match = name.match(/^(.+?)\s+[-\u2013\u2014]\s+(.+)$/);
  // "Artist-Title" with no spaces, only when there is exactly one dash
  if (!match) match = name.match(/^([^-\u2013\u2014]+?)\s*[-\u2013\u2014]\s*([^-\u2013\u2014]+)$/);

  if (match) return { artist: match[1].trim(), title: match[2].trim() };
  return { artist: "", title: name };
}

function addSongs(files) {
  const typedArtist = artistInput.value.trim();
  const firstNewIndex = songs.length;

  Array.from(files).forEach((file) => {
    if (!file.type.startsWith("audio/")) return;
    const info = parseFileName(file.name);
    songs.push({
      title: info.title || "Untitled",
      artist: typedArtist || info.artist || "Unknown artist",
      src: URL.createObjectURL(file),
      local: true
    });
  });

  if (songs.length > firstNewIndex) {
    loadSong(firstNewIndex); // play the first song that was just added
    playSong();
  }
  fileInput.value = "";
}

function showEmptyPlayer() {
  audio.pause();
  audio.removeAttribute("src");
  audio.load();
  app.classList.remove("is-playing");
  titleEl.textContent = "No songs in playlist";
  artistEl.textContent = "Add songs to start";
  artLetter.textContent = "\u266A";
  stateText.textContent = "Ready to play";
  currentEl.textContent = "0:00";
  durationEl.textContent = "0:00";
  progress.value = 0;
  setFill(progress, 0);
  statusEl.textContent = "";
  document.title = "Music Player";
  currentIndex = 0;
  renderPlaylist();
}

function removeSong(index) {
  if (songs[index].local) URL.revokeObjectURL(songs[index].src);
  const wasCurrent = index === currentIndex;
  songs.splice(index, 1);

  if (songs.length === 0) {
    showEmptyPlayer();
  } else if (wasCurrent) {
    audio.pause();
    loadSong(Math.min(index, songs.length - 1));
  } else {
    if (index < currentIndex) currentIndex--;
    renderPlaylist();
  }
}

// ----- Events -----
playBtn.addEventListener("click", togglePlay);
nextBtn.addEventListener("click", nextSong);
prevBtn.addEventListener("click", prevSong);
addBtn.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", () => addSongs(fileInput.files));

audio.addEventListener("play", () => {
  playIcon.classList.add("hidden");
  pauseIcon.classList.remove("hidden");
  playBtn.setAttribute("aria-label", "Pause");
  app.classList.add("is-playing");
  stateText.textContent = "Now playing";
  document.title = songs[currentIndex].title + " - " + songs[currentIndex].artist;
});

audio.addEventListener("pause", () => {
  playIcon.classList.remove("hidden");
  pauseIcon.classList.add("hidden");
  playBtn.setAttribute("aria-label", "Play");
  app.classList.remove("is-playing");
  stateText.textContent = "Paused";
});

audio.addEventListener("loadedmetadata", () => {
  durationEl.textContent = formatTime(audio.duration);
});

audio.addEventListener("timeupdate", () => {
  if (!audio.duration) return;
  const percent = (audio.currentTime / audio.duration) * 100;
  progress.value = percent;
  setFill(progress, percent);
  currentEl.textContent = formatTime(audio.currentTime);
});

progress.addEventListener("input", () => {
  if (!audio.duration) return;
  audio.currentTime = (progress.value / 100) * audio.duration;
  setFill(progress, progress.value);
});

volume.addEventListener("input", () => {
  audio.volume = volume.value;
  setFill(volume, volume.value * 100);
});

// Autoplay: when a song ends, the next one starts automatically
audio.addEventListener("ended", nextSong);

audio.addEventListener("error", () => {
  statusEl.textContent = "Could not load this song. Check the file or your internet connection.";
});

// ----- Initial setup -----
audio.volume = volume.value;
setFill(volume, volume.value * 100);
loadSong(0);