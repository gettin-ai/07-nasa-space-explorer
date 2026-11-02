const APOD_ENDPOINT = 'https://science.nasa.gov/wp-json/wp/v2/apod-basic';
const APOD_PAGE_SIZE = 25;

const spaceFacts = [
  'A single rotation of Venus takes 243 Earth days—longer than its 225-day year.',
  'Light from the Sun takes about 8 minutes and 20 seconds to reach Earth.',
  'Mercury has a year that lasts only 88 Earth days.',
  'Mars has the tallest known volcano in the solar system: Olympus Mons.',
  'Jupiter is so large that more than 1,300 Earths could fit inside it.',
  'Saturn\'s average density is lower than water\'s, so theoretically it could float in an enormous ocean.',
  'Neutron stars can spin hundreds of times every second.',
  'One teaspoon of neutron-star matter would weigh around a billion tons on Earth.',
  'Footprints on the Moon can survive for thousands of years because there\'s no wind or rain to erase them.',
  'The Moon is moving away from Earth by about 3.8 centimeters each year.',
  'Tens of tons of extraterrestrial dust and debris enter Earth\'s atmosphere every day.',
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
  'Proxima Centauri, part of the Alpha Centauri star system, is the closest star to our Sun at about 4.24 light-years away.',
  'A light-year is a distance: how far light travels in one year.',
  'Many elements in your body, including carbon and oxygen, were forged inside ancient stars.'
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

  showRandomFact();
  renderStatus('🔄 One moment—loading your space photos…');
  renderLoadingState();

  try {
    const items = await fetchApodDateRange(startDate, endDate);

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

async function fetchApodDateRange(startDate, endDate) {
  const pageCache = new Map();
  const firstPage = await fetchApodPage(1, pageCache);
  const totalPages = Number(firstPage.totalPages) || 1;
  const startPage = await findPageForDate(endDate, totalPages, pageCache);
  const items = [];

  for (let pageNumber = startPage; pageNumber <= totalPages; pageNumber += 1) {
    const page = await fetchApodPage(pageNumber, pageCache);

    page.items.forEach((item) => {
      if (item.date >= startDate && item.date <= endDate) {
        items.push(item);
      }
    });

    if (!page.items.length || page.items[page.items.length - 1].date < startDate) {
      break;
    }
  }

  return items.sort((a, b) => new Date(b.date) - new Date(a.date));
}

async function fetchApodPage(pageNumber, pageCache) {
  if (pageCache.has(pageNumber)) {
    return pageCache.get(pageNumber);
  }

  const url = new URL(APOD_ENDPOINT);
  url.search = new URLSearchParams({
    page: String(pageNumber),
    per_page: String(APOD_PAGE_SIZE),
    _fields: 'date,title,media_type,explanation,alt,url,permalink,hdurl'
  }).toString();

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`NASA API request failed with status ${response.status}`);
  }

  const data = await response.json();
  if (!Array.isArray(data)) {
    throw new Error('NASA API returned an unexpected response.');
  }

  const items = data.filter(isValidApodItem);
  const page = {
    items,
    totalPages: response.headers.get('X-WP-TotalPages')
  };
  pageCache.set(pageNumber, page);
  return page;
}

async function findPageForDate(targetDate, totalPages, pageCache) {
  let low = 1;
  let high = totalPages;
  let closestPage = 1;

  while (low <= high) {
    const pageNumber = Math.floor((low + high) / 2);
    const page = await fetchApodPage(pageNumber, pageCache);

    if (!page.items.length) {
      high = pageNumber - 1;
      continue;
    }

    const newestDate = page.items[0].date;
    const oldestDate = page.items[page.items.length - 1].date;
    closestPage = pageNumber;

    if (targetDate > newestDate) {
      high = pageNumber - 1;
    } else if (targetDate < oldestDate) {
      low = pageNumber + 1;
    } else {
      return pageNumber;
    }
  }

  return closestPage;
}

function isValidApodItem(item) {
  return Boolean(
    item &&
    typeof item === 'object' &&
    /^\d{4}-\d{2}-\d{2}$/.test(item.date) &&
    typeof item.title === 'string' &&
    typeof item.media_type === 'string'
  );
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
      const altText = item.alt || item.title;

      const mediaMarkup = mediaUrl
        ? `<img src="${escapeHtml(mediaUrl)}" alt="${escapeHtml(altText)}" loading="lazy" data-media-preview />`
        : '';

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

  gallery.querySelectorAll('img[data-media-preview]').forEach((image) => {
    image.addEventListener('error', () => replaceMediaWithFallback(image), { once: true });
  });

  gallery.querySelectorAll('.card-media').forEach((mediaContainer, index) => {
    if (!mediaContainer.querySelector('img')) {
      mediaContainer.prepend(createMediaFallback());
    }
  });
}

function openModal(index) {
  const item = state.items[index];
  if (!item) return;

  lastFocusedElement = document.activeElement;

  modalDate.textContent = formatDisplayDate(item.date);
  modalTitle.textContent = item.title;
  renderExplanation(item.explanation);

  const originalUrl = getArticleUrl(item);

  modalExternalLink.href = originalUrl || '#';
  modalExternalLink.textContent =
    item.media_type === 'video' ? 'Open original video article' : 'Open NASA article';
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
    const mediaUrl = getGalleryMediaUrl(item);
    if (!mediaUrl) {
      modalMedia.appendChild(createMediaFallback());
      return;
    }

    const image = document.createElement('img');
    image.src = mediaUrl;
    image.alt = item.alt || item.title;
    image.addEventListener('error', () => replaceMediaWithFallback(image), { once: true });
    modalMedia.appendChild(image);
    return;
  }

  const previewUrl = getGalleryMediaUrl(item);
  const articleUrl = getArticleUrl(item);

  const previewLink = document.createElement('a');
  previewLink.href = articleUrl || '#';
  previewLink.target = '_blank';
  previewLink.rel = 'noopener noreferrer';
  previewLink.className = 'video-preview-link';
  previewLink.dataset.hoverLabel = 'Watch Video';
  previewLink.setAttribute('aria-label', `Open video for ${item.title} in a new tab`);

  if (previewUrl) {
    const previewImage = document.createElement('img');
    previewImage.src = previewUrl;
    previewImage.alt = item.alt || `${item.title} video preview`;
    previewImage.addEventListener('error', () => replaceMediaWithFallback(previewImage), { once: true });
    previewLink.appendChild(previewImage);
  } else {
    previewLink.appendChild(createMediaFallback());
  }

  modalMedia.appendChild(previewLink);

  const note = document.createElement('p');
  note.className = 'video-note';
  note.textContent =
    'This APOD entry is a video. Click the preview or use the button below the description to open it in a new tab.';
  modalMedia.appendChild(note);
}

function getGalleryMediaUrl(item) {
  if (isUsableMediaUrl(item.hdurl)) {
    return normalizeUrl(item.hdurl);
  }

  return item.media_type === 'image' && isUsableMediaUrl(item.url)
    ? normalizeUrl(item.url)
    : '';
}

function getArticleUrl(item) {
  return isUsableMediaUrl(item.permalink)
    ? normalizeUrl(item.permalink)
    : isUsableMediaUrl(item.url)
      ? normalizeUrl(item.url)
      : '';
}

function isUsableMediaUrl(url) {
  try {
    const parsedUrl = new URL(normalizeUrl(url));
    return parsedUrl.protocol === 'https:' || parsedUrl.protocol === 'http:';
  } catch (error) {
    return false;
  }
}

function replaceMediaWithFallback(mediaElement) {
  mediaElement.replaceWith(createMediaFallback());
}

function createMediaFallback() {
  const fallback = document.createElement('div');
  fallback.className = 'video-space-fallback';
  fallback.setAttribute('role', 'img');
  fallback.setAttribute('aria-label', 'Image preview unavailable');

  const stars = document.createElement('div');
  stars.className = 'video-space-fallback__stars';
  stars.setAttribute('aria-hidden', 'true');

  const logo = document.createElement('img');
  logo.src = 'img/nasa-worm-logo.png';
  logo.alt = '';
  logo.className = 'video-space-fallback__logo';
  logo.setAttribute('aria-hidden', 'true');

  fallback.append(stars, logo);
  return fallback;
}

function renderExplanation(explanation) {
  modalExplanation.replaceChildren();

  const explanationHtml = String(explanation || '').replace(
    /^\s*(?:<[^>]+>\s*)*Explanation:\s*/i,
    ''
  );

  if (!explanationHtml.trim()) {
    modalExplanation.textContent = 'No explanation is available for this entry.';
    return;
  }

  const parsedExplanation = new DOMParser().parseFromString(explanationHtml, 'text/html');
  const fragment = document.createDocumentFragment();
  appendSafeExplanationNodes(parsedExplanation.body, fragment);
  modalExplanation.appendChild(fragment);
}

function appendSafeExplanationNodes(source, target) {
  source.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      target.appendChild(document.createTextNode(node.textContent));
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const tagName = node.tagName.toLowerCase();
    if (tagName === 'script' || tagName === 'style') return;

    if (tagName === 'a') {
      const link = document.createElement('a');
      const href = node.getAttribute('href') || '';
      if (isUsableMediaUrl(href)) {
        link.href = normalizeUrl(href);
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      }
      appendSafeExplanationNodes(node, link);
      target.appendChild(link);
      return;
    }

    const safeTags = ['p', 'br', 'strong', 'b', 'em', 'i'];
    if (!safeTags.includes(tagName)) {
      appendSafeExplanationNodes(node, target);
      return;
    }

    const safeElement = document.createElement(tagName === 'b' ? 'strong' : tagName === 'i' ? 'em' : tagName);
    appendSafeExplanationNodes(node, safeElement);
    target.appendChild(safeElement);
  });
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