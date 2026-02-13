const API_BASE = window.location.hostname === 'localhost' 
    ? '/api' 
    : '/api';

document.addEventListener('DOMContentLoaded', () => {
    loadTrendingMovies();
    setupEventListeners();
});

function setupEventListeners() {
    const searchToggle = document.querySelector('.search-toggle');
    const searchBar = document.querySelector('.search-bar');
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');
    const modal = document.getElementById('videoModal');
    const closeBtn = document.querySelector('.close');

    window.addEventListener('scroll', () => {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    searchToggle.addEventListener('click', () => {
        searchBar.classList.toggle('hidden');
        if (!searchBar.classList.contains('hidden')) {
            searchInput.focus();
        }
    });

    searchBtn.addEventListener('click', () => {
        const query = searchInput.value.trim();
        if (query) {
            searchMovies(query);
        }
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            if (query) {
                searchMovies(query);
            }
        }
    });

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        document.getElementById('videoPlayer').src = '';
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            document.getElementById('videoPlayer').src = '';
        }
    });
}

async function loadTrendingMovies() {
    try {
        const response = await fetch(`${API_BASE}?action=home`);
        const data = await response.json();
        
        if (data.success) {
            displayMovies('trendingRow', data.data.slice(0, 10));
            displayMovies('recommendedRow', data.data.slice(10, 20));
        } else {
            showError('Failed to load movies');
        }
    } catch (error) {
        console.error('Error loading movies:', error);
        showError('Failed to connect to server');
    }
}

function displayMovies(containerId, movies) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    if (!movies || movies.length === 0) {
        container.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">No movies found</p>';
        return;
    }

    movies.forEach(movie => {
        const card = createMovieCard(movie);
        container.appendChild(card);
    });
}

function createMovieCard(movie) {
    const card = document.createElement('div');
    card.className = 'movie-card';
    
    const img = document.createElement('img');
    img.src = movie.thumbnail || 'https://via.placeholder.com/300x450?text=No+Image';
    img.alt = movie.title;
    img.loading = 'lazy';
    
    const info = document.createElement('div');
    info.className = 'movie-info';
    
    const title = document.createElement('div');
    title.className = 'movie-title';
    title.textContent = movie.title;
    
    const type = document.createElement('div');
    type.className = 'movie-type';
    type.textContent = movie.type || 'Movie';
    
    info.appendChild(title);
    info.appendChild(type);
    card.appendChild(img);
    card.appendChild(info);
    
    card.addEventListener('click', () => playMovie(movie));
    
    return card;
}

async function searchMovies(query) {
    try {
        document.querySelector('.search-bar').classList.add('hidden');
        
        const response = await fetch(`${API_BASE}?action=search&query=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        if (data.success) {
            const movieRows = document.querySelectorAll('.movies-section');
            movieRows[0].querySelector('h2').textContent = `Search Results: "${query}"`;
            movieRows[1].style.display = 'none';
            
            displayMovies('trendingRow', data.data);
        }
    } catch (error) {
        console.error('Error searching movies:', error);
        alert('Failed to search movies');
    }
}

async function playMovie(movie) {
    if (!movie.url) {
        alert('No video URL available');
        return;
    }

    try {
        const modal = document.getElementById('videoModal');
        const modalTitle = document.getElementById('modalTitle');
        const videoPlayer = document.getElementById('videoPlayer');
        
        modalTitle.textContent = movie.title;
        modal.style.display = 'block';
        
        const response = await fetch(`${API_BASE}?action=stream&url=${encodeURIComponent(movie.url)}`);
        const data = await response.json();
        
        if (data.success && data.data.streamUrl) {
            if (data.data.streamUrl.includes('youtube.com') || data.data.streamUrl.includes('youtu.be')) {
                videoPlayer.src = data.data.streamUrl;
            } else if (data.data.streamUrl.includes('vimeo.com')) {
                videoPlayer.src = data.data.streamUrl;
            } else {
                videoPlayer.src = data.data.streamUrl;
            }
        } else {
            videoPlayer.src = movie.url;
        }
    } catch (error) {
        console.error('Error playing movie:', error);
        alert('Failed to load video stream');
    }
}

function showError(message) {
    const rows = document.querySelectorAll('.movie-row');
    rows.forEach(row => {
        row.innerHTML = `<div class="error-message">${message}</div>`;
    });
}