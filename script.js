document.addEventListener('DOMContentLoaded', () => {
    initLoader();
    initThemeToggle();
    initNavigation();
    initTypingEffect();
    initCounterAnimation();
    initScrollAnimations();
    initSkillBars();
    initProjectFilter();
    initShowMore();
    initContactForm();
    initBackToTop();
    initSmoothScroll();
    initCursorGlow();
});

// ========================================
// Loader
// ========================================
function initLoader() {
    const loader = document.getElementById('loader');
    if (!loader) return;

    const hide = () => {
        loader.classList.add('hidden');
        document.body.style.overflow = '';
    };

    document.body.style.overflow = 'hidden';

    window.addEventListener('load', () => {
        setTimeout(hide, 800);
    });

    setTimeout(hide, 2500);
}

// ========================================
// Theme Toggle
// ========================================
function initThemeToggle() {
    const toggle = document.getElementById('themeToggle');
    if (!toggle) return;

    const saved = localStorage.getItem('theme');
    if (saved) {
        document.documentElement.setAttribute('data-theme', saved);
    }

    toggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
    });
}

// ========================================
// Navigation
// ========================================
function initNavigation() {
    const navbar = document.querySelector('.navbar');
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');

    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
            document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
        });
    }

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (navToggle && navMenu) {
                navToggle.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });

    const sections = document.querySelectorAll('section[id]');
    window.addEventListener('scroll', () => {
        const scrollY = window.pageYOffset;
        sections.forEach(section => {
            const top = section.offsetTop - 120;
            const height = section.offsetHeight;
            const id = section.getAttribute('id');
            const navLink = document.querySelector(`.nav-link[href="#${id}"]`);
            if (navLink) {
                if (scrollY >= top && scrollY < top + height) {
                    navLinks.forEach(l => l.classList.remove('active'));
                    navLink.classList.add('active');
                } 
            }
        });
    });
}

// ========================================
// Typing Effect
// ========================================
function initTypingEffect() {
    const el = document.querySelector('.typed-text');
    if (!el) return;

    const phrases = [
        'LLM Engineering',
        'Multimodal AI Systems',
        'Production APIs',
        'Data Strategy',
        'Computer Vision',
        'Prompt Engineering'
    ];

    let phraseIdx = 0;
    let charIdx = 0;
    let deleting = false;

    function tick() {
        const phrase = phrases[phraseIdx];
        let speed;

        if (deleting) {
            el.textContent = phrase.substring(0, charIdx - 1);
            charIdx--;
            speed = 40;
        } else {
            el.textContent = phrase.substring(0, charIdx + 1);
            charIdx++;
            speed = 80;
        }

        if (!deleting && charIdx === phrase.length) {
            speed = 2000;
            deleting = true;
        } else if (deleting && charIdx === 0) {
            deleting = false;
            phraseIdx = (phraseIdx + 1) % phrases.length;
            speed = 400;
        }

        setTimeout(tick, speed);
    }

    tick();
}

// ========================================
// Counter Animation
// ========================================
function initCounterAnimation() {
    const counters = document.querySelectorAll('.stat-number');

    const animate = (counter) => {
        const target = parseInt(counter.getAttribute('data-count'));
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;

        const update = () => {
            current += step;
            if (current < target) {
                counter.textContent = Math.floor(current);
                requestAnimationFrame(update);
            } else {
                counter.textContent = target;
            }
        };
        update();
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animate(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(c => observer.observe(c));
}

// ========================================
// Scroll Animations
// ========================================
function initScrollAnimations() {
    const opts = { root: null, rootMargin: '0px', threshold: 0.1 };

    const timelineItems = document.querySelectorAll('.timeline-item');
    const timelineObs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, opts);
    timelineItems.forEach(item => timelineObs.observe(item));

    const fadeEls = document.querySelectorAll(
        '.highlight-card, .skill-category, .project-card, .contact-card, .language-item, .education-card, .extra-item'
    );
    const fadeObs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, opts);

    fadeEls.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        fadeObs.observe(el);
    });

    const headers = document.querySelectorAll('.section-header');
    const headerObs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.3 });
    headers.forEach(h => headerObs.observe(h));
}

// ========================================
// Skill Bars
// ========================================
function initSkillBars() {
    const bars = document.querySelectorAll('.skill-progress');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const progress = entry.target.getAttribute('data-progress');
                entry.target.style.width = `${progress}%`;
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    bars.forEach(bar => observer.observe(bar));
}

// ========================================
// Project Filter
// ========================================
function initProjectFilter() {
    const btns = document.querySelectorAll('.filter-btn');
    const projects = document.querySelectorAll('.project-card');
    const grid = document.getElementById('projectsGrid');
    const showMoreBtn = document.getElementById('showMoreBtn');

    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            btns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filter = btn.getAttribute('data-filter');
            const isAll = filter === 'all';

            if (showMoreBtn) {
                showMoreBtn.style.display = isAll ? '' : 'none';
            }

            projects.forEach(p => {
                const cat = p.getAttribute('data-category');
                const isExtra = p.classList.contains('project-extra');
                const isExpanded = grid && grid.classList.contains('expanded');

                if (isAll) {
                    p.style.removeProperty('display');
                    if (isExtra && !isExpanded) {
                        p.style.opacity = '0';
                    } else {
                        requestAnimationFrame(() => {
                            p.style.opacity = '1';
                            p.style.transform = 'translateY(0)';
                        });
                    }
                } else {
                    if (cat === filter) {
                        p.style.display = 'block';
                        requestAnimationFrame(() => {
                            p.style.opacity = '1';
                            p.style.transform = 'translateY(0)';
                        });
                    } else {
                        p.style.opacity = '0';
                        p.style.transform = 'translateY(20px)';
                        setTimeout(() => { p.style.display = 'none'; }, 300);
                    }
                }
            });
        });
    });
}

// ========================================
// Show More Projects
// ========================================
function initShowMore() {
    const btn = document.getElementById('showMoreBtn');
    const grid = document.getElementById('projectsGrid');
    if (!btn || !grid) return;

    btn.addEventListener('click', () => {
        const expanded = grid.classList.toggle('expanded');
        btn.classList.toggle('expanded', expanded);
        const label = btn.querySelector('span');

        if (expanded) {
            label.textContent = 'Show Less';
            const extras = grid.querySelectorAll('.project-extra');
            extras.forEach((card, i) => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, i * 60);
            });
        } else {
            label.textContent = 'Show More Projects';
            const section = document.getElementById('projects');
            if (section) {
                setTimeout(() => {
                    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
            }
        }
    });
}

// ========================================
// Contact Form
// ========================================
function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = form.querySelector('[name="name"]').value.trim();
        const email = form.querySelector('[name="email"]').value.trim();
        const subject = form.querySelector('[name="subject"]').value.trim();
        const message = form.querySelector('[name="message"]').value.trim();

        if (!name || !email || !subject || !message) return;

        const mailSubject = `Portfolio: ${subject}`;
        const mailBody = `Hi Charbel,\n\nName: ${name}\nEmail: ${email}\n\n${message}`;
        const mailtoUrl = `mailto:charbeltoumieh1@gmail.com?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(mailBody)}`;

        window.location.href = mailtoUrl;
    });
}

// ========================================
// Back to Top
// ========================================
function initBackToTop() {
    const btn = document.getElementById('backToTop');
    if (!btn) return;

    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 600) {
            btn.classList.add('visible');
        } else {
            btn.classList.remove('visible');
        }
    });

    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ========================================
// Smooth Scroll
// ========================================
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(link.getAttribute('href'));
            if (target) {
                window.scrollTo({
                    top: target.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ========================================
// Cursor Glow
// ========================================
function initCursorGlow() {
    const glow = document.getElementById('cursorGlow');
    if (!glow || window.matchMedia('(max-width: 1024px)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let mouseX = 0, mouseY = 0;
    let glowX = 0, glowY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        if (!glow.classList.contains('active')) {
            glow.classList.add('active');
        }
    });

    document.addEventListener('mouseleave', () => {
        glow.classList.remove('active');
    });

    function animate() {
        glowX += (mouseX - glowX) * 0.08;
        glowY += (mouseY - glowY) * 0.08;
        glow.style.left = glowX + 'px';
        glow.style.top = glowY + 'px';
        requestAnimationFrame(animate);
    }
    animate();
}

// ========================================
// Parallax Orbs
// ========================================
document.addEventListener('mousemove', (e) => {
    if (window.matchMedia('(max-width: 1024px)').matches) return;

    const orbs = document.querySelectorAll('.gradient-orb');
    const mx = e.clientX / window.innerWidth;
    const my = e.clientY / window.innerHeight;

    orbs.forEach((orb, i) => {
        const speed = (i + 1) * 15;
        const x = (mx - 0.5) * speed;
        const y = (my - 0.5) * speed;
        orb.style.transform = `translate(${x}px, ${y}px)`;
    });
});

// ========================================
// Dynamic Year
// ========================================
const yearEl = document.querySelector('.footer-year');
if (yearEl) yearEl.textContent = new Date().getFullYear();
