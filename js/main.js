(() => {
    const canvas = document.getElementById('orbyte-canvas');
    const ctx    = canvas.getContext('2d');

    let width, height, centerX, centerY, radius;
    let mouseX = -9999, mouseY = -9999;
    let particles      = [];
    let introComplete  = false;
    let introStartTime = null;

    const PARTICLE_COUNT = 600;
    const DOT_SIZE       = 0.85;   // نقط صغيرة
    const MOUSE_RADIUS   = 100;
    const REPEL_STRENGTH = 80;
    const ROTATION_SPEED = 0.25;
    const INTRO_DURATION = 3300;   // ms

    // ── الشكل: دائرة + 4 بروزات (فوق/تحت/يمين/شمال) ────────────────
    function getShapeRadius(angle, base) {
        const bulge     = 0;
        const sharpness = 6;
        return base * (1 + bulge * Math.pow(Math.abs(Math.cos(2 * angle)), sharpness));
    }

    // ── نقطة عشوائية خارج حدود الشاشة ──────────────────────────────
    function offscreenPoint() {
        const pad  = 180;
        const side = Math.floor(Math.random() * 4);
        switch (side) {
            case 0: return { x: Math.random() * width,  y: -pad };
            case 1: return { x: Math.random() * width,  y: height + pad };
            case 2: return { x: -pad,                   y: Math.random() * height };
            default:return { x: width + pad,            y: Math.random() * height };
        }
    }

    function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

    // ── resize ───────────────────────────────────────────────────────
function resize() {
    const dpr  = window.devicePixelRatio || 1;
    width      = window.innerWidth;
    height     = window.innerHeight;

    canvas.width  = width  * dpr;
    canvas.height = height * dpr;
    canvas.style.width  = width  + 'px';
    canvas.style.height = height + 'px';

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    centerX = width  / 2;
    centerY = height / 2;

    if (width <= 600) {
      radius = Math.min(width, height) * 0.63;
    }else if (width <= 767) {
  
        radius = Math.min(width, height) * 0.40;
    } else if (width <= 1024) {
  
        radius = Math.min(width, height) * 0.40;
    } else {
  
        radius = Math.min(width, height) * 0.40;
    }

    initParticles();
}


    // ── init ─────────────────────────────────────────────────────────
    function initParticles() {
        particles      = [];
        introStartTime = Date.now();
        introComplete  = false;

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const angle  = (Math.PI * 2 * i) / PARTICLE_COUNT + (Math.random() - 0.5) * 0.3;
            const shapeR = getShapeRadius(angle, radius);
            const rVar   = shapeR + (Math.random() - 0.5) * shapeR * 0.22;
            const spawn  = offscreenPoint();   // من خارج الشاشة

            particles.push({
                angle,
                rVariance:   rVar,
                x:           spawn.x,
                y:           spawn.y,
                startX:      spawn.x,
                startY:      spawn.y,
                orbitOffset: (Math.random() - 0.5) * 0.08,
                alpha:       0.3 + Math.random() * 0.7,
                size:        DOT_SIZE * (0.5 + Math.random() * 1),
                delay:       Math.random() * 0.55,
            });
        }
    }

    // ── loop ─────────────────────────────────────────────────────────
    function animate() {
        ctx.clearRect(0, 0, width, height);

        const now     = Date.now();
        const elapsed = now - introStartTime;
        const time    = now * 0.001;
        const gAngle  = time * ROTATION_SPEED;

        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];

            // وجهة النقطة على الشكل الدوار
            const curAngle = p.angle + gAngle + p.orbitOffset * Math.sin(time * 0.5);
            const destX    = centerX + Math.cos(curAngle) * p.rVariance;
            const destY    = centerY + Math.sin(curAngle) * p.rVariance;

            let drawX, drawY, drawAlpha;

            if (!introComplete) {
                // مرحلة التجمع من بره الشاشة
                const pElapsed = elapsed - p.delay * INTRO_DURATION;
                const t        = Math.min(Math.max(pElapsed / (INTRO_DURATION * 0.7), 0), 1);
                const progress = easeOutCubic(t);

                // fade-in مع الحركة
                drawAlpha = p.alpha * Math.min(t * 2.5, 1);
                drawX     = p.startX + (destX - p.startX) * progress;
                drawY     = p.startY + (destY - p.startY) * progress;
                p.x = drawX;
                p.y = drawY;

            } else {
                // دوران عادي + تأثير الماوس
                const dx   = destX - mouseX;
                const dy   = destY - mouseY;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < MOUSE_RADIUS && dist > 0) {
                    const f = (MOUSE_RADIUS - dist) / MOUSE_RADIUS;
                    p.x += (destX + (dx / dist) * f * REPEL_STRENGTH - p.x) * 0.18;
                    p.y += (destY + (dy / dist) * f * REPEL_STRENGTH - p.y) * 0.18;
                } else {
                    p.x += (destX - p.x) * 0.08;
                    p.y += (destY - p.y) * 0.08;
                }

                drawX     = p.x;
                drawY     = p.y;
                drawAlpha = p.alpha;
            }

            ctx.beginPath();
            ctx.arc(drawX, drawY, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0,0,0,${drawAlpha})`;
            ctx.fill();
        }

        if (!introComplete && elapsed > INTRO_DURATION * 1.45) {
            introComplete = true;
        }

        requestAnimationFrame(animate);
    }

    // ── Events ───────────────────────────────────────────────────────
    canvas.addEventListener('mousemove', e => {
        const r = canvas.getBoundingClientRect();
        mouseX = e.clientX - r.left;
        mouseY = e.clientY - r.top;
    });
    canvas.addEventListener('mouseleave', () => { mouseX = mouseY = -9999; });

    canvas.addEventListener('touchmove', e => {
        e.preventDefault();
        const r = canvas.getBoundingClientRect();
        mouseX = e.touches[0].clientX - r.left;
        mouseY = e.touches[0].clientY - r.top;
    }, { passive: false });
    canvas.addEventListener('touchend', () => { mouseX = mouseY = -9999; });

    window.addEventListener('resize', resize);
    resize();
    animate();
})();