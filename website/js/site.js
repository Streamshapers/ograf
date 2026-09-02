// Header switches from transparent (over the dark hero) to a frosted-
// glass solid as soon as the user scrolls past the hero block.
const header = document.getElementById('site-header');
const heroBlock = document.querySelector('.hero-block');
const headerThreshold = () => {
  if (!heroBlock) return 8;
  // Trigger a touch before the hero ends so the header is already opaque
  // by the time it visually meets the next (light) section.
  return heroBlock.offsetHeight - 80;
};
const updateHeader = () => {
  header.classList.toggle('is-scrolled', window.scrollY > headerThreshold());
};
window.addEventListener('scroll', updateHeader, { passive: true });
window.addEventListener('resize', updateHeader);
updateHeader();

// Footer year
document.getElementById('footer-year').textContent = new Date().getFullYear();

// Mobile nav toggle
const toggle = document.getElementById('nav-toggle');
const nav    = document.getElementById('site-nav');
const mobileNavQuery = window.matchMedia('(max-width: 640px)');

function syncNavAccessibility() {
  const isMobile = mobileNavQuery.matches;
  const isOpen = nav.classList.contains('is-open');
  nav.setAttribute('aria-hidden', String(isMobile && !isOpen));
  nav.inert = isMobile && !isOpen;
}

function openNav() {
  nav.classList.add('is-open');
  header.classList.add('is-nav-open');
  toggle.setAttribute('aria-expanded', 'true');
  toggle.setAttribute('aria-label', 'Close navigation');
  document.body.style.overflow = 'hidden';
  syncNavAccessibility();
}

function closeNav() {
  nav.classList.remove('is-open');
  header.classList.remove('is-nav-open');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', 'Open navigation');
  document.body.style.overflow = '';
  syncNavAccessibility();
}

toggle.addEventListener('click', () => {
  toggle.getAttribute('aria-expanded') === 'true' ? closeNav() : openNav();
});

// Close on nav link click
nav.querySelectorAll('.site-nav__link').forEach(link => {
  link.addEventListener('click', closeNav);
});

// Close on Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') closeNav();
});

// Close nav when resizing back to desktop
window.addEventListener('resize', () => {
  if (window.innerWidth > 640) closeNav();
  syncNavAccessibility();
});
syncNavAccessibility();
