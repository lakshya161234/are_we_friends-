const stage = document.getElementById("buttonStage");
const yesBtn = document.getElementById("yesBtn");
const noBtn = document.getElementById("noBtn");
const successPanel = document.getElementById("successPanel");
const canvas = document.getElementById("celebration-canvas");
const ctx = canvas.getContext("2d");

let lastMoveTime = 0;
let runawayEnabled = true;
let confettiPieces = [];
let fireworks = [];
let animationFrameId = null;

function resizeCanvas() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(window.innerWidth * ratio);
  canvas.height = Math.floor(window.innerHeight * ratio);
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getRectCenter(rect) {
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

function getStagePointerPosition(clientX, clientY) {
  const stageRect = stage.getBoundingClientRect();

  return {
    inside:
      clientX >= stageRect.left &&
      clientX <= stageRect.right &&
      clientY >= stageRect.top &&
      clientY <= stageRect.bottom,
    x: clientX - stageRect.left,
    y: clientY - stageRect.top,
    stageRect,
  };
}

function setYesPosition(left, top) {
  yesBtn.style.left = `${left}px`;
  yesBtn.style.top = `${top}px`;
  yesBtn.style.transform = "none";
}

function placeYesNearStage() {
  const padding = 12;
  const stageWidth = stage.clientWidth;
  const stageHeight = stage.clientHeight;
  const btnWidth = yesBtn.offsetWidth;
  const btnHeight = yesBtn.offsetHeight;
  const noWidth = noBtn.offsetWidth;

  const targetLeft = stageWidth / 2 + noWidth / 2 + 18;
  const targetTop = stageHeight / 2 - btnHeight / 2;

  const maxLeft = Math.max(padding, stageWidth - btnWidth - padding);
  const maxTop = Math.max(padding, stageHeight - btnHeight - padding);

  setYesPosition(
    clamp(targetLeft, padding, maxLeft),
    clamp(targetTop, padding, maxTop)
  );
}

function moveYesButton(force = false) {
  if (!runawayEnabled) return;

  const now = Date.now();
  if (!force && now - lastMoveTime < 170) return;
  lastMoveTime = now;

  const padding = 12;
  const stageWidth = stage.clientWidth;
  const stageHeight = stage.clientHeight;
  const btnWidth = yesBtn.offsetWidth;
  const btnHeight = yesBtn.offsetHeight;

  const minLeft = padding;
  const minTop = padding;
  const maxLeft = stageWidth - btnWidth - padding;
  const maxTop = stageHeight - btnHeight - padding;

  const noRect = noBtn.getBoundingClientRect();
  const stageRect = stage.getBoundingClientRect();

  const noCenterX = noRect.left - stageRect.left + noRect.width / 2;
  const noCenterY = noRect.top - stageRect.top + noRect.height / 2;

  let nextLeft = minLeft;
  let nextTop = minTop;
  let attempts = 0;

  while (attempts < 40) {
    const candidateLeft = Math.random() * Math.max(maxLeft - minLeft, 1) + minLeft;
    const candidateTop = Math.random() * Math.max(maxTop - minTop, 1) + minTop;

    const candidateCenterX = candidateLeft + btnWidth / 2;
    const candidateCenterY = candidateTop + btnHeight / 2;

    const distanceFromNo = Math.hypot(
      candidateCenterX - noCenterX,
      candidateCenterY - noCenterY
    );

    // reduced from a very large blocked area so it can also move left
    if (distanceFromNo > 85) {
      nextLeft = candidateLeft;
      nextTop = candidateTop;
      break;
    }

    attempts += 1;
  }

  yesBtn.style.left = `${clamp(nextLeft, minLeft, maxLeft)}px`;
  yesBtn.style.top = `${clamp(nextTop, minTop, maxTop)}px`;
  yesBtn.style.transform = "none";

  yesBtn.classList.remove("runaway");
  void yesBtn.offsetWidth;
  yesBtn.classList.add("runaway");
}

function maybeRunFromPointer(clientX, clientY) {
  if (!runawayEnabled) return;

  const pointer = getStagePointerPosition(clientX, clientY);
  if (!pointer.inside) return;

  const yesRect = yesBtn.getBoundingClientRect();
  const center = getRectCenter(yesRect);
  const distance = Math.hypot(clientX - center.x, clientY - center.y);

  if (distance < 105) {
    moveYesButton();
  }
}

document.addEventListener("mousemove", (event) => {
  maybeRunFromPointer(event.clientX, event.clientY);
});

document.addEventListener(
  "touchstart",
  (event) => {
    const touch = event.touches[0];
    if (!touch) return;

    maybeRunFromPointer(touch.clientX, touch.clientY);

    const touchedYes = event.target === yesBtn || yesBtn.contains(event.target);
    if (touchedYes) {
      event.preventDefault();
      moveYesButton(true);
    }
  },
  { passive: false }
);

document.addEventListener(
  "touchmove",
  (event) => {
    const touch = event.touches[0];
    if (!touch) return;
    maybeRunFromPointer(touch.clientX, touch.clientY);
  },
  { passive: true }
);

yesBtn.addEventListener("mouseenter", () => moveYesButton(true));

yesBtn.addEventListener("pointerdown", (event) => {
  if (!runawayEnabled) return;
  event.preventDefault();
  moveYesButton(true);
});

yesBtn.addEventListener("click", (event) => {
  if (!runawayEnabled) return;
  event.preventDefault();
  moveYesButton(true);
});

class ConfettiPiece {
  constructor() {
    this.x = Math.random() * window.innerWidth;
    this.y = -20 - Math.random() * window.innerHeight * 0.25;
    this.size = 6 + Math.random() * 10;
    this.speedY = 1.8 + Math.random() * 3.2;
    this.speedX = -1.2 + Math.random() * 2.4;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = -0.12 + Math.random() * 0.24;
    this.opacity = 0.78 + Math.random() * 0.22;
    this.shape = Math.random() > 0.55 ? "circle" : "rect";
    this.color = ["#ffe27d", "#ffae57", "#ff7282", "#fff5dd", "#ffcc6c"][Math.floor(Math.random() * 5)];
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.rotation += this.rotationSpeed;
  }

  draw(context) {
    context.save();
    context.globalAlpha = this.opacity;
    context.translate(this.x, this.y);
    context.rotate(this.rotation);
    context.fillStyle = this.color;

    if (this.shape === "circle") {
      context.beginPath();
      context.arc(0, 0, this.size * 0.48, 0, Math.PI * 2);
      context.fill();
    } else {
      context.fillRect(-this.size / 2, -this.size / 2, this.size, this.size * 0.72);
    }

    context.restore();
  }
}

class Firework {
  constructor(x, y) {
    this.particles = Array.from({ length: 28 }, () => ({
      x,
      y,
      vx: Math.cos(Math.random() * Math.PI * 2) * (1.4 + Math.random() * 3.2),
      vy: Math.sin(Math.random() * Math.PI * 2) * (1.4 + Math.random() * 3.2),
      life: 50 + Math.random() * 18,
      size: 2 + Math.random() * 2.5,
      color: ["#ffe17a", "#fff4cf", "#ff8f70", "#ff6d8f"][Math.floor(Math.random() * 4)],
      alpha: 1,
    }));
  }

  update() {
    this.particles.forEach((particle) => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.035;
      particle.life -= 1;
      particle.alpha = Math.max(0, particle.life / 68);
    });

    this.particles = this.particles.filter((particle) => particle.life > 0);
  }

  draw(context) {
    this.particles.forEach((particle) => {
      context.save();
      context.globalAlpha = particle.alpha;
      context.fillStyle = particle.color;
      context.beginPath();
      context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      context.fill();
      context.restore();
    });
  }

  get done() {
    return this.particles.length === 0;
  }
}

function spawnConfettiBurst(count = 160) {
  for (let i = 0; i < count; i += 1) {
    confettiPieces.push(new ConfettiPiece());
  }
}

function spawnFireworkCluster() {
  const points = [
    { x: window.innerWidth * 0.24, y: window.innerHeight * 0.28 },
    { x: window.innerWidth * 0.76, y: window.innerHeight * 0.24 },
    { x: window.innerWidth * 0.52, y: window.innerHeight * 0.18 },
  ];

  points.forEach((point, index) => {
    setTimeout(() => fireworks.push(new Firework(point.x, point.y)), index * 220);
  });
}

function animateCelebration() {
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  confettiPieces.forEach((piece) => {
    piece.update();
    piece.draw(ctx);
  });

  confettiPieces = confettiPieces.filter(
    (piece) => piece.y < window.innerHeight + 30 && piece.x > -30 && piece.x < window.innerWidth + 30
  );

  fireworks.forEach((firework) => {
    firework.update();
    firework.draw(ctx);
  });

  fireworks = fireworks.filter((firework) => !firework.done);

  if (confettiPieces.length > 0 || fireworks.length > 0) {
    animationFrameId = requestAnimationFrame(animateCelebration);
  } else {
    animationFrameId = null;
  }
}

function startCelebration() {
  document.body.classList.add("celebrating");
  successPanel.classList.add("show");

  spawnConfettiBurst(180);
  spawnFireworkCluster();

  const extraConfetti = [400, 850, 1350];
  extraConfetti.forEach((delay) => {
    setTimeout(() => {
      spawnConfettiBurst(70);
      if (!animationFrameId) animateCelebration();
    }, delay);
  });

  if (!animationFrameId) {
    animateCelebration();
  }
}

noBtn.addEventListener("click", () => {
  runawayEnabled = false;
  yesBtn.style.opacity = "0";
  yesBtn.style.pointerEvents = "none";
  startCelebration();
});

function handleResize() {
  resizeCanvas();
  if (runawayEnabled) {
    placeYesNearStage();
  }
}

handleResize();
window.addEventListener("resize", handleResize);