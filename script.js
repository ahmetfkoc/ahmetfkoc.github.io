(() => {
  "use strict";

  if (window.ScrollCraft) window.ScrollCraft.mount(document);

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const range = (value, start, end) => clamp((value - start) / (end - start));

  const folioProgress = document.getElementById("folioProgress");
  const sectionLinks = [...document.querySelectorAll("[data-section-link]")];
  const chapters = sectionLinks
    .map((link) => document.getElementById(link.dataset.sectionLink))
    .filter(Boolean);

  const updateFolio = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
    if (folioProgress) folioProgress.style.transform = `scaleY(${progress})`;

    const marker = window.innerHeight * 0.42;
    let current = chapters[0]?.id;
    chapters.forEach((chapter) => {
      if (chapter.getBoundingClientRect().top <= marker) current = chapter.id;
    });

    sectionLinks.forEach((link) => {
      link.toggleAttribute("aria-current", link.dataset.sectionLink === current);
    });
  };

  const counters = [...document.querySelectorAll("[data-count-to]")];
  const counterObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const element = entry.target;
        const target = Number(element.dataset.countTo);

        if (reduceMotion.matches) {
          element.textContent = target.toLocaleString();
        } else {
          const started = performance.now();
          const tick = (now) => {
            const progress = clamp((now - started) / 1400);
            const eased = 1 - Math.pow(1 - progress, 3);
            element.textContent = Math.round(target * eased).toLocaleString();
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
        observer.unobserve(element);
      });
    },
    { threshold: 0.5 }
  );
  counters.forEach((counter) => counterObserver.observe(counter));

  const opening = document.querySelector(".opening__track");
  const openingStage = document.querySelector("[data-opening-stage]");
  const photoOne = document.querySelector(".opening-photo--one");
  const photoTwo = document.querySelector(".opening-photo--two");
  const scanline = document.querySelector(".opening__scanline");
  const riskPath = document.querySelector(".trace-path--risk");
  const safePath = document.querySelector(".trace-path--safe");
  const tracePoints = [...document.querySelectorAll(".trace-points circle")];
  const openingCopy = document.querySelector(".opening__copy");
  const openingCase = document.querySelector(".opening__case");
  const openingVerdictPanel = document.querySelector(".opening__verdict");
  const openingTimeline = document.getElementById("openingTimeline");
  const openingStep = document.getElementById("openingStep");
  const openingNarrative = document.getElementById("openingNarrative");
  const openingVerdict = document.getElementById("openingVerdict");
  const openingApproval = document.getElementById("openingApproval");
  const caseExposure = document.getElementById("caseExposure");
  const caseCves = document.getElementById("caseCves");
  const caseDecision = document.getElementById("caseDecision");
  const openingLabels = [...document.querySelectorAll("[data-opening-label]")];
  const agents = [...document.querySelectorAll("[data-agent]")];

  const phases = [
    {
      narrative: "A high-severity cloud finding enters the system. The evidence is still fragmented.",
      exposure: "Internet facing",
      cves: "3 critical",
      decision: "Pending analysis"
    },
    {
      narrative: "ContextAgent classifies the resource as production and establishes business impact.",
      exposure: "Internet facing",
      cves: "3 critical",
      decision: "Production resource"
    },
    {
      narrative: "NetworkAgent traces NSG exposure and confirms reachable management ports.",
      exposure: "Ports 22 and 3389",
      cves: "3 critical",
      decision: "Externally reachable"
    },
    {
      narrative: "ThreatHunter correlates active CVEs with the full attack path.",
      exposure: "Confirmed",
      cves: "Correlated",
      decision: "Critical priority"
    },
    {
      narrative: "A structured verdict is ready. The system pauses before action for human approval.",
      exposure: "Contained",
      cves: "Patch plan ready",
      decision: "Approved"
    }
  ];

  let activePhase = -1;

  const updateOpening = () => {
    if (!opening || !openingStage || reduceMotion.matches) return;

    const rect = opening.getBoundingClientRect();
    const travel = Math.max(opening.offsetHeight - window.innerHeight, 1);
    const progress = clamp(-rect.top / travel);
    const phase = Math.min(4, Math.floor(progress * 5));
    const phaseProgress = progress * 5 - phase;

    const firstExit = range(progress, 0.24, 0.48);
    photoOne.style.opacity = String(0.72 - firstExit * 0.5);
    photoOne.style.transform = `scale(${1.04 + progress * 0.1}) translate3d(${progress * -2}%, 0, 0)`;

    const secondReveal = range(progress, 0.18, 0.52);
    const secondExit = range(progress, 0.7, 0.94);
    photoTwo.style.opacity = String(secondReveal * (0.76 - secondExit * 0.5));
    photoTwo.style.clipPath = `inset(0 ${100 - secondReveal * 100}% 0 0)`;
    photoTwo.style.transform = `scale(${1.1 - secondReveal * 0.06 + secondExit * 0.08})`;

    scanline.style.transform = `translateX(${progress * 52}vw)`;
    scanline.style.opacity = String(0.8 - range(progress, 0.76, 0.94) * 0.8);

    const riskDraw = range(progress, 0.04, 0.6);
    const safeDraw = range(progress, 0.56, 0.9);
    riskPath.style.strokeDashoffset = String(1600 * (1 - riskDraw));
    riskPath.style.opacity = String(1 - safeDraw * 0.72);
    safePath.style.strokeDashoffset = String(1600 * (1 - safeDraw));
    tracePoints.forEach((point, index) => {
      const pointVisible = riskDraw > index * 0.25;
      point.style.opacity = pointVisible ? "1" : "0";
      point.style.stroke = safeDraw > index * 0.25 ? "var(--accent)" : "var(--risk)";
    });

    const copyExit = range(progress, 0.18, 0.34);
    openingCopy.style.opacity = String(1 - copyExit);
    openingCopy.style.transform = `translateY(${-copyExit * 40}px)`;

    const caseEnter = range(progress, 0.17, 0.3);
    const caseExit = range(progress, 0.68, 0.78);
    openingCase.style.opacity = String(caseEnter * (1 - caseExit));
    openingCase.style.transform = `translateY(calc(-50% + ${(1 - caseEnter) * 32 - caseExit * 24}px))`;

    const verdictEnter = range(progress, 0.72, 0.86);
    openingVerdictPanel.style.opacity = String(verdictEnter);
    openingVerdictPanel.style.transform = `translate(-50%, calc(-50% + ${(1 - verdictEnter) * 48}px)) scale(${0.96 + verdictEnter * 0.04})`;

    openingTimeline.style.transform = `scaleX(${progress})`;
    openingStep.textContent = String(phase + 1).padStart(2, "0");
    openingLabels.forEach((label, index) => label.classList.toggle("is-active", index <= phase));
    agents.forEach((agent, index) => agent.classList.toggle("is-active", phase >= index + 1));

    openingStage.dataset.scVerifyState = `${phase}-${Math.round(phaseProgress * 4)}`;
    openingStage.dataset.scVerifyHold = progress > 0.94 ? "true" : "false";

    if (phase !== activePhase) {
      const state = phases[phase];
      openingNarrative.textContent = state.narrative;
      caseExposure.textContent = state.exposure;
      caseCves.textContent = state.cves;
      caseDecision.textContent = state.decision;
      openingVerdict.textContent = phase === 4 ? "Critical. Action approved." : "Unclassified";
      openingApproval.textContent = phase === 4
        ? "Human approval recorded. Jira action may proceed."
        : "Human approval required before action";
      activePhase = phase;
    }
  };

  const setReducedMotionState = () => {
    if (!openingStage || !reduceMotion.matches) return;
    openingStage.dataset.scVerifyState = "static";
    openingStage.dataset.scVerifyHold = "true";
    openingTimeline.style.transform = "scaleX(1)";
    openingLabels.forEach((label) => label.classList.add("is-active"));
  };

  let frameRequested = false;
  const update = () => {
    updateFolio();
    updateOpening();
    setReducedMotionState();
    frameRequested = false;
  };

  const requestUpdate = () => {
    if (frameRequested) return;
    frameRequested = true;
    requestAnimationFrame(update);
  };

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
  reduceMotion.addEventListener("change", requestUpdate);
  requestUpdate();
})();
