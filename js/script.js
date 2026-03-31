const API_KEY = '2r6IjgP5pQbQMsRJhMEFVr2Pabithkde8tebish3';
const APOD_ENDPOINT = 'https://api.nasa.gov/planetary/apod';

const spaceFacts = [
  'A day on Venus is longer than a year on Venus.',
  'Light from the Sun takes about 8 minutes and 20 seconds to reach Earth.',
  'Mercury has a year that lasts only 88 Earth days.',
  'Mars has the tallest known volcano in the solar system: Olympus Mons.',
  'Jupiter is so large that more than 1,300 Earths could fit inside it.',
  'Saturn is less dense than water, so it would float in a giant enough ocean.',
  'Neutron stars can spin hundreds of times every second.',
  'One teaspoon of neutron-star matter would weigh around a billion tons on Earth.',
  'The footprints left on the Moon can remain for millions of years.',
  'The Moon is moving away from Earth by about 3.8 centimeters each year.',
  'Earth is hit by roughly 100 tons of space dust every day.',
  'A year on Uranus is about 84 Earth years.',
  'A year on Neptune is about 165 Earth years.',
  'The Milky Way is a barred spiral galaxy.',
  'Our Milky Way galaxy is about 100,000 light-years across.',
  'The International Space Station orbits Earth about once every 90 minutes.',
  'Astronauts on the International Space Station see about 16 sunrises and sunsets each day.',
  'The Sun contains about 99.8% of the mass in our solar system.',
  'Comets grow tails when sunlight warms their ice and releases gas and dust.',
  'Black holes have gravity so strong that not even light can escape from inside the event horizon.',
  'The James Webb Space Telescope studies the universe mostly in infrared light.',
  'Some exoplanets orbit two stars, like a real-life Tatooine sky.',
  'The closest star system to us, Alpha Centauri, is about 4.37 light-years away.',
  'A light-year is a distance: how far light travels in one year.',
  'Most of the atoms in your body were forged inside stars.'
];

const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');
const getImagesBtn = document.getElementById('getImagesBtn');
const gallery = document.getElementById('gallery');
const statusMessage = document.getElementById('statusMessage');
const spaceFact = document.getElementById('spaceFact');
const factCardStars = document.getElementById('factCardStars');

const imageModal = document.getElementById('imageModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const modalMedia = document.getElementById('modalMedia');
const modalDate = document.getElementById('modalDate');
const modalTitle = document.getElementById('modalTitle');
const modalExplanation = document.getElementById('modalExplanation');
const modalExternalLink = document.getElementById('modalExternalLink');

const state = {
  items: []
};

let lastFocusedElement = null;
let lastFactIndex = -1;

setupDateInputs(startInput, endInput);
setupFactCardStars();
showRandomFact();
attachEventListeners();
fetchSpaceImages();

function attachEventListeners() {
  getImagesBtn.addEventListener('click', fetchSpaceImages);

  gallery.addEventListener('click', (event) => {
    const card = event.target.closest('.gallery-card');
    if (!card) return;

    openModal(Number(card.dataset.index));
  });

  gallery.addEventListener('keydown', (event) => {
    const card = event.target.closest('.gallery-card');
    if (!card) return;

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openModal(Number(card.dataset.index));
    }
  });

  closeModalBtn.addEventListener('click', closeModal);

  imageModal.addEventListener('click', (event) => {
    if (event.target.dataset.closeModal === 'true') {
      closeModal();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !imageModal.classList.contains('hidden')) {
      closeModal();
    }
  });
}

function showRandomFact() {
  if (!spaceFacts.length) return;

  let randomIndex = Math.floor(Math.random() * spaceFacts.length);

  // If possible, avoid repeating the same fact back-to-back.
  if (spaceFacts.length > 1 && randomIndex === lastFactIndex) {
    randomIndex = (randomIndex + 1) % spaceFacts.length;
  }

  lastFactIndex = randomIndex;
  spaceFact.textContent = spaceFacts[randomIndex];
}

function setupFactCardStars() {
  if (!factCardStars) return;

  const starCount = 42;
  const fragment = document.createDocumentFragment();

  // Create stars with random position, size, and base brightness.
  for (let i = 0; i < starCount; i += 1) {
    const star = document.createElement('span');
    star.className = 'fact-star';

    const size = Math.random() * 2 + 1;
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 100}%`;
    star.style.width = `${size}px`;
    star.style.height = `${size}px`;
    star.style.opacity = `${0.2 + Math.random() * 0.45}`;

    fragment.appendChild(star);
  }

  factCardStars.appendChild(fragment);

  // Every half second, pick one random star and make it twinkle.
  setInterval(() => {
    const stars = factCardStars.querySelectorAll('.fact-star');
    if (!stars.length) return;

    const randomStar = stars[Math.floor(Math.random() * stars.length)];
    randomStar.classList.remove('twinkle');

    // Force reflow so animation restarts on the same star if chosen twice.
    void randomStar.offsetWidth;

    randomStar.classList.add('twinkle');
  }, 750);
}

async function fetchSpaceImages() {
  const startDate = startInput.value;
  const endDate = endInput.value;

  if (!startDate || !endDate) {
    renderStatus('Please choose both a start date and an end date.', true);
    return;
  }

  if (startDate > endDate) {
    renderStatus('The start date must be earlier than or equal to the end date.', true);
    return;
  }

  renderStatus('🔄 Loading space photos…');
  renderLoadingState();

  try {
    const url = new URL(APOD_ENDPOINT);
    url.search = new URLSearchParams({
      api_key: API_KEY,
      start_date: startDate,
      end_date: endDate,
      thumbs: 'true'
    }).toString();

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`NASA API request failed with status ${response.status}`);
    }

    const data = await response.json();
    const items = (Array.isArray(data) ? data : [data]).sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    state.items = items;
    renderGallery(items);
    renderStatus(
      `Showing ${items.length} ${items.length === 1 ? 'entry' : 'entries'} from ${formatDisplayDate(startDate)} to ${formatDisplayDate(endDate)}.`
    );
  } catch (error) {
    console.error('Error fetching APOD data:', error);
    gallery.innerHTML = `
      <div class="empty-state">
        <p>We couldn’t load NASA’s space photos right now.</p>
        <p>Please try again in a moment.</p>
      </div>
    `;
    renderStatus('Something went wrong while loading the gallery.', true);
  }
}

function renderLoadingState() {
  gallery.innerHTML = `
    <div class="loading-shell">
      <div class="spinner" aria-hidden="true"></div>
      <p>Pulling imagery from NASA’s Astronomy Picture of the Day archive…</p>
    </div>
  `;
}

function renderGallery(items) {
  if (!items.length) {
    gallery.innerHTML = `
      <div class="empty-state">
        <p>No results were returned for that date range.</p>
      </div>
    `;
    return;
  }

  gallery.innerHTML = items
    .map((item, index) => {
      const isVideo = item.media_type === 'video';
      const mediaUrl = getGalleryMediaUrl(item);

      const mediaMarkup = mediaUrl
        ? `<img src="${escapeHtml(mediaUrl)}" alt="${escapeHtml(item.title)}" loading="lazy" />`
        : `
          <div class="video-space-fallback">
            <div class="video-space-fallback__stars" aria-hidden="true"></div>
            <img
              src="img/nasa-worm-logo.png"
              alt=""
              aria-hidden="true"
              class="video-space-fallback__logo"
              loading="lazy"
            />
          </div>
        `;

      return `
        <article
          class="gallery-card"
          tabindex="0"
          role="button"
          data-index="${index}"
          aria-label="Open details for ${escapeHtml(item.title)}"
        >
          <div class="card-media">
            ${mediaMarkup}
            ${isVideo ? '<span class="media-badge">VIDEO</span>' : ''}
          </div>

          <div class="card-copy">
            <h2 class="card-title">${escapeHtml(item.title)}</h2>
            <p class="card-date">${formatDisplayDate(item.date)}</p>
          </div>
        </article>
      `;
    })
    .join('');
}

function openModal(index) {
  const item = state.items[index];
  if (!item) return;

  lastFocusedElement = document.activeElement;

  modalDate.textContent = formatDisplayDate(item.date);
  modalTitle.textContent = item.title;
  modalExplanation.textContent = item.explanation || 'No explanation is available for this entry.';

  const originalUrl =
    item.media_type === 'video'
      ? getExternalVideoUrl(item.url)
      : normalizeUrl(item.hdurl || item.url);

  modalExternalLink.href = originalUrl || '#';
  modalExternalLink.textContent =
    item.media_type === 'video' ? 'Open original video' : 'Open full-resolution image';
  modalExternalLink.hidden = !originalUrl;

  renderModalMedia(item);

  imageModal.classList.remove('hidden');
  imageModal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  closeModalBtn.focus();
}

function closeModal() {
  imageModal.classList.add('hidden');
  imageModal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  modalMedia.innerHTML = '';

  if (lastFocusedElement) {
    lastFocusedElement.focus();
  }
}

function renderModalMedia(item) {
  modalMedia.innerHTML = '';

  if (item.media_type === 'image') {
    const image = document.createElement('img');
    image.src = normalizeUrl(item.hdurl || item.url);
    image.alt = item.title;
    modalMedia.appendChild(image);
    return;
  }

  const previewUrl = getGalleryMediaUrl(item);
  const videoUrl = getExternalVideoUrl(item.url);

  const previewLink = document.createElement('a');
  previewLink.href = videoUrl;
  previewLink.target = '_blank';
  previewLink.rel = 'noopener noreferrer';
  previewLink.className = 'video-preview-link';
  previewLink.dataset.hoverLabel = 'Watch Video';
  previewLink.setAttribute('aria-label', `Open video for ${item.title} in a new tab`);

  if (previewUrl) {
    const previewImage = document.createElement('img');
    previewImage.src = previewUrl;
    previewImage.alt = `${item.title} video preview`;
    previewLink.appendChild(previewImage);

  if (previewUrl) {
  const previewImage = document.createElement('img');
  previewImage.src = previewUrl;
  previewImage.alt = `${item.title} video preview`;
  previewLink.appendChild(previewImage);
} else {
  previewLink.innerHTML = `
    <div class="video-space-fallback">
      <div class="video-space-fallback__stars" aria-hidden="true"></div>
      <img
        src="img/nasa-worm-logo.png"
        alt=""
        aria-hidden="true"
        class="video-space-fallback__logo"
      />
    </div>
  `;
}
  } else {
    previewLink.innerHTML = `
      <div class="video-space-fallback">
        <div class="video-space-fallback__stars" aria-hidden="true"></div>
        <img
          src="img/nasa-worm-logo.png"
          alt=""
          aria-hidden="true"
          class="video-space-fallback__logo"
        />
      </div>
    `;
  }

  modalMedia.appendChild(previewLink);

  const note = document.createElement('p');
  note.className = 'video-note';
  note.textContent =
    'This APOD entry is a video. Click the preview or use the button below the description to open it in a new tab.';
  modalMedia.appendChild(note);
}

function getGalleryMediaUrl(item) {
  if (item.media_type === 'image') {
    return normalizeUrl(item.url);
  }

  if (item.thumbnail_url) {
    return normalizeUrl(item.thumbnail_url);
  }

  const youtubeThumbnail = getYouTubeThumbnail(item.url);
  if (youtubeThumbnail) {
    return youtubeThumbnail;
  }

  return '';
}

function getVideoPlaceholderImage() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#061f4a"/>
          <stop offset="100%" stop-color="#105bd8"/>
        </linearGradient>
      </defs>

      <rect width="1600" height="900" fill="url(#bg)"/>

      <circle cx="180" cy="140" r="2" fill="white" opacity="0.8"/>
      <circle cx="280" cy="220" r="3" fill="white" opacity="0.7"/>
      <circle cx="440" cy="120" r="2" fill="white" opacity="0.75"/>
      <circle cx="600" cy="180" r="2" fill="white" opacity="0.65"/>
      <circle cx="840" cy="120" r="3" fill="white" opacity="0.8"/>
      <circle cx="1080" cy="200" r="2" fill="white" opacity="0.7"/>
      <circle cx="1320" cy="140" r="2" fill="white" opacity="0.8"/>

      <circle cx="800" cy="450" r="86" fill="rgba(255,255,255,0.14)"/>
      <polygon points="770,395 770,505 865,450" fill="white"/>

      <text x="800" y="610" text-anchor="middle" font-family="Inter, Arial, sans-serif"
            font-size="54" font-weight="700" fill="white" letter-spacing="4">
        APOD VIDEO
      </text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function getYouTubeThumbnail(url) {
  try {
    const parsedUrl = new URL(normalizeUrl(url));
    const host = parsedUrl.hostname.replace('www.', '');
    let videoId = '';

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      videoId = parsedUrl.searchParams.get('v') || '';

      if (!videoId && parsedUrl.pathname.startsWith('/embed/')) {
        videoId = parsedUrl.pathname.split('/')[2] || '';
      }

      if (!videoId && parsedUrl.pathname.startsWith('/shorts/')) {
        videoId = parsedUrl.pathname.split('/')[2] || '';
      }
    }

    if (host === 'youtu.be') {
      videoId = parsedUrl.pathname.replace('/', '');
    }

    return videoId
      ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
      : '';
  } catch (error) {
    return '';
  }
}

function getExternalVideoUrl(url) {
  try {
    const parsedUrl = new URL(normalizeUrl(url));
    const host = parsedUrl.hostname.replace('www.', '');

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (parsedUrl.pathname.startsWith('/watch')) {
        return parsedUrl.href;
      }

      if (parsedUrl.pathname.startsWith('/embed/')) {
        const videoId = parsedUrl.pathname.split('/')[2];
        return videoId ? `https://www.youtube.com/watch?v=${videoId}` : parsedUrl.href;
      }

      if (parsedUrl.pathname.startsWith('/shorts/')) {
        const videoId = parsedUrl.pathname.split('/')[2];
        return videoId ? `https://www.youtube.com/watch?v=${videoId}` : parsedUrl.href;
      }

      const watchId = parsedUrl.searchParams.get('v');
      if (watchId) {
        return `https://www.youtube.com/watch?v=${watchId}`;
      }

      return parsedUrl.href;
    }

    if (host === 'youtu.be') {
      const videoId = parsedUrl.pathname.replace('/', '');
      return videoId ? `https://www.youtube.com/watch?v=${videoId}` : parsedUrl.href;
    }

    return parsedUrl.href;
  } catch (error) {
    return normalizeUrl(url);
  }
}

function renderStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle('error', isError);
}

function formatDisplayDate(dateString) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return formatter.format(new Date(`${dateString}T00:00:00`));
}

function normalizeUrl(url = '') {
  return String(url).replace(/^http:\/\//i, 'https://');
}

function escapeHtml(text = '') {
  const htmlMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };

  return String(text).replace(/[&<>"']/g, (character) => htmlMap[character]);
}