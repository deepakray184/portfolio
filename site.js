const year = document.querySelector('#year');
if (year) year.textContent = String(new Date().getFullYear());

const header = document.querySelector('header');
const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('#main-navigation');

function setMenuOpen(open) {
  if (!menuButton || !nav) return;
  menuButton.setAttribute('aria-expanded', String(open));
  nav.classList.toggle('is-open', open);
  menuButton.querySelector('span').textContent = open ? 'Close' : 'Menu';
}

menuButton?.addEventListener('click', () => {
  setMenuOpen(menuButton.getAttribute('aria-expanded') !== 'true');
});

nav?.addEventListener('click', (event) => {
  if (event.target.closest('a')) setMenuOpen(false);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') setMenuOpen(false);
});

document.addEventListener('click', (event) => {
  if (nav?.classList.contains('is-open') && !header.contains(event.target)) setMenuOpen(false);
});

const progressBar = document.querySelector('.scroll-progress');
let progressFrame = 0;
function updateProgress() {
  if (!progressBar) return;
  cancelAnimationFrame(progressFrame);
  progressFrame = requestAnimationFrame(() => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
    progressBar.value = Math.round(Math.min(1, Math.max(0, progress)) * 100);
  });
}
window.addEventListener('scroll', updateProgress, { passive: true });
window.addEventListener('resize', updateProgress, { passive: true });
updateProgress();

const navLinks = [...document.querySelectorAll('.navlinks a[href^="#"]')];
if ('IntersectionObserver' in window) {
  const sectionObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      for (const link of navLinks) {
        if (link.getAttribute('href') === '#' + entry.target.id) {
          link.setAttribute('aria-current', 'location');
        } else {
          link.removeAttribute('aria-current');
        }
      }
    }
  }, { rootMargin: '-25% 0px -60% 0px', threshold: 0 });
  document.querySelectorAll('main section[id]').forEach((section) => sectionObserver.observe(section));
}

if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const revealItems = document.querySelectorAll('section .section-head, .cap, .job, .credential, .end-inner');
  revealItems.forEach((item) => item.setAttribute('data-reveal', ''));
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });
  revealItems.forEach((item) => revealObserver.observe(item));
}

const copyButton = document.querySelector('.copy-email');
const copyStatus = document.querySelector('#copy-status');
let copyResetTimer;
copyButton?.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(copyButton.dataset.email);
    copyButton.textContent = 'COPIED';
    copyButton.classList.add('is-copied');
    if (copyStatus) copyStatus.textContent = 'Email address copied.';
  } catch {
    copyButton.textContent = 'COPY NOT AVAILABLE';
    if (copyStatus) copyStatus.textContent = 'Copy isn’t available here. Use the Email Deepak button instead.';
  }
  window.clearTimeout(copyResetTimer);
  copyResetTimer = window.setTimeout(() => {
    copyButton.textContent = 'COPY EMAIL';
    copyButton.classList.remove('is-copied');
  }, 1800);
});
