
// ===== SCROLL PROGRESS BAR (injected on <html> to bypass body animation stacking context) =====
(function () {
  const bar = document.createElement('div');
  bar.id = 'scroll-progress';
  document.documentElement.appendChild(bar);
  function update() {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (total > 0 ? (window.scrollY / total) * 100 : 0) + '%';
  }
  document.addEventListener('scroll', update, { passive: true });
  update();
})();


// ===== CANVAS BACKGROUND =====
(function () {
  const canvas = document.getElementById('bg-canvas');
  const ctx = canvas.getContext('2d');
  let W, H, particles, shooters;

  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }

  function makeParticle() {
    return {
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.2 + 0.3,
      speedX: (Math.random() - 0.5) * 0.18,
      speedY: (Math.random() - 0.5) * 0.18,
      opacity: Math.random() * 0.35 + 0.15,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: Math.random() * 0.012 + 0.004,
    };
  }

  function makeShooting() {
    const angle = Math.PI / 6 + (Math.random() * Math.PI) / 8;
    const speed = Math.random() * 6 + 5;
    return {
      x: Math.random() * W * 0.7, y: Math.random() * H * 0.4,
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      len: Math.random() * 80 + 60, opacity: 1,
      fade: Math.random() * 0.018 + 0.012, alive: true,
    };
  }

  function init() { resize(); particles = Array.from({ length: 160 }, makeParticle); shooters = []; }

  let lastShot = 0;
  function draw(ts) {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      p.pulse += p.pulseSpeed;
      const alpha = p.opacity * (0.7 + 0.3 * Math.sin(p.pulse));
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(167,139,250,${alpha})`;
      ctx.fill();
      p.x += p.speedX; p.y += p.speedY;
      if (p.x < -2) p.x = W + 2; if (p.x > W + 2) p.x = -2;
      if (p.y < -2) p.y = H + 2; if (p.y > H + 2) p.y = -2;
    });
    if (ts - lastShot > 3200) { shooters.push(makeShooting()); lastShot = ts; }
    shooters = shooters.filter(s => s.alive);
    shooters.forEach(s => {
      const mag = Math.hypot(s.vx, s.vy);
      const tailX = s.x - s.vx * (s.len / mag);
      const tailY = s.y - s.vy * (s.len / mag);
      const grad = ctx.createLinearGradient(tailX, tailY, s.x, s.y);
      grad.addColorStop(0, `rgba(167,139,250,0)`);
      grad.addColorStop(1, `rgba(220,210,255,${s.opacity})`);
      ctx.beginPath(); ctx.moveTo(tailX, tailY); ctx.lineTo(s.x, s.y);
      ctx.strokeStyle = grad; ctx.lineWidth = 1.5; ctx.stroke();
      s.x += s.vx; s.y += s.vy; s.opacity -= s.fade;
      if (s.opacity <= 0 || s.x > W + 50 || s.y > H + 50) s.alive = false;
    });
    requestAnimationFrame(draw);
  }
  window.addEventListener('resize', resize);
  init(); requestAnimationFrame(draw);
})();


// ===== NAV SCROLL =====
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });


// ===== BACK TO TOP =====
const backToTop = document.getElementById('back-to-top');
window.addEventListener('scroll', () => {
  backToTop.classList.toggle('visible', window.scrollY > 500);
}, { passive: true });
backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));


// ===== MOBILE HAMBURGER — full-screen overlay =====
const hamburger   = document.getElementById('hamburger');
const navLinks    = document.getElementById('navLinks');
const mobileOverlay = document.getElementById('mobile-overlay');

function closeMenu() {
  navLinks.classList.remove('open');
  hamburger.classList.remove('open');
  mobileOverlay.classList.remove('open');
  hamburger.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}
hamburger.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  hamburger.classList.toggle('open', isOpen);
  mobileOverlay.classList.toggle('open', isOpen);
  hamburger.setAttribute('aria-expanded', isOpen);
  document.body.style.overflow = isOpen ? 'hidden' : '';
});
mobileOverlay.addEventListener('click', closeMenu);
navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));


// ===== TYPING ANIMATION =====
(function () {
  const phrases = [
    'Product Security Engineer',
    'Cloud Security Specialist',
    'AI-Driven Threat Detection',
    'CSPM & SIEM Expert',
  ];
  const el = document.getElementById('typed-title');
  let pi = 0, ci = 0, deleting = false;
  function type() {
    const phrase = phrases[pi];
    if (!deleting) {
      el.textContent = phrase.slice(0, ++ci);
      if (ci === phrase.length) { deleting = true; setTimeout(type, 1800); return; }
    } else {
      el.textContent = phrase.slice(0, --ci);
      if (ci === 0) { deleting = false; pi = (pi + 1) % phrases.length; }
    }
    setTimeout(type, deleting ? 42 : 78);
  }
  type();
})();


// ===== COUNT-UP ANIMATION =====
function countUp(el, target, suffix, duration) {
  const start = performance.now();
  function step(now) {
    const p    = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(target * ease) + suffix;
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function tryCountUp(card) {
  const el = card.querySelector('.stat-num');
  if (!el || el.dataset.counted) return;
  el.dataset.counted = '1';
  const raw      = el.dataset.raw || el.textContent.trim();
  el.dataset.raw = raw; // preserve original
  const match    = raw.match(/^([\d.]+)(.*)$/);
  if (!match) return;
  countUp(el, parseFloat(match[1]), match[2], 1600);
}


// ===== FADE-UP ON SCROLL =====
const fadeEls = document.querySelectorAll(
  '.about-grid, .stat-card, .timeline-item, .project-card, ' +
  '.skill-group, .achievement-card, .contact-grid, ' +
  '.education-card, .rec-card, .section-heading-wrap'
);
fadeEls.forEach(el => el.classList.add('fade-up'));
const fadeObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        const delay = i * 70;
        setTimeout(() => {
          entry.target.classList.add('visible');
          // If this is a stat card, start count-up after fade completes
          if (entry.target.classList.contains('stat-card')) {
            setTimeout(() => tryCountUp(entry.target), 300);
          }
        }, delay);
        fadeObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.07, rootMargin: '0px 0px -40px 0px' }
);
fadeEls.forEach(el => fadeObserver.observe(el));


// ===== ACTIVE NAV LINK (sliding indicator via class) =====
const sections   = document.querySelectorAll('section[id]');
const navAnchors = document.querySelectorAll('.nav-links a');
const sectionObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navAnchors.forEach(a => {
          a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id);
        });
      }
    });
  },
  { rootMargin: '-40% 0px -55% 0px' }
);
sections.forEach(s => sectionObserver.observe(s));


// ===== CONTACT FORM =====
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const name    = document.getElementById('senderName').value.trim();
    const email   = document.getElementById('senderEmail').value.trim();
    const message = document.getElementById('senderMessage').value.trim();
    const note    = document.getElementById('formNote');
    if (!name || !email || !message) return;
    const subject = encodeURIComponent(`Portfolio Contact from ${name}`);
    const body    = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
    window.location.href = `mailto:ahmetffkoc@gmail.com?subject=${subject}&body=${body}`;
    note.textContent = 'Opening your email client...';
    setTimeout(() => { note.textContent = ''; }, 4000);
  });
}


// ===== RECOMMENDATION READ MORE TOGGLE =====
document.querySelectorAll('.rec-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const text = btn.previousElementSibling;
    const expanded = text.classList.toggle('expanded');
    btn.textContent = expanded ? 'Show less' : 'Read more';
    btn.setAttribute('aria-expanded', expanded);
  });
});
