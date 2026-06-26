// Mock Track Data (Replace URLs with real media streams)
const trackList = [
    { id: 1, title: "Midnight City", artist: "M83", genre: "Pop", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", art: "https://picsum.photos/id/10/60/60" },
    { id: 2, title: "Starlight Shimmer", artist: "Aether", genre: "Lo-Fi", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", art: "https://picsum.photos/id/20/60/60" },
    { id: 3, title: "Thunderstruck", artist: "AC/DC", genre: "Rock", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3", art: "https://picsum.photos/id/30/60/60" },
    { id: 4, title: "Breathe Deep", artist: "Vanilla Ice", genre: "Lo-Fi", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3", art: "https://picsum.photos/id/40/60/60" },
    { id: 5, title: "Neon Horizons", artist: "The Midnight", genre: "Pop", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3", art: "https://picsum.photos/id/50/60/60" }
];

// App State Management
let currentTrackIndex = 0;
let isPlaying = false;
let currentFilter = { category: 'all', playlist: 'all', search: '' };
let favorites = [];

// DOM Elements
const audio = document.getElementById('audio-player');
const tracksContainer = document.getElementById('tracks-container');
const playBtn = document.getElementById('play-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const progressBar = document.getElementById('progress-bar');
const volumeBar = document.getElementById('volume-bar');
const currentTimeEl = document.getElementById('current-time');
const durationTimeEl = document.getElementById('total-duration');
const searchInput = document.getElementById('search-input');

// Initial Setup
window.addEventListener('load', () => {
    renderTracks();
    loadTrack(currentTrackIndex);
    setupEventListeners();
});

// Render Song List based on active Filters
function renderTracks() {
    tracksContainer.innerHTML = '';
    
    const filteredTracks = trackList.filter(track => {
        const matchesCategory = currentFilter.category === 'all' || track.genre === currentFilter.category;
        const matchesPlaylist = currentFilter.playlist === 'all' || (currentFilter.playlist === 'favorites' && favorites.includes(track.id));
        const matchesSearch = track.title.toLowerCase().includes(currentFilter.search.toLowerCase()) || 
                              track.artist.toLowerCase().includes(currentFilter.search.toLowerCase());
        return matchesCategory && matchesPlaylist && matchesSearch;
    });

    if(filteredTracks.length === 0) {
        tracksContainer.innerHTML = `<div class="no-tracks" style="padding:20px; color:var(--text-muted)">No tracks found matches.</div>`;
        return;
    }

    filteredTracks.forEach((track, index) => {
        const isCurrent = trackList[currentTrackIndex].id === track.id;
        const isFav = favorites.includes(track.id);
        
        const trackRow = document.createElement('div');
        trackRow.className = `track-row ${isCurrent ? 'playing' : ''}`;
        trackRow.innerHTML = `
            <span>${index + 1}</span>
            <strong>${track.title}</strong>
            <span>${track.artist}</span>
            <span>${track.genre}</span>
            <button class="action-btn toggle-fav ${isFav ? 'favorited' : ''}" data-id="${track.id}">
                <i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
            </button>
        `;
        
        // Click targeting row directly plays track
        trackRow.addEventListener('click', (e) => {
            if(e.target.closest('.toggle-fav')) return; // Ignore if user clicks heart icon
            const globalIndex = trackList.findIndex(t => t.id === track.id);
            loadTrack(globalIndex);
            playTrack();
        });

        tracksContainer.appendChild(trackRow);
    });
}

// Media Framework Core Functions
function loadTrack(index) {
    currentTrackIndex = index;
    const track = trackList[currentTrackIndex];
    
    audio.src = track.url;
    document.getElementById('current-title').textContent = track.title;
    document.getElementById('current-artist').textContent = track.artist;
    document.getElementById('current-art').src = track.art;
    
    // Toggle favorite state on bottom player panel
    const favBtn = document.getElementById('favorite-btn');
    if(favorites.includes(track.id)) {
        favBtn.classList.add('favorited');
        favBtn.innerHTML = '<i class="fa-solid fa-heart"></i>';
    } else {
        favBtn.classList.remove('favorited');
        favBtn.innerHTML = '<i class="fa-regular fa-heart"></i>';
    }

    renderTracks();
}

function playTrack() {
    isPlaying = true;
    audio.play();
    playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
}

function pauseTrack() {
    isPlaying = false;
    audio.pause();
    playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
}

function prevTrack() {
    let index = currentTrackIndex - 1;
    if (index < 0) index = trackList.length - 1;
    loadTrack(index);
    if(isPlaying) playTrack();
}

function nextTrack() {
    let index = currentTrackIndex + 1;
    if (index >= trackList.length) index = 0;
    loadTrack(index);
    if(isPlaying) playTrack();
}

// Format raw seconds into standard MM:SS
function formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// Event Orchestrator
function setupEventListeners() {
    // Media Interface elements
    playBtn.addEventListener('click', () => isPlaying ? pauseTrack() : playTrack());
    prevBtn.addEventListener('click', prevTrack);
    nextBtn.addEventListener('click', nextTrack);
    
    // Track auto-advance handling
    audio.addEventListener('ended', nextTrack);

    // Audio status timelines updating
    audio.addEventListener('timeupdate', () => {
        if(audio.duration) {
            const progressPercent = (audio.currentTime / audio.duration) * 100;
            progressBar.value = progressPercent;
            currentTimeEl.textContent = formatTime(audio.currentTime);
        }
    });

    audio.addEventListener('loadedmetadata', () => {
        durationTimeEl.textContent = formatTime(audio.duration);
    });

    // Scrubbing tracking adjustments
    progressBar.addEventListener('input', () => {
        const seekTime = (progressBar.value / 100) * audio.duration;
        audio.currentTime = seekTime;
    });

    // Volumetric Controls
    volumeBar.addEventListener('input', () => {
        audio.volume = volumeBar.value / 100;
        const volIcon = document.getElementById('volume-icon');
        if(audio.volume === 0) {
            volIcon.className = "fa-solid fa-volume-xmark";
        } else if (audio.volume < 0.5) {
            volIcon.className = "fa-solid fa-volume-low";
        } else {
            volIcon.className = "fa-solid fa-volume-high";
        }
    });

    // Dynamic Engine Input Filtration
    searchInput.addEventListener('input', (e) => {
        currentFilter.search = e.target.value;
        renderTracks();
    });

    // Sidebar Category handling
    document.querySelectorAll('.nav-item').forEach(button => {
        button.addEventListener('click', (e) => {
            document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
            button.classList.add('active');
            
            currentFilter.category = button.getAttribute('data-category');
            document.getElementById('current-view-title').textContent = button.textContent.trim();
            renderTracks();
        });
    });

    // Playlist Selection handling
    document.querySelectorAll('.playlist-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.playlist-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            currentFilter.playlist = tab.getAttribute('data-playlist');
            renderTracks();
        });
    });

    // Track list structural Event capture delegation for adding/removing items to Favorites list
    tracksContainer.addEventListener('click', (e) => {
        const targetBtn = e.target.closest('.toggle-fav');
        if(targetBtn) {
            const trackId = parseInt(targetBtn.getAttribute('data-id'));
            toggleFavorite(trackId);
        }
    });

    document.getElementById('favorite-btn').addEventListener('click', () => {
        toggleFavorite(trackList[currentTrackIndex].id);
    });
}

function toggleFavorite(trackId) {
    const index = favorites.indexOf(trackId);
    if(index === -1) {
        favorites.push(trackId);
    } else {
        favorites.splice(index, 1);
    }
    loadTrack(currentTrackIndex); // Triggers updates instantly on DOM layouts mapping
}