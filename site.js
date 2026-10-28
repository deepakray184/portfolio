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

const projectGrid = document.querySelector('#project-grid');
const projectCards = [...(projectGrid?.querySelectorAll('.project-card') ?? [])];
const projectSearch = document.querySelector('#project-search');
const projectCount = document.querySelector('#project-result-count');
const projectEmpty = document.querySelector('#project-empty');
let activeProjectFilter = 'all';

function filterProjects() {
  const query = projectSearch?.value.trim().toLowerCase() ?? '';
  let visible = 0;
  for (const card of projectCards) {
    const matchesFilter = activeProjectFilter === 'all' || card.dataset.category === activeProjectFilter;
    const matchesSearch = !query || `${card.dataset.search} ${card.innerText}`.toLowerCase().includes(query);
    const show = matchesFilter && matchesSearch;
    card.hidden = !show;
    if (show) visible += 1;
  }
  if (projectCount) projectCount.textContent = `Showing ${visible} of ${projectCards.length} projects`;
  if (projectEmpty) projectEmpty.hidden = visible !== 0;
}

document.querySelectorAll('.project-filter').forEach((button) => {
  button.addEventListener('click', () => {
    activeProjectFilter = button.dataset.filter ?? 'all';
    document.querySelectorAll('.project-filter').forEach((filter) => {
      const selected = filter === button;
      filter.classList.toggle('is-active', selected);
      filter.setAttribute('aria-pressed', String(selected));
    });
    filterProjects();
  });
});
projectSearch?.addEventListener('input', filterProjects);
document.addEventListener('keydown', (event) => {
  if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
  if (event.target instanceof HTMLElement && /INPUT|TEXTAREA|SELECT/.test(event.target.tagName)) return;
  if (!projectSearch) return;
  event.preventDefault();
  projectSearch.focus();
});
filterProjects();

const githubStatus = document.querySelector('#github-live-status');
const refreshGithub = document.querySelector('#refresh-github');
const relativeTime = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

function formatRelativeTime(value) {
  const seconds = Math.round((new Date(value).getTime() - Date.now()) / 1000);
  const units = [[60, 'second'], [60, 'minute'], [24, 'hour'], [30, 'day'], [12, 'month']];
  let amount = seconds;
  let unit = 'second';
  for (const [limit, nextUnit] of units) {
    if (Math.abs(amount) < limit) break;
    amount /= limit;
    unit = nextUnit;
  }
  return relativeTime.format(Math.round(amount), unit);
}

async function githubJson(path) {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: { Accept: 'application/vnd.github+json' },
    cache: 'no-store'
  });
  if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
  return response.json();
}

async function loadRecentRepoEvents(endpoint) {
  const since = Date.now() - 90 * 24 * 60 * 60 * 1000;
  const pushes = [];
  for (let page = 1; page <= 3; page += 1) {
    const events = await githubJson(`${endpoint}/events?per_page=100&page=${page}`);
    pushes.push(...events.filter((event) => event.type === 'PushEvent' && new Date(event.created_at).getTime() >= since));
    if (events.length < 100 || (events.length && new Date(events.at(-1).created_at).getTime() < since)) break;
  }
  return pushes.length;
}

async function loadProjectActivity(card) {
  const repo = encodeURIComponent(card.dataset.repo ?? '');
  const endpoint = `/repos/deepakray184/${repo}`;
  const [repository, openPulls, closedPulls, pushCount] = await Promise.all([
    githubJson(endpoint),
    githubJson(`${endpoint}/pulls?state=open&per_page=100`),
    githubJson(`${endpoint}/pulls?state=closed&per_page=100`),
    loadRecentRepoEvents(endpoint)
  ]);
  const writeStat = (name, value) => {
    const element = card.querySelector(`[data-stat="${name}"]`);
    if (element) element.textContent = value;
  };
  const mergedCount = closedPulls.filter((pull) => Boolean(pull.merged_at)).length;
  writeStat('stars', new Intl.NumberFormat().format(repository.stargazers_count));
  writeStat('forks', new Intl.NumberFormat().format(repository.forks_count));
  writeStat('open-prs', new Intl.NumberFormat().format(openPulls.length));
  writeStat('merged-prs', new Intl.NumberFormat().format(mergedCount));
  writeStat('pushes', new Intl.NumberFormat().format(pushCount));
  writeStat('last-push', repository.pushed_at ? `pushed ${formatRelativeTime(repository.pushed_at)}` : 'no pushes yet');
  return true;
}

async function refreshProjectActivity() {
  if (!projectCards.length || !refreshGithub) return;
  refreshGithub.disabled = true;
  if (githubStatus) githubStatus.textContent = 'Checking public repositories…';
  const results = await Promise.allSettled(projectCards.map(loadProjectActivity));
  const successes = results.filter((result) => result.status === 'fulfilled').length;
  if (githubStatus) {
    githubStatus.textContent = successes === projectCards.length
      ? `Live · updated ${new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
      : `${successes}/${projectCards.length} repos updated · open GitHub for details`;
  }
  refreshGithub.disabled = false;
}

refreshGithub?.addEventListener('click', refreshProjectActivity);
refreshProjectActivity();
