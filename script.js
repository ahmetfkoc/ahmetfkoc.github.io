
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


// ===== PARTICLE MESH NETWORK BACKGROUND =====
(function () {
  const canvas = document.getElementById('bg-canvas');
  // Move canvas to end of body so it paints after all sections in DOM order
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  let W, H, particles, dpr;
  const PARTICLE_COUNT = 90;
  const CONNECT_DIST = 150;
  const MOUSE_RADIUS = 180;
  const mouse = { x: -9999, y: -9999 };

  function resize() {
    dpr = window.devicePixelRatio || 1;
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function makeParticle() {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.2 + 0.4,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      opacity: Math.random() * 0.5 + 0.15,
    };
  }

  function init() {
    resize();
    particles = Array.from({ length: PARTICLE_COUNT }, makeParticle);
  }

  document.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
  document.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Update positions — gentle mouse attraction (not repulsion)
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const dx = mouse.x - p.x;
      const dy = mouse.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < MOUSE_RADIUS && dist > 1) {
        const pull = 0.008 * (1 - dist / MOUSE_RADIUS);
        p.vx += (dx / dist) * pull;
        p.vy += (dy / dist) * pull;
      }
      p.vx *= 0.99;
      p.vy *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < -5) p.x = W + 5;
      if (p.x > W + 5) p.x = -5;
      if (p.y < -5) p.y = H + 5;
      if (p.y > H + 5) p.y = -5;
    }

    // Draw connections — batch into single path per alpha range for performance
    ctx.lineCap = 'round';
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i], b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const distSq = dx * dx + dy * dy;
        if (distSq < CONNECT_DIST * CONNECT_DIST) {
          const dist = Math.sqrt(distSq);
          const alpha = (1 - dist / CONNECT_DIST) * 0.15;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(108,99,255,${alpha})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    // Mouse-to-particle connections — brighter accent lines
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const dx = p.x - mouse.x, dy = p.y - mouse.y;
      const distSq = dx * dx + dy * dy;
      if (distSq < MOUSE_RADIUS * MOUSE_RADIUS) {
        const dist = Math.sqrt(distSq);
        const alpha = (1 - dist / MOUSE_RADIUS) * 0.25;
        ctx.beginPath();
        ctx.moveTo(mouse.x, mouse.y);
        ctx.lineTo(p.x, p.y);
        ctx.strokeStyle = `rgba(167,139,250,${alpha})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }

    // Draw particles — crisp small dots
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const dx = p.x - mouse.x, dy = p.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const near = dist < MOUSE_RADIUS ? 1 + (1 - dist / MOUSE_RADIUS) * 1.5 : 1;
      const r = p.r * near;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(167,139,250,${p.opacity * near * 0.7})`;
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  init();
  requestAnimationFrame(draw);
})();


// ===== CURSOR TRAIL =====
(function () {
  const trail = [];
  const MAX = 16;
  let mx = -9999, my = -9999;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    trail.push({ x: mx, y: my, a: 0.35 });
    if (trail.length > MAX) trail.shift();
  });

  const c = document.createElement('canvas');
  c.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:3;pointer-events:none;';
  document.body.appendChild(c);
  const ctx = c.getContext('2d');
  let W, H, dpr;

  function resize() {
    dpr = window.devicePixelRatio || 1;
    W = window.innerWidth; H = window.innerHeight;
    c.width = W * dpr; c.height = H * dpr;
    c.style.width = W + 'px'; c.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  function draw() {
    ctx.clearRect(0, 0, W, H);
    for (let i = trail.length - 1; i >= 0; i--) {
      const p = trail[i];
      p.a -= 0.025;
      if (p.a <= 0) { trail.splice(i, 1); continue; }
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3 * p.a + 1, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(108,99,255,${p.a * 0.6})`;
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
})();


// ===== CLICK RIPPLE =====
(function () {
  const ripples = [];

  document.addEventListener('click', e => {
    ripples.push({ x: e.clientX, y: e.clientY, r: 0, a: 0.4 });
  });

  const c = document.createElement('canvas');
  c.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:4;pointer-events:none;';
  document.body.appendChild(c);
  const ctx = c.getContext('2d');
  let W, H, dpr;

  function resize() {
    dpr = window.devicePixelRatio || 1;
    W = window.innerWidth; H = window.innerHeight;
    c.width = W * dpr; c.height = H * dpr;
    c.style.width = W + 'px'; c.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  function draw() {
    ctx.clearRect(0, 0, W, H);
    for (let i = ripples.length - 1; i >= 0; i--) {
      const rip = ripples[i];
      rip.r += 1.8;
      rip.a -= 0.012;
      if (rip.a <= 0) { ripples.splice(i, 1); continue; }
      ctx.beginPath();
      ctx.arc(rip.x, rip.y, rip.r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(167,139,250,${rip.a})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
})();


// ===== 3D TILT + SPOTLIGHT ON CARDS, BUTTONS, HERO PHOTO =====
(function () {
  const TILT_MAX = 6;
  const cardSel = '.stat-card, .project-card, .achievement-card, .rec-card, .education-card, .blog-card';
  const btnSel = '.btn, .badge, .nav-links a, .contact-link, .project-live-btn, .project-gh-link, .blog-arrow, .skill-tags span';
  const photoSel = '.avatar-ring';

  // Cards — full 3D tilt + spotlight
  document.querySelectorAll(cardSel).forEach(el => {
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      const cx = r.width / 2, cy = r.height / 2;
      const ry = ((x - cx) / cx) * TILT_MAX;
      const rx = ((cy - y) / cy) * TILT_MAX;
      el.style.transform = `perspective(600px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
      el.style.background = `radial-gradient(circle at ${(x/r.width)*100}% ${(y/r.height)*100}%, rgba(108,99,255,0.07) 0%, rgba(255,255,255,0.03) 50%)`;
    });
    el.addEventListener('mouseleave', () => { el.style.transform = ''; el.style.background = ''; });
  });

  // Buttons — subtle scale + glow
  document.querySelectorAll(btnSel).forEach(el => {
    el.addEventListener('mouseenter', () => {
      el.style.boxShadow = '0 0 16px rgba(108,99,255,0.2), 0 4px 12px rgba(108,99,255,0.1)';
    });
    el.addEventListener('mouseleave', () => { el.style.boxShadow = ''; });
  });

  // Hero photo — 3D tilt
  document.querySelectorAll(photoSel).forEach(el => {
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      const cx = r.width / 2, cy = r.height / 2;
      const ry = ((x - cx) / cx) * 10;
      const rx = ((cy - y) / cy) * 10;
      el.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    });
    el.addEventListener('mouseleave', () => { el.style.transform = ''; });
  });
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
  '.education-card, .rec-card, .section-heading-wrap, ' +
  '.blog-scroll-wrapper, .blog-scroll-hint'
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


// ===== BLOG DATA =====
const BLOG_POSTS = [
  {
    id: 1,
    title: "The Cracks in MFA: Why We Must Rethink Authentication Now",
    date: "January 21, 2025",
    tag: "identity",
    tagLabel: "Identity",
    readTime: "5 min read",
    emoji: "🔐",
    img: "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=600&q=80",
    excerpt: "MFA was supposed to be the silver bullet. It turns out attackers already found the cracks — and they're exploiting them at scale with AI-powered phishing toolkits.",
    content: `
      <p>Multi-factor authentication has been the go-to recommendation for years. Add a second layer, and you're safe — that's been the promise. But in 2025, that promise has some serious cracks in it, and if you're still treating MFA as your final line of defense, it's time to rethink that strategy.</p>

      <h3>The Adversary-in-the-Middle Problem</h3>
      <p>Phishing toolkits like <strong>W3LL Panel</strong> have evolved beyond simple credential harvesting. They now act as real-time proxies, sitting between the victim and the legitimate service. When a user enters their credentials and completes their MFA prompt, the toolkit captures the authenticated session token — completely bypassing the second factor. Microsoft 365 accounts have been hit hard by this.</p>

      <h3>Generative AI Made Phishing Scary Good</h3>
      <p>The old tells are gone. Typos, awkward phrasing, generic greetings — attackers are using generative AI to craft emails that read like they came from your actual manager. When the phishing email looks real, users are far more likely to complete that suspicious MFA prompt without questioning it.</p>

      <h3>Prompt Fatigue Is Real</h3>
      <p>MFA fatigue attacks — where attackers spam authentication requests until a tired or distracted user just taps "Approve" — are well-documented now. We saw it with Uber's breach. A contractor received repeated push notifications at 1AM and eventually approved one. Simple, brutal, effective.</p>

      <div class="highlight-box">
        <strong>The uncomfortable truth:</strong> MFA doesn't verify intent. It verifies presence. If an attacker can get you to confirm a prompt you didn't initiate, your second factor just became their access pass.
      </div>

      <h3>What Actually Helps</h3>
      <ul>
        <li><strong>FIDO2 hardware tokens</strong> — phishing-resistant by design. The cryptographic handshake is domain-bound, so even a perfect phishing clone can't capture it.</li>
        <li><strong>Zero Trust architecture</strong> — assume breach, verify every request continuously, not just at login.</li>
        <li><strong>Number matching on push notifications</strong> — Microsoft Authenticator now supports this. Forces the user to type a displayed number rather than just tapping approve.</li>
        <li><strong>Anomaly detection on session tokens</strong> — if a valid session suddenly appears from a different country or IP range, flag it immediately.</li>
        <li><strong>User education that's actually honest</strong> — stop telling people MFA makes them safe. Tell them what it doesn't protect against.</li>
      </ul>

      <h3>My Take</h3>
      <p>From my work monitoring cloud security posture at Toshiba, the organizations that stay protected aren't the ones with the most security tools — they're the ones that understand the gaps in each tool and layer accordingly. MFA is still valuable. But it's a layer, not a fortress. Treat it that way.</p>
    `
  },
  {
    id: 2,
    title: "CISA's New Security Requirements: What It Means for Cloud Teams",
    date: "February 18, 2025",
    tag: "grc",
    tagLabel: "GRC",
    readTime: "4 min read",
    emoji: "🏛️",
    img: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&q=80",
    excerpt: "CISA's framework under Executive Order 14117 isn't just a government problem. If you run cloud infrastructure, these four pillars should already be on your roadmap.",
    content: `
      <p>When CISA drops new security requirements, it's easy to mentally file them under "government stuff" and move on. That would be a mistake. The framework released under Executive Order 14117 outlines principles that any cloud security team should be thinking about — especially if you work in regulated industries or handle sensitive data at scale.</p>

      <h3>The Four Pillars</h3>
      <p>CISA's framework is built around four core areas:</p>
      <ul>
        <li><strong>Vulnerability management improvements</strong> — faster identification and remediation cycles, not just scanning on a schedule</li>
        <li><strong>Stricter MFA protocols</strong> — phishing-resistant MFA becoming the standard, not optional</li>
        <li><strong>Device connection restrictions</strong> — limiting which endpoints can touch sensitive systems</li>
        <li><strong>Enhanced encryption standards</strong> — data in transit and at rest, with modernized cipher requirements</li>
      </ul>

      <h3>Why This Matters for Cloud Teams Specifically</h3>
      <p>Cloud environments are where most of these four pillars get violated most often. Misconfigured storage buckets. Overprivileged service accounts. Legacy API endpoints still using TLS 1.0. I've seen all of these in real enterprise environments — and so has CISA. The executive order is a direct response to adversarial nation-state targeting of U.S. government infrastructure, but the attack patterns don't stop at government networks.</p>

      <div class="highlight-box">
        The threat actors CISA is targeting — China, Russia, North Korea, Iran — don't distinguish between a federal agency and a defense contractor's cloud tenant. If you're a target, you're a target.
      </div>

      <h3>What Cloud Teams Should Do Now</h3>
      <ul>
        <li>Map your current controls against each of the four pillars — identify gaps before an audit does</li>
        <li>Enable Defender for Cloud's regulatory compliance dashboards if you're on Azure — CIS and NIST alignment is built in</li>
        <li>Push phishing-resistant MFA to all admin accounts immediately, not just standard users</li>
        <li>Review device compliance policies — are all devices touching your cloud tenant enrolled and verified?</li>
      </ul>

      <p>CISA asked for public feedback before finalizing. That's a rare opportunity to see where standards are heading. The organizations that adapt early won't be scrambling when compliance becomes mandatory.</p>
    `
  },
  {
    id: 3,
    title: "Scattered Spider and the Social Engineering Playbook",
    date: "March 18, 2025",
    tag: "threat",
    tagLabel: "Threat Intel",
    readTime: "4 min read",
    emoji: "🕷️",
    img: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&q=80",
    excerpt: "Five members of Scattered Spider just got prosecuted. Their tactics — SIM swapping, vishing, MFA bypasses — didn't require any zero-days. Just social engineering done extremely well.",
    content: `
      <p>The arrest and prosecution of five Scattered Spider members is being called a landmark moment in cybersecurity enforcement. And it is — but what makes the case truly important isn't the legal outcome. It's what their playbook reveals about how easily social engineering scales into enterprise-level breaches.</p>

      <h3>Who They Targeted and How</h3>
      <p>Scattered Spider went after major corporations — MGM Resorts, Caesars Entertainment, and others — using a combination of <strong>SIM swapping</strong>, <strong>vishing (voice phishing)</strong>, and <strong>helpdesk social engineering</strong>. No zero-days needed. No sophisticated malware at the entry point. Just phone calls.</p>
      <p>They'd call IT helpdesks pretending to be employees, claim they'd lost access to their accounts, and walk through standard account recovery. Once inside, they moved fast — lateral movement, privilege escalation, ransomware deployment.</p>

      <h3>The Helpdesk Problem Nobody Wants to Talk About</h3>
      <p>Your helpdesk is a security boundary. Most organizations treat it like a convenience desk. The authentication procedures for account recovery are often the weakest link in an otherwise well-hardened environment. Scattered Spider knew this and exploited it repeatedly.</p>

      <div class="highlight-box">
        When MGM's breach was later investigated, the initial access took about 10 minutes of social engineering. The cleanup took weeks and cost hundreds of millions.
      </div>

      <h3>What This Should Change</h3>
      <ul>
        <li><strong>Callback verification</strong> — when someone calls your helpdesk claiming to be an employee, call them back on a number you have on file, not the one they gave you</li>
        <li><strong>Out-of-band identity verification</strong> — manager approval, video verification for high-privilege account resets</li>
        <li><strong>Zero-trust for account recovery</strong> — treat every recovery request as potentially adversarial, regardless of how convincing the caller sounds</li>
        <li><strong>SIM swap protections</strong> — work with your telecom provider to add account PINs and port freeze options for executive accounts</li>
      </ul>

      <p>The prosecution is a good sign — cybercrime has consequences now, finally. But the lesson isn't "attackers will get caught." The lesson is that billion-dollar enterprises were breached with phone calls. Fix your helpdesk.</p>
    `
  },
  {
    id: 4,
    title: "RedLine InfoStealer Takedown: What the Operation Reveals",
    date: "April 15, 2025",
    tag: "threat",
    tagLabel: "Threat Intel",
    readTime: "4 min read",
    emoji: "🚨",
    img: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&q=80",
    excerpt: "Law enforcement seized the RedLine InfoStealer infrastructure. Good news — but the ecosystem that spawned it is very much alive. Here's what it actually stole and why it matters.",
    content: `
      <p>International law enforcement took down the RedLine InfoStealer operation in late 2024, and it was a meaningful win. But like most malware takedowns, it doesn't mean the threat is gone — it means one specific infrastructure is gone. The tactics, the code forks, and the criminal marketplace that distributed it all still exist.</p>

      <h3>What RedLine Actually Did</h3>
      <p>RedLine was a <strong>Malware-as-a-Service</strong> offering sold on criminal forums. For a few hundred dollars a month, threat actors got access to a fully-featured stealer that targeted:</p>
      <ul>
        <li>Browser credentials — saved passwords, autofill data, cookies</li>
        <li>Credit card data stored in browsers</li>
        <li>Cryptocurrency wallet files and seed phrases</li>
        <li>FTP and VPN credentials</li>
        <li>Session tokens that bypass MFA</li>
      </ul>
      <p>It was distributed primarily through phishing emails and malicious software downloads — fake game cracks, pirated software, fake AI tools. Once installed, it would silently harvest everything and phone home.</p>

      <h3>The Session Token Problem</h3>
      <p>The most dangerous capability RedLine had wasn't credential theft — it was <strong>session token theft</strong>. By stealing authenticated browser cookies, attackers could hijack active sessions without ever needing a password or MFA code. This is why "log out everywhere" matters, and why token lifetime policies in Azure AD and similar platforms need to be configured tightly.</p>

      <div class="highlight-box">
        Browser-stored credentials are a goldmine for attackers. If your organization allows employees to save corporate credentials in personal browser profiles, you have a problem.
      </div>

      <h3>Defensive Steps That Actually Matter</h3>
      <ul>
        <li>Enforce managed device policies — corporate credentials should only exist on enrolled, compliant devices</li>
        <li>Configure short session token lifetimes for sensitive applications</li>
        <li>Deploy CrowdStrike or equivalent EDR with behavioral detection — signature-based AV won't catch these consistently</li>
        <li>Enable Conditional Access policies to flag sign-ins from unexpected locations or devices</li>
        <li>Regular dark web monitoring for leaked credentials from your domain</li>
      </ul>

      <p>The RedLine takedown is good news. But if your defenses only worked against RedLine specifically and not the class of threat it represents, you're not actually more secure today than you were yesterday.</p>
    `
  },
  {
    id: 5,
    title: "HiatusRAT and the IoT Security Problem We Keep Ignoring",
    date: "May 20, 2025",
    tag: "threat",
    tagLabel: "Threat Intel",
    readTime: "3 min read",
    emoji: "📷",
    img: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80",
    excerpt: "The FBI warned about HiatusRAT targeting IP cameras and DVRs. These devices sit on corporate networks, often forgotten, and attackers know exactly where to look.",
    content: `
      <p>The FBI's alert about HiatusRAT targeting IoT devices — specifically web cameras and DVRs — is a reminder of something enterprise security teams consistently underestimate: the devices that don't run your standard security stack are often the easiest way in.</p>

      <h3>What HiatusRAT Targets</h3>
      <p>The malware specifically targets older Chinese-manufactured surveillance equipment from brands like <strong>Hikvision</strong> and <strong>Xiongmai</strong>. These devices are everywhere — office lobbies, warehouses, parking structures, data centers. They're often deployed and then forgotten about, running the same firmware from 2017.</p>
      <p>HiatusRAT exploits two known CVEs (<strong>CVE-2017-7921</strong> and <strong>CVE-2018-9995</strong>) alongside default or weak credentials. It scans for exposed ports — 23 (Telnet), 26, 554 (RTSP), and 8080 — and once in, establishes persistence and lateral movement capability.</p>

      <h3>Why This Is an Enterprise Problem</h3>
      <p>IoT devices on corporate networks often sit on the same flat network segment as workstations or servers. A compromised camera becomes a pivot point. From there, an attacker with patience can map the internal network, intercept traffic, and work toward higher-value targets.</p>

      <div class="highlight-box">
        You can have a perfect Azure security posture and a zero-trust policy for all your cloud workloads — and still get breached through a forgotten DVR in the break room.
      </div>

      <h3>How to Actually Fix This</h3>
      <ul>
        <li><strong>Network segmentation</strong> — IoT devices should be on isolated VLANs with no path to corporate systems without explicit firewall rules</li>
        <li><strong>Firmware audits</strong> — catalog every IoT device on the network, check firmware versions, and establish a patch process even for "dumb" devices</li>
        <li><strong>Default credential sweep</strong> — scan for devices still running default credentials using internal tools or a legitimate network scanner</li>
        <li><strong>Disable unnecessary services</strong> — Telnet should be off on every device. Period.</li>
        <li><strong>Replace end-of-life hardware</strong> — if the vendor isn't releasing security updates, the device needs to go</li>
      </ul>

      <p>The irony of HiatusRAT is that the cameras meant to protect physical security become the hole in your digital security. Don't let the perimeter you built in the cloud get undermined by hardware you forgot was even there.</p>
    `
  },
  {
    id: 6,
    title: "Fake AI Tools Are the New Malware Delivery Mechanism",
    date: "June 17, 2025",
    tag: "ai",
    tagLabel: "AI Security",
    readTime: "4 min read",
    emoji: "🤖",
    img: "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=600&q=80",
    excerpt: "Fake AI video generators distributing Lumma and Amos infostealers are hitting Windows and macOS. The lure is the hype. The payload is credential theft.",
    content: `
      <p>The AI hype cycle has created a perfect delivery mechanism for malware: fake AI tools. People are actively searching for AI video generators, image enhancers, and productivity tools — and attackers are building convincing fake versions that install infostealers instead of doing anything useful.</p>

      <h3>The Attack Pattern</h3>
      <p>The campaign uses platforms like social media ads, YouTube thumbnails, and fake landing pages to promote AI tools that don't exist. When users download and run the installer, they get one of two infostealers depending on their platform:</p>
      <ul>
        <li><strong>Lumma Stealer</strong> on Windows — targets browser credentials, session cookies, cryptocurrency wallets, and stored passwords</li>
        <li><strong>Amos (ATOMIC) Stealer</strong> on macOS — same targets, but specifically engineered to bypass macOS security prompts and keychain protections</li>
      </ul>
      <p>Once executed, the malware harvests everything, packages it into an encrypted archive, and exfiltrates it to attacker-controlled infrastructure — often within minutes of installation.</p>

      <h3>Why macOS Users Are Especially at Risk Right Now</h3>
      <p>There's a persistent belief that Macs don't get malware. That belief is wrong in 2025, and attackers know it. macOS users tend to have lower security tool coverage — no EDR, no endpoint policy enforcement — making them easier targets. The AMOS stealer specifically targets Safari keychain data, which can contain years of saved credentials.</p>

      <div class="highlight-box">
        The fake AI tool vector is effective because users who are excited about a new capability are less likely to pause and verify authenticity before clicking download.
      </div>

      <h3>Defensive Measures</h3>
      <ul>
        <li><strong>Only download from official sources</strong> — vendor websites, official GitHub repos, verified app stores</li>
        <li><strong>Check the publisher</strong> — legitimate AI tools from established companies have verifiable publisher signatures on their installers</li>
        <li><strong>Deploy EDR on macOS endpoints</strong> — CrowdStrike Falcon and Microsoft Defender for Endpoint both have macOS agents now</li>
        <li><strong>Browser credential storage policy</strong> — consider a password manager like 1Password for teams instead of browser-native credential storage</li>
        <li><strong>User awareness training</strong> — specifically covering the fake AI tool threat vector, not just generic phishing</li>
      </ul>

      <p>The AI boom is not slowing down, which means this attack surface isn't either. Every time a new AI capability generates buzz — video generation, voice cloning, code assistants — expect a wave of fake versions designed to steal credentials from people who are too excited to be skeptical.</p>
    `
  },
  {
    id: 7,
    title: "Helldown Ransomware: When Your VPN Is the Vulnerability",
    date: "July 15, 2025",
    tag: "threat",
    tagLabel: "Threat Intel",
    readTime: "4 min read",
    emoji: "🔓",
    img: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&q=80",
    excerpt: "Helldown ransomware is exploiting Zyxel VPN firewall vulnerabilities to walk right through the front door. Your VPN concentrator might be your biggest exposure.",
    content: `
      <p>Helldown ransomware first appeared in mid-2023, but it's been escalating in 2025 with a specific focus on exploiting Zyxel VPN firewall vulnerabilities. What makes it particularly dangerous isn't its encryption routine — it's the entry point. The VPN, the thing you deployed to protect remote access, is the vulnerability.</p>

      <h3>The Attack Chain</h3>
      <p>Helldown operators follow a fairly predictable playbook once they identify a vulnerable Zyxel device:</p>
      <ul>
        <li><strong>Initial access</strong> — exploit unpatched Zyxel VPN firewall vulnerabilities or brute-force VPN credentials through phishing</li>
        <li><strong>Privilege escalation</strong> — move from VPN access to domain credentials using harvested tokens or credential dumping</li>
        <li><strong>Lateral movement</strong> — spread across the internal network while remaining under the radar</li>
        <li><strong>Data exfiltration</strong> — steal sensitive data before encryption for double-extortion leverage</li>
        <li><strong>Encryption</strong> — deploy ransomware payload and demand payment</li>
      </ul>

      <h3>The Broader VPN Security Problem</h3>
      <p>Zyxel isn't uniquely vulnerable — Fortinet, Ivanti, Pulse Secure, and Cisco have all had critical VPN vulnerabilities exploited in real-world ransomware campaigns. The pattern is consistent: VPN appliances sit on the network perimeter, they're often under-patched, and a successful exploit gives attackers immediate internal network access.</p>

      <div class="highlight-box">
        VPN concentrators are high-value targets because exploiting one bypasses your entire perimeter security stack in a single step. Patch lag on network appliances is one of the most dangerous gaps in enterprise security.
      </div>

      <h3>What to Do About It</h3>
      <ul>
        <li><strong>Patch aggressively and immediately</strong> — VPN appliances should be on a 24-48 hour critical patch cycle, not your standard 30-day window</li>
        <li><strong>Enable MFA on VPN authentication</strong> — even a compromised credential is useless without the second factor</li>
        <li><strong>Monitor for anomalous VPN logins</strong> — unusual times, unusual source countries, unusual session durations are all red flags</li>
        <li><strong>Consider moving toward Zero Trust Network Access (ZTNA)</strong> — replaces VPN with identity-aware, least-privilege access controls</li>
        <li><strong>Maintain offline backups</strong> — when ransomware hits, your recovery timeline depends entirely on how good your backups are</li>
      </ul>

      <p>The hard truth is that most ransomware groups aren't finding novel zero-days. They're scanning for known vulnerabilities on unpatched devices. Helldown is no exception. The best defense is boring but effective: patch on time, every time.</p>
    `
  },
  {
    id: 8,
    title: "QR Code Phishing Bypassed 1.6 Million Email Security Controls",
    date: "August 19, 2025",
    tag: "threat",
    tagLabel: "Threat Intel",
    readTime: "4 min read",
    emoji: "📱",
    img: "https://images.unsplash.com/photo-1624996379697-f01d168b1a52?w=600&q=80",
    excerpt: "A quishing campaign hit 1.6 million emails — bypassing SPF, DKIM, and DMARC by embedding malicious QR codes in image attachments. Email security filters didn't see it coming.",
    content: `
      <p>A sophisticated "quishing" (QR code phishing) campaign recently bypassed major email security controls at scale — 1.6 million emails across multiple organizations, slipping past SPF, DKIM, and DMARC enforcement. The vector was simple and effective: malicious QR codes embedded in image attachments, not URLs in the email body.</p>

      <h3>Why Email Security Filters Missed It</h3>
      <p>Modern email security tools scan URLs in email bodies and attachments. They check reputation databases, sandbox suspicious links, and enforce authentication headers. But a QR code is just an image — the malicious URL is encoded visually, not as text. Most email security tools weren't extracting and analyzing the URL inside the QR code image.</p>

      <p>Because the emails also passed SPF, DKIM, and DMARC (often sent from compromised or legitimate-looking relay infrastructure), they landed in inboxes with full trust signals intact. No spam flag. No warning banner.</p>

      <h3>The Phishing Flow</h3>
      <ul>
        <li>Victim receives email with legitimate-looking QR code in an image attachment</li>
        <li>Email passes all authentication checks — no red flags from the security stack</li>
        <li>Victim scans the QR code with their phone — a device typically not under corporate MDM or security monitoring</li>
        <li>Phone browser is redirected to a convincing credential harvesting page</li>
        <li>Credentials captured, session tokens stolen</li>
      </ul>

      <div class="highlight-box">
        The phone is the weak link. When someone scans a QR code with their personal device, it exits your corporate security envelope entirely. No EDR, no proxy inspection, no conditional access — just an open browser.
      </div>

      <h3>Defenses Against Quishing</h3>
      <ul>
        <li><strong>Email security with QR code analysis</strong> — vendors like Proofpoint and Microsoft Defender for Office 365 have added QR code URL extraction. Make sure it's enabled.</li>
        <li><strong>User awareness training specifically on QR codes</strong> — most security awareness programs don't cover this vector yet</li>
        <li><strong>Mobile Device Management (MDM)</strong> — ensure corporate email is accessed only on enrolled devices where you have some visibility</li>
        <li><strong>Conditional Access policies</strong> — require compliant devices for accessing corporate resources, even from mobile</li>
        <li><strong>Never scan QR codes in unsolicited emails</strong> — teach this rule explicitly, it's the single best mitigation</li>
      </ul>

      <p>Quishing works because it exploits the gap between corporate email security and personal mobile devices. Until organizations close that gap with better mobile security controls and user awareness, this attack vector will keep growing.</p>
    `
  },
  {
    id: 9,
    title: "Agentic AI in Security: The Promise and the New Attack Surface",
    date: "September 16, 2025",
    tag: "ai",
    tagLabel: "AI Security",
    readTime: "5 min read",
    emoji: "🧠",
    img: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600&q=80",
    excerpt: "AI agents are being deployed across security operations — threat classification, alert triage, automated response. But autonomous AI systems also introduce new attack surfaces that most teams aren't thinking about yet.",
    content: `
      <p>Agentic AI — autonomous AI systems that can plan, execute, and chain actions without continuous human supervision — is moving from research into production security environments. I've worked on building these systems at Toshiba, and the efficiency gains are real. But so are the new risks they introduce.</p>

      <h3>What Agentic AI Is Actually Doing in Security Today</h3>
      <p>The practical deployments I've seen and worked with fall into a few categories:</p>
      <ul>
        <li><strong>Alert triage and classification</strong> — AI agents ingesting SIEM alerts, classifying severity, and routing them to analysts or automated playbooks</li>
        <li><strong>Threat intelligence correlation</strong> — agents pulling from multiple threat feeds and correlating IOCs against internal telemetry automatically</li>
        <li><strong>Cloud resource exposure detection</strong> — agents continuously scanning cloud configurations and flagging deviations from security baselines</li>
        <li><strong>Automated response actions</strong> — isolating endpoints, revoking tokens, or blocking IPs based on confirmed threat signals</li>
      </ul>

      <h3>The New Attack Surface Nobody Is Talking About</h3>
      <p>When you give an AI agent access to take actions — query APIs, send alerts, modify configurations — you've created a new kind of attack surface: <strong>prompt injection</strong>. An attacker who can influence the data an agent processes can potentially influence the actions it takes.</p>

      <p>Imagine a threat intelligence agent that ingests external feeds. An attacker who controls a malicious domain could craft a payload in a honeypot response designed to manipulate the agent's behavior — causing it to whitelist attacker-controlled infrastructure, suppress legitimate alerts, or generate false positive noise that buries real threats.</p>

      <div class="highlight-box">
        Prompt injection in agentic systems is to AI what SQL injection was to web applications in the early 2000s. We're at the stage where developers are building powerful functionality without fully understanding the injection attack surface.
      </div>

      <h3>How to Build Secure Agentic AI Systems</h3>
      <ul>
        <li><strong>Least privilege for agents</strong> — an agent that only needs to read logs should not have write access to security configurations</li>
        <li><strong>Human-in-the-loop for high-impact actions</strong> — automated triage is fine; automated remediation on production systems should require human approval</li>
        <li><strong>Input validation and sanitization</strong> — treat all external data that an agent ingests as potentially adversarial</li>
        <li><strong>Audit logging on agent actions</strong> — every action an AI agent takes should be logged with full context for forensic review</li>
        <li><strong>Regular red-teaming of agent workflows</strong> — test your agents the same way you test other software: try to break them</li>
      </ul>

      <p>The efficiency gains from agentic AI in security are too significant to ignore. But deploying autonomous systems with security-relevant permissions without understanding the attack surface is exactly the kind of move that creates the next generation of breaches. Build it — but build it carefully.</p>
    `
  },
  {
    id: 10,
    title: "Cloud Misconfiguration Is Still the #1 Breach Vector — Here's Why It Keeps Happening",
    date: "October 21, 2025",
    tag: "cloud",
    tagLabel: "Cloud Security",
    readTime: "5 min read",
    emoji: "☁️",
    img: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=600&q=80",
    excerpt: "Year after year, cloud misconfiguration tops the breach cause list. After remediating 100+ misconfigurations at enterprise scale, I have some thoughts on why it keeps happening and what actually fixes it.",
    content: `
      <p>Cloud misconfiguration has been the number one cause of cloud breaches for several years running. Every major cloud security report — Verizon DBIR, IBM Cost of a Data Breach, CrowdStrike Global Threat Report — says the same thing. And yet, organizations keep getting breached the same way. After spending the past year remediating misconfigurations across enterprise Azure environments, I want to talk about why this keeps happening and what the real fixes look like.</p>

      <h3>Why Misconfigurations Are Persistent</h3>
      <p>The easy answer is "developers move fast and security moves slow." But it's more specific than that:</p>
      <ul>
        <li><strong>Default configurations are insecure by design</strong> — Azure storage accounts are public by default in some SDK configurations. Developers use defaults because defaults are easy.</li>
        <li><strong>IAM sprawl</strong> — over-permissioned service accounts accumulate over months of feature work. Nobody audits them until something goes wrong.</li>
        <li><strong>Security debt compounds</strong> — a misconfiguration from 18 months ago that nobody noticed is 18 months closer to being exploited.</li>
        <li><strong>Lack of ownership</strong> — "who owns the security configuration of this S3 bucket?" is a surprisingly hard question in many organizations.</li>
      </ul>

      <h3>What Actually Happened When We Fixed 100+ Misconfigurations</h3>
      <p>At Toshiba, we improved cloud security posture by 35% in six months. Here's what the breakdown actually looked like:</p>
      <ul>
        <li>~40% were storage and blob access issues — public access enabled where it shouldn't be</li>
        <li>~25% were IAM issues — overprivileged service principals, orphaned accounts with active credentials</li>
        <li>~20% were network security group gaps — ports open to the internet that shouldn't be</li>
        <li>~15% were logging and monitoring gaps — resources with diagnostics disabled</li>
      </ul>

      <div class="highlight-box">
        The most dangerous misconfigurations aren't always the most visible ones. An orphaned service account with Contributor-level permissions sitting idle for two years is a ticking clock.
      </div>

      <h3>What Actually Works</h3>
      <ul>
        <li><strong>CSPM tooling with continuous scanning</strong> — Defender for Cloud, Wiz, or Prisma Cloud running continuous assessments, not quarterly reviews</li>
        <li><strong>Policy-as-Code</strong> — Azure Policy or AWS Config rules that prevent misconfigurations from being deployed, not just detected after the fact</li>
        <li><strong>CIS Benchmark alignment as a baseline</strong> — gives you a measurable, standardized starting point</li>
        <li><strong>Developer security training on cloud services specifically</strong> — generic security awareness doesn't cover "what happens when you check this box in the Azure portal"</li>
        <li><strong>Remediation SLAs by severity</strong> — critical findings get 24 hours, high gets 7 days. Without SLAs, findings sit in a backlog forever.</li>
      </ul>

      <p>Misconfiguration will keep topping breach reports as long as speed is prioritized over security in cloud deployments. The organizations that break the cycle aren't the ones with the most tools — they're the ones that made security a property of deployment, not an afterthought after it.</p>
    `
  },
  {
    id: 11,
    title: "FIRESTARTER Malware: Why Patching Isn't Enough",
    date: "November 18, 2025",
    tag: "threat",
    tagLabel: "Threat Intel",
    readTime: "3 min read",
    emoji: "🔥",
    img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
    excerpt: "FIRESTARTER malware persisted on Cisco devices even after patches were applied. This breaks a foundational assumption in security operations: that patching removes the threat.",
    content: `
      <p>The discovery that FIRESTARTER malware remained functional on Cisco network devices even after security patches were applied shook some foundational assumptions in vulnerability management. The core assumption — patch the CVE, eliminate the threat — turns out to be wrong when an attacker has already established persistent access before the patch.</p>

      <h3>What FIRESTARTER Did</h3>
      <p>FIRESTARTER is a bootkit-style malware that targets Cisco IOS XE devices. It achieves persistence by modifying the device's firmware or configuration in a way that survives a standard software update. When administrators patched the vulnerability that allowed initial access, the malware was already embedded at a layer below where the patch operated.</p>

      <p>This isn't entirely novel — similar persistence has been seen on routers and network appliances from other vendors. But the scale of Cisco IOS XE deployment made the FIRESTARTER campaign particularly significant.</p>

      <h3>The Broken Assumption</h3>
      <p>Most vulnerability management programs operate on a linear model: detect CVE → apply patch → threat eliminated. FIRESTARTER breaks step three. If an attacker exploited the vulnerability during the window between disclosure and patching — which is often days to weeks — patching alone doesn't clean the infection.</p>

      <div class="highlight-box">
        Patching closes the door. It doesn't evict the attacker who already walked through it. Post-patch verification is not optional — it's part of the remediation.
      </div>

      <h3>What Remediation Actually Requires</h3>
      <ul>
        <li><strong>Post-patch integrity verification</strong> — use Cisco's provided verification tools or equivalent to confirm device firmware integrity after patching</li>
        <li><strong>Check for indicators of compromise before patching</strong> — if the device was already exploited, you need to know before you assume patching fixed everything</li>
        <li><strong>Network device monitoring</strong> — most organizations have excellent endpoint telemetry and poor network device telemetry. This needs to change.</li>
        <li><strong>Factory reset in confirmed compromise cases</strong> — sometimes the only clean remediation is a full wipe and reconfiguration from known-good state</li>
        <li><strong>Configuration backups from before compromise</strong> — you can't restore to a clean state if all your backups postdate the compromise</li>
      </ul>

      <p>The FIRESTARTER campaign is a wake-up call for network security. Patch your network devices — immediately and urgently. But verify the patch actually eliminated the threat, not just the vulnerability.</p>
    `
  },
  {
    id: 12,
    title: "Ransomware Economics in the Age of AI: What the Forum Leaks Tell Us",
    date: "December 16, 2025",
    tag: "ai",
    tagLabel: "AI Security",
    readTime: "4 min read",
    emoji: "💰",
    img: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=600&q=80",
    excerpt: "A leaked ransomware forum gave researchers an unprecedented look at the criminal marketplace. Agentic AI is reshaping the economics — attacks are getting cheaper and faster to execute.",
    content: `
      <p>When a ransomware forum's internal database leaked, researchers got a rare look inside the criminal marketplace that funds modern ransomware operations. What they found confirms something the security community has been warning about: AI is dramatically lowering the barrier to entry for ransomware attacks while increasing their scale and speed.</p>

      <h3>What the Forum Data Revealed</h3>
      <p>The leaked data showed the structure of ransomware-as-a-service operations in detail:</p>
      <ul>
        <li>Core developers selling ransomware kits for as little as $300-500 per month</li>
        <li>Affiliate programs where operators take 70-80% of ransom payments and the developers take the rest</li>
        <li>Active discussion threads about using AI tools for phishing campaigns, target research, and vulnerability identification</li>
        <li>Increasingly automated tooling that reduces the technical skill required to run an operation</li>
      </ul>

      <h3>How AI Is Changing Ransomware Economics</h3>
      <p>The biggest shift AI brings to ransomware operations isn't the malware itself — it's the reconnaissance and targeting phase. Attackers are using AI tools to:</p>
      <ul>
        <li><strong>Generate highly convincing phishing emails</strong> at scale with minimal effort</li>
        <li><strong>Research target organizations</strong> — org charts, key personnel, technology stack — rapidly</li>
        <li><strong>Identify vulnerable exposed assets</strong> using automated scanning with AI-assisted prioritization</li>
        <li><strong>Automate initial access workflows</strong> that previously required skilled operators</li>
      </ul>

      <div class="highlight-box">
        Agentic AI systems are being discussed on criminal forums as force multipliers. What previously required a team of skilled operators can now be partially automated. The attack volume is increasing because the cost per attack is decreasing.
      </div>

      <h3>Defensive Implications</h3>
      <ul>
        <li><strong>Assume higher attack frequency</strong> — if attacks are cheaper to run, there will be more of them targeting smaller organizations that previously weren't worth the effort</li>
        <li><strong>Reduce your external attack surface</strong> — every exposed service is a potential automated scan target</li>
        <li><strong>Behavioral detection over signature detection</strong> — AI-generated attacks will bypass signature-based controls more effectively</li>
        <li><strong>Incident response planning</strong> — tabletop exercises quarterly, not annually</li>
        <li><strong>Cyber insurance review</strong> — the risk landscape has shifted; make sure coverage reflects current threat levels</li>
      </ul>

      <p>The democratization of ransomware operations through AI tools means the threat is no longer concentrated in sophisticated nation-state actors or elite criminal groups. Any organization is now a viable target. Defense needs to scale accordingly.</p>
    `
  },
  {
    id: 13,
    title: "Zero Trust in 2026: Moving Past the Buzzword to Actual Implementation",
    date: "January 20, 2026",
    tag: "cloud",
    tagLabel: "Cloud Security",
    readTime: "5 min read",
    emoji: "🛡️",
    img: "https://images.unsplash.com/photo-1510511459019-5dda7724fd87?w=600&q=80",
    excerpt: "Zero Trust has been a buzzword for years. In 2026, organizations that treat it as a product purchase are still getting breached. Here's what actual Zero Trust implementation looks like.",
    content: `
      <p>Zero Trust has been in security conversations for over a decade. By now, every vendor has a "Zero Trust solution" to sell you. And yet, organizations with Zero Trust checkboxes on their compliance documentation are still getting breached in ways that a genuine Zero Trust architecture would have prevented. The gap between the marketing and the implementation is where breaches live.</p>

      <h3>What Zero Trust Actually Means</h3>
      <p>The core principle is simple: <strong>never trust, always verify</strong>. Don't assume that traffic inside your network perimeter is safe. Verify every user, every device, every request — every time. The network perimeter is dead; identity is the new perimeter.</p>
      <p>In practice, this means:</p>
      <ul>
        <li>Every access request authenticated, regardless of network location</li>
        <li>Least-privilege access enforced at the resource level, not the network level</li>
        <li>Continuous verification — not just at login, but throughout a session</li>
        <li>Micro-segmentation — workloads can't talk to each other unless explicitly allowed</li>
        <li>Full visibility and logging of all traffic</li>
      </ul>

      <h3>Where Most Implementations Fall Short</h3>
      <p>The most common failure mode I see is organizations that implement Zero Trust at the perimeter (good VPN replacement, Conditional Access policies) but leave the interior untouched. Once an attacker is inside — whether through a phishing compromise or a supply chain attack — they find a flat network where workloads trust each other implicitly.</p>

      <div class="highlight-box">
        Zero Trust is not a product. It's an architecture. No single tool, however good, delivers Zero Trust. It's a set of principles applied consistently across your identity, network, data, and application layers.
      </div>

      <h3>A Practical Roadmap for Azure Environments</h3>
      <ul>
        <li><strong>Start with identity</strong> — enforce MFA, Conditional Access, and Privileged Identity Management (PIM) for all admin access in Azure Entra ID</li>
        <li><strong>Device compliance enforcement</strong> — only compliant, enrolled devices access corporate resources through Intune integration</li>
        <li><strong>Network segmentation with NSGs and private endpoints</strong> — resources shouldn't be publicly accessible unless they explicitly need to be</li>
        <li><strong>Workload identity</strong> — managed identities instead of service account credentials for service-to-service authentication</li>
        <li><strong>Continuous monitoring</strong> — Microsoft Sentinel ingesting signals across the stack, with alert rules tuned to detect lateral movement patterns</li>
        <li><strong>Regular access reviews</strong> — Entra ID Access Reviews on groups and application assignments quarterly</li>
      </ul>

      <p>Zero Trust is a journey, not a destination. You won't implement it in a quarter or a year. But every layer you add — every assumption of trust you remove — reduces your blast radius when a breach happens. Start with identity. Layer from there.</p>
    `
  },
  {
    id: 14,
    title: "The Telecom Surveillance Problem: What Security Teams Should Know",
    date: "February 17, 2026",
    tag: "threat",
    tagLabel: "Threat Intel",
    readTime: "4 min read",
    emoji: "📡",
    img: "https://images.unsplash.com/photo-1516044734145-07ca8eef8731?w=600&q=80",
    excerpt: "Covert surveillance campaigns targeting telecom infrastructure expose systemic weaknesses that extend to any enterprise that depends on those networks. The implications are broader than they look.",
    content: `
      <p>Security researchers have exposed multiple covert surveillance campaigns targeting telecommunications infrastructure — and the findings reveal systemic weaknesses that go well beyond the telecom sector. If your enterprise uses cellular connectivity, public internet routing, or telecom-dependent communication tools, this matters to you directly.</p>

      <h3>What the Research Found</h3>
      <p>The campaigns exploited weaknesses in core telecom protocols — particularly <strong>SS7</strong> (Signaling System 7), a protocol suite from the 1970s still underpinning global phone network routing. SS7 was designed in an era when telcos trusted each other implicitly. Modern threat actors exploit that trust to:</p>
      <ul>
        <li>Intercept SMS messages — including MFA codes</li>
        <li>Track device locations without the target's knowledge</li>
        <li>Redirect calls and messages to attacker-controlled numbers</li>
        <li>Conduct real-time surveillance of communications</li>
      </ul>

      <h3>Why SMS-Based MFA Is a Structural Problem</h3>
      <p>This research underscores something NIST has been saying for years: SMS-based MFA is not strong authentication. It's better than nothing. But SS7 vulnerabilities mean that an attacker with access to telecom infrastructure — or a telecom insider threat — can intercept the SMS code in real time.</p>
      <p>For high-value targets — executives, system administrators, financial operations staff — SMS MFA is insufficient. The threat actors exploiting SS7 are targeting exactly those users.</p>

      <div class="highlight-box">
        MFA is only as strong as its delivery mechanism. SMS codes travel over infrastructure with known, documented vulnerabilities. FIDO2 hardware keys don't.
      </div>

      <h3>Enterprise Implications</h3>
      <ul>
        <li><strong>Replace SMS MFA with app-based or hardware token MFA</strong> for all privileged accounts — this is non-negotiable if you have high-value targets on your team</li>
        <li><strong>Evaluate cellular-dependent tools for sensitive communications</strong> — encrypted messaging apps over IP (Signal, Teams with E2EE) are more resistant to SS7 attacks than standard SMS or calls</li>
        <li><strong>Supply chain awareness</strong> — if your organization connects to external systems over public telecom infrastructure, understand what data is in transit and whether it's encrypted end-to-end</li>
        <li><strong>Geofencing and anomaly detection</strong> — unusual location signals for employee devices should trigger investigation, not just a shrug</li>
      </ul>

      <p>Telecom surveillance vulnerabilities aren't new — SS7 has been a known problem since at least 2014. What's changed is who's exploiting them and how actively. State-sponsored actors and sophisticated criminal groups are both using these weaknesses. The enterprise security posture needs to account for the fact that the network layer below your encrypted traffic may not be trustworthy.</p>
    `
  },
  {
    id: 15,
    title: "AI Model Security: Protecting the Systems Protecting Everything Else",
    date: "March 17, 2026",
    tag: "ai",
    tagLabel: "AI Security",
    readTime: "5 min read",
    emoji: "🔒",
    img: "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=600&q=80",
    excerpt: "As organizations deploy AI models across security operations, the models themselves become targets. Model extraction, adversarial inputs, and data poisoning are the new attack surface nobody's fully ready for.",
    content: `
      <p>There's an irony emerging in enterprise security: we're deploying AI models to defend our systems, but the models themselves are becoming targets. The White House recently announced measures to prevent foreign actors from extracting proprietary AI model capabilities — and that signals something important about where the threat landscape is heading. The systems doing the defending need to be defended too.</p>

      <h3>The New AI Attack Surface</h3>
      <p>When an organization deploys an AI model — whether for threat detection, alert triage, or automated response — they introduce several new attack vectors that traditional security thinking doesn't fully address:</p>
      <ul>
        <li><strong>Model extraction</strong> — through repeated API queries, attackers can reconstruct a proprietary model's decision logic, effectively stealing it</li>
        <li><strong>Adversarial inputs</strong> — carefully crafted inputs designed to cause a model to misclassify threats (making malicious traffic look benign, or benign traffic look malicious)</li>
        <li><strong>Data poisoning</strong> — if training data pipelines are compromised, the model can be trained to have systematic blind spots</li>
        <li><strong>Prompt injection in LLM-based security tools</strong> — malicious content that manipulates an AI security assistant's behavior through the content it's analyzing</li>
      </ul>

      <h3>Real-World Implications</h3>
      <p>An adversary who understands how your AI-based threat detection model makes decisions can craft attacks specifically designed to evade it. If your SIEM uses ML-based anomaly detection and an attacker can probe its decision boundary, they can move through your network in patterns the model won't flag.</p>
      <p>This is the adversarial ML problem, and it's moving from academic research into operational security threat modeling.</p>

      <div class="highlight-box">
        The same AI capabilities that accelerate defense also accelerate offense. Attackers are using AI to probe AI-based defenses. This is the new asymmetric dynamic in enterprise security.
      </div>

      <h3>How to Secure AI Systems in Security Operations</h3>
      <ul>
        <li><strong>Rate limiting and query monitoring on AI APIs</strong> — detect and block model extraction attempts through anomalous query patterns</li>
        <li><strong>Input validation before model inference</strong> — sanitize and validate all inputs that feed into security AI models</li>
        <li><strong>Ensemble approaches</strong> — using multiple models with different architectures reduces the effectiveness of adversarial inputs crafted for one specific model</li>
        <li><strong>Human review on low-confidence decisions</strong> — don't trust autonomous AI action on edge cases; flag them for analyst review</li>
        <li><strong>Model versioning and integrity monitoring</strong> — detect if deployed models have been tampered with</li>
        <li><strong>Separation of training and inference infrastructure</strong> — protect training pipelines with the same rigor as production systems</li>
      </ul>

      <p>We're at an inflection point. AI in security is here to stay — the efficiency gains are too significant. But the security of AI systems themselves needs to be built in from the start, not bolted on after the first AI-focused breach makes headlines. Start threat modeling your AI systems the same way you'd threat model any other critical infrastructure.</p>
    `
  },
  {
    id: 16,
    title: "Geofence Warrants, Privacy, and What Security Teams Need to Understand",
    date: "April 15, 2026",
    tag: "grc",
    tagLabel: "GRC",
    readTime: "4 min read",
    emoji: "⚖️",
    img: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&q=80",
    excerpt: "The Supreme Court is examining geofence warrant legality. For security and privacy professionals, this is a case that will directly shape what data organizations must protect — and how.",
    content: `
      <p>The Supreme Court's examination of geofence warrant legality is one of the most significant privacy cases in years for security and compliance professionals. Geofence warrants allow law enforcement to request location data from tech companies for every device present in a specific geographic area during a specific time window — regardless of whether the device owner is a suspect. The constitutional questions being raised will directly affect data retention policies, location data handling, and the privacy obligations of any organization that processes location information.</p>

      <h3>What a Geofence Warrant Actually Does</h3>
      <p>When law enforcement submits a geofence warrant to Google, Apple, or another provider, the process typically works in three steps:</p>
      <ul>
        <li><strong>Step 1</strong> — Provider returns anonymized device IDs for all devices in the specified area/time</li>
        <li><strong>Step 2</strong> — Law enforcement identifies devices of interest from that pool</li>
        <li><strong>Step 3</strong> — Provider de-anonymizes and reveals identifying information for those specific devices</li>
      </ul>
      <p>The Fourth Amendment question: does a geofence warrant constitute an unreasonable search? Does the initial dragnet sweep of innocent people's location data require a warrant — and does it meet the particularity requirements of a valid warrant?</p>

      <h3>Why This Matters for Enterprise Security Teams</h3>
      <p>The implications extend beyond consumer privacy. Organizations that:</p>
      <ul>
        <li>Collect employee or customer location data in mobile apps</li>
        <li>Process location telemetry for security purposes (office access logs, badge data, vehicle tracking)</li>
        <li>Store location data in cloud platforms that might receive government requests</li>
      </ul>
      <p>...all need to understand how the Court's decision will affect their legal obligations and data handling requirements.</p>

      <div class="highlight-box">
        Data you collect for one purpose — security monitoring, for example — can become the subject of law enforcement requests. Your data retention policy is also your legal exposure policy.
      </div>

      <h3>What Security and Privacy Teams Should Do Now</h3>
      <ul>
        <li><strong>Audit location data collection</strong> — catalog every system that collects, processes, or stores location data</li>
        <li><strong>Implement data minimization</strong> — collect only the location data you actually need, retain it only as long as necessary</li>
        <li><strong>Review government request response procedures</strong> — have a legal review process for law enforcement data requests before compliance</li>
        <li><strong>Assess cloud provider policies</strong> — understand how your cloud providers handle government data requests and what notification they provide</li>
        <li><strong>Document retention and deletion procedures</strong> — data that doesn't exist can't be subpoenaed</li>
      </ul>

      <p>Whatever the Court decides, the trajectory of privacy regulation is clear: organizations will face increasing scrutiny of how they handle location and behavioral data. Getting ahead of that now — through data minimization and clear retention policies — is both the right thing to do and the smart business move.</p>
    `
  }
];

// ===== BLOG RENDERING =====
(function () {
  const track    = document.getElementById('blogTrack');
  const wrapper  = document.getElementById('blogScrollWrapper');
  const arrowL   = document.getElementById('blogArrowLeft');
  const arrowR   = document.getElementById('blogArrowRight');
  const thumb    = document.getElementById('blogScrollThumb');
  if (!track || !wrapper) return;

  BLOG_POSTS.slice().reverse().forEach(post => {
    const card = document.createElement('div');
    card.className = 'blog-card';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', post.title);

    const imgHtml = post.img
      ? `<img class="blog-card-img" src="${post.img}" alt="${post.title}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
         <div class="blog-card-img-placeholder" style="display:none">${post.emoji}</div>`
      : `<div class="blog-card-img-placeholder">${post.emoji}</div>`;

    card.innerHTML = `
      ${imgHtml}
      <div class="blog-card-body">
        <div class="blog-card-top">
          <span class="blog-tag ${post.tag}">${post.tagLabel}</span>
          <span class="blog-card-date">${post.date}</span>
        </div>
        <h3 class="blog-card-title">${post.title}</h3>
        <p class="blog-card-excerpt">${post.excerpt}</p>
        <div class="blog-card-footer">
          <span class="blog-card-read">
            Read more
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </span>
          <span class="blog-card-min">${post.readTime}</span>
        </div>
      </div>
    `;

    card.addEventListener('click', () => openModal(post));
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(post); }});
    track.appendChild(card);
  });

  // Arrow scroll
  const SCROLL_BY = 640;
  function updateArrows() {
    if (!arrowL || !arrowR) return;
    arrowL.disabled = wrapper.scrollLeft <= 0;
    arrowR.disabled = wrapper.scrollLeft >= wrapper.scrollWidth - wrapper.clientWidth - 2;
  }
  function updateThumb() {
    if (!thumb) return;
    const ratio = wrapper.scrollLeft / (wrapper.scrollWidth - wrapper.clientWidth);
    const trackW = wrapper.clientWidth;
    const thumbW = Math.max(40, trackW * (wrapper.clientWidth / wrapper.scrollWidth));
    const maxLeft = trackW - thumbW;
    thumb.style.width = thumbW + 'px';
    thumb.style.left  = (ratio * maxLeft) + 'px';
  }
  if (arrowL) arrowL.addEventListener('click', () => { wrapper.scrollBy({ left: -SCROLL_BY, behavior: 'smooth' }); });
  if (arrowR) arrowR.addEventListener('click', () => { wrapper.scrollBy({ left:  SCROLL_BY, behavior: 'smooth' }); });
  wrapper.addEventListener('scroll', () => { updateArrows(); updateThumb(); }, { passive: true });
  // init after cards are painted
  requestAnimationFrame(() => { updateArrows(); updateThumb(); });
  window.addEventListener('resize', () => { updateArrows(); updateThumb(); });
})();

// ===== BLOG MODAL =====
const blogModal       = document.getElementById('blogModal');
const blogModalClose  = document.getElementById('blogModalClose');
const blogModalBack   = document.getElementById('blogModalBackdrop');
const modalTag        = document.getElementById('modalTag');
const modalDate       = document.getElementById('modalDate');
const modalImg        = document.getElementById('modalImg');
const modalTitle      = document.getElementById('modalTitle');
const modalContent    = document.getElementById('modalContent');

let _savedScrollY = 0;

function openModal(post) {
  modalTag.className    = `blog-tag ${post.tag} blog-modal-tag`;
  modalTag.textContent  = post.tagLabel;
  modalDate.textContent = post.date;
  modalTitle.textContent = post.title;
  modalContent.innerHTML = post.content;

  const imgWrap = document.querySelector('.blog-modal-img-wrap');
  if (post.img) {
    modalImg.src = post.img;
    modalImg.alt = post.title;
    imgWrap.style.display = 'block';
  } else {
    imgWrap.style.display = 'none';
  }

  _savedScrollY = window.scrollY;
  document.documentElement.style.overflow = 'hidden';
  document.documentElement.scrollTop = _savedScrollY;

  blogModal.classList.add('open');

  const panel = document.querySelector('.blog-modal-panel');
  if (panel) panel.scrollTop = 0;

  blogModalClose.focus();
}

function closeModal() {
  blogModal.classList.remove('open');
  document.documentElement.style.overflow = '';
  window.scrollTo({ top: _savedScrollY, behavior: 'instant' });
}

if (blogModalClose) blogModalClose.addEventListener('click', closeModal);
if (blogModalBack)  blogModalBack.addEventListener('click', closeModal);
document.addEventListener('keydown', e => { if (e.key === 'Escape' && blogModal.classList.contains('open')) closeModal(); });

// ===== RECOMMENDATION READ MORE TOGGLE =====
document.querySelectorAll('.rec-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const text = btn.previousElementSibling;
    const expanded = text.classList.toggle('expanded');
    btn.textContent = expanded ? 'Show less' : 'Read more';
    btn.setAttribute('aria-expanded', expanded);
  });
});
