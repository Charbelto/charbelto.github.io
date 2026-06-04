/**
 * CYBER OBSIDIAN INTERACTION DRIVER - SCRIPT.JS
 */

document.addEventListener('DOMContentLoaded', () => {
    initLoader();
    initThemeToggle();
    initNavigation();
    initConsoleSimulator();
    initCounterAnimation();
    initScrollAnimations();
    initSkillBars();
    initProjectFilter();
    initShowMore();
    initContactForm();
    initCursorGlow();
});

// ==========================================
// 1. Initial Loading Console
// ==========================================
function initLoader() {
    const loader = document.getElementById('loader');
    if (!loader) return;

    const hideLoader = () => {
        loader.classList.add('hidden');
        document.body.style.overflow = '';
    };

    document.body.style.overflow = 'hidden';
    
    // Fallback load timeout
    setTimeout(hideLoader, 2000);
    
    window.addEventListener('load', () => {
        setTimeout(hideLoader, 800);
    });
}

// ==========================================
// 2. Local-Storage Theme Management
// ==========================================
function initThemeToggle() {
    const toggle = document.getElementById('themeToggle');
    if (!toggle) return;

    const currentTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);

    toggle.addEventListener('click', () => {
        const targetTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', targetTheme);
        localStorage.setItem('theme', targetTheme);
    });
}

// ==========================================
// 3. Navigation Controls
// ==========================================
function initNavigation() {
    const navbar = document.querySelector('.navbar');
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');

    // Scroll styling
    window.addEventListener('scroll', () => {
        if (window.scrollY > 40) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Mobile navigation drawer toggling
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            const active = navMenu.classList.toggle('active');
            navToggle.classList.toggle('active', active);
            document.body.style.overflow = active ? 'hidden' : '';
        });
    }

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (navToggle && navMenu) {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });

    // Scrollspy navigation highlight
    const sections = document.querySelectorAll('section[id], header[id]');
    window.addEventListener('scroll', () => {
        const scrollPos = window.scrollY + 150;
        sections.forEach(sec => {
            const id = sec.getAttribute('id');
            const top = sec.offsetTop;
            const height = sec.offsetHeight;

            if (scrollPos >= top && scrollPos < top + height) {
                navLinks.forEach(lnk => {
                    lnk.classList.remove('active');
                    if (lnk.getAttribute('href') === `#${id}`) {
                        lnk.classList.add('active');
                    }
                });
            }
        });
    });
}

// ==========================================
// 4. ML Model Training Console Simulator
// ==========================================
function initConsoleSimulator() {
    const consoleBody = document.getElementById('consoleBody');
    if (!consoleBody) return;

    const dermSenseLogs = [
        { type: 'comment', text: '# Fetching dataset files...' },
        { type: 'keyword', text: '>>> Load dataset: ISIC_Lesions_2026' },
        { type: 'info', text: 'Found 12,450 categorized dermatological graphics.' },
        { type: 'keyword', text: '>>> Mapping PyTorch EfficientNet-B0 backbone...' },
        { type: 'comment', text: '# Initiating classification training loop' },
        { type: 'run', text: 'Epoch [1/3] [====>................] loss: 0.6542 - acc: 78.5%' },
        { type: 'run', text: 'Epoch [2/3] [=========>............] loss: 0.3204 - acc: 89.2%' },
        { type: 'run', text: 'Epoch [3/3] [====================>] loss: 0.0894 - acc: 97.4%' },
        { type: 'success', text: '[SUCCESS] ConvNet converged. Saved weights/model.pt' },
        { type: 'keyword', text: '>>> Running post-hoc Grad-CAM heatmaps...' },
        { type: 'success', text: '[OK] Explainability matrix generated.' }
    ];

    const ouladLogs = [
        { type: 'comment', text: '# Mapping learning analytics engine...' },
        { type: 'keyword', text: '>>> Importing cohort: 32,593 records' },
        { type: 'info', text: 'Executing multi-table preprocessing joins & clickstream extraction.' },
        { type: 'run', text: 'Executing RFECV (XGBoost classifier)...' },
        { type: 'success', text: '[OK] Pruned features list from 45 to 23 variables.' },
        { type: 'keyword', text: '>>> Training supervised modeling pipelines...' },
        { type: 'info', text: 'Evaluating XGBoost, Random Forest, GMM, and DBSCAN clusters.' },
        { type: 'success', text: '[SUCCESS] Cluster scoring complete. Exported metrics plots.' }
    ];

    const cellAnalyzerLogs = [
        { type: 'comment', text: '# Mapping client-server network reporter...' },
        { type: 'keyword', text: '>>> Testing TelephonyManager radio interfaces' },
        { type: 'success', text: '[OK] Capturing LTE / 5G / Wi-Fi metrics parameters.' },
        { type: 'run', text: 'Sending telemetry logging pack to Flask API...' },
        { type: 'info', text: 'POST request dispatched: http://localhost:5000/api/metrics' },
        { type: 'success', text: '[SUCCESS] Server parsed payload. SQL database committed.' }
    ];

    const pipelines = [dermSenseLogs, ouladLogs, cellAnalyzerLogs];
    let pipelineIdx = 0;
    let logIdx = 0;

    function addLogLine() {
        const currentPipeline = pipelines[pipelineIdx];
        
        if (logIdx >= currentPipeline.length) {
            // Reset console and move to next pipeline after 4 seconds
            setTimeout(() => {
                consoleBody.innerHTML = '<div class="log-line text-comment"># Initializing pipeline logs...</div>';
                logIdx = 0;
                pipelineIdx = (pipelineIdx + 1) % pipelines.length;
                setTimeout(addLogLine, 600);
            }, 4000);
            return;
        }

        const log = currentPipeline[logIdx];
        const line = document.createElement('div');
        line.className = 'log-line';

        if (log.type === 'comment') {
            line.className += ' text-comment';
            line.textContent = log.text;
        } else if (log.type === 'keyword') {
            line.innerHTML = `<span class="text-keyword">${log.text.substring(0, 3)}</span>${log.text.substring(3)}`;
        } else if (log.type === 'info') {
            line.textContent = log.text;
        } else if (log.type === 'run') {
            line.className += ' text-accent';
            line.textContent = log.text;
        } else if (log.type === 'success') {
            line.className += ' text-success';
            line.textContent = log.text;
        }

        consoleBody.appendChild(line);
        consoleBody.scrollTop = consoleBody.scrollHeight;
        
        logIdx++;
        
        // Random typing/execution delays to feel authentic
        const delay = log.type === 'run' ? 1200 : Math.random() * 400 + 400;
        setTimeout(addLogLine, delay);
    }

    // Start training ticker
    setTimeout(addLogLine, 1500);
}

// ==========================================
// 5. Statistics Counter Animation
// ==========================================
function initCounterAnimation() {
    const counters = document.querySelectorAll('.metric-val');
    if (counters.length === 0) return;

    const animateCounter = (counter) => {
        const target = parseInt(counter.getAttribute('data-count'), 10);
        const duration = 2000;
        const speed = target / (duration / 16);
        let current = 0;

        const update = () => {
            current += speed;
            if (current < target) {
                counter.textContent = Math.floor(current);
                requestAnimationFrame(update);
            } else {
                counter.textContent = target;
            }
        };
        update();
    };

    if (!('IntersectionObserver' in window)) {
        counters.forEach(animateCounter);
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(cnt => observer.observe(cnt));
}

// ==========================================
// 6. Section & Item Fade In Animations
// ==========================================
function initScrollAnimations() {
    const animEls = document.querySelectorAll(
        '.node-content, .edu-card, .lecture-item, .skill-group, .project-node, .c-card, .about-info, .avatar-frame'
    );

    if (!('IntersectionObserver' in window)) {
        animEls.forEach(el => {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        });
        return;
    }

    const opts = { root: null, rootMargin: '0px -50px -50px 0px', threshold: 0.05 };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('faded-in');
                observer.unobserve(entry.target);
            }
        });
    }, opts);

    animEls.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(25px)';
        el.style.transition = 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
        
        // CSS trigger helper class
        observer.observe(el);
    });

    // Custom CSS injection to trigger visible state
    const style = document.createElement('style');
    style.innerHTML = `
        .faded-in {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
    `;
    document.head.appendChild(style);
}

// ==========================================
// 7. Core MLOps / Systems Technical Skill Bars
// ==========================================
function initSkillBars() {
    const bars = document.querySelectorAll('.skill-fill');
    if (bars.length === 0) return;

    if (!('IntersectionObserver' in window)) {
        bars.forEach(b => {
            b.style.width = b.style.width;
        });
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const targetWidth = entry.target.style.width;
                entry.target.style.width = '0%';
                requestAnimationFrame(() => {
                    entry.target.style.width = targetWidth;
                });
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    bars.forEach(bar => observer.observe(bar));
}

// ==========================================
// 8. Dynamic Project Category Filtering
// ==========================================
function initProjectFilter() {
    const filterTabs = document.querySelectorAll('.filter-tab');
    const projectCards = document.querySelectorAll('.project-node');
    const showMoreBtn = document.getElementById('showMoreBtn');

    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const filterValue = tab.getAttribute('data-filter');
            const isAll = filterValue === 'all';

            // Show More drawer button is only relevant for "All" tab
            if (showMoreBtn) {
                showMoreBtn.style.display = isAll ? 'flex' : 'none';
            }

            projectCards.forEach(card => {
                const cardCategory = card.getAttribute('data-category');
                const isDrawerNode = card.classList.contains('drawer-node');

                if (isAll) {
                    if (isDrawerNode) {
                        card.classList.add('hidden');
                        card.classList.remove('visible');
                    } else {
                        card.style.display = 'flex';
                        requestAnimationFrame(() => {
                            card.style.opacity = '1';
                            card.style.transform = 'translateY(0)';
                        });
                    }
                } else {
                    if (cardCategory === filterValue) {
                        card.style.display = 'flex';
                        card.classList.remove('hidden');
                        requestAnimationFrame(() => {
                            card.style.opacity = '1';
                            card.style.transform = 'translateY(0)';
                        });
                    } else {
                        card.style.opacity = '0';
                        card.style.transform = 'translateY(15px)';
                        setTimeout(() => { card.style.display = 'none'; }, 250);
                    }
                }
            });
        });
    });
}

// ==========================================
// 9. Show More Drawer for Extended Repos
// ==========================================
function initShowMore() {
    const showMoreBtn = document.getElementById('showMoreBtn');
    const grid = document.getElementById('projectsGrid');
    if (!showMoreBtn || !grid) return;

    showMoreBtn.addEventListener('click', () => {
        const isExpanded = showMoreBtn.classList.toggle('expanded');
        const drawerCards = grid.querySelectorAll('.drawer-node');
        const btnLabel = showMoreBtn.querySelector('span');

        if (isExpanded) {
            btnLabel.textContent = 'Show Less Projects';
            showMoreBtn.querySelector('svg').style.transform = 'rotate(180deg)';
            
            drawerCards.forEach((card, idx) => {
                card.style.display = 'flex';
                card.classList.remove('hidden');
                card.classList.add('visible');
                
                // Staggered fade in
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, idx * 80);
            });
        } else {
            btnLabel.textContent = 'Show More Projects';
            showMoreBtn.querySelector('svg').style.transform = 'rotate(0deg)';
            
            drawerCards.forEach(card => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    card.classList.add('hidden');
                    card.classList.remove('visible');
                }, 300);
            });
            
            // Scroll back smoothly to projects tag
            document.getElementById('projects').scrollIntoView({ behavior: 'smooth' });
        }
    });
}

// ==========================================
// 10. Contact Form MailTo Binding
// ==========================================
function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const subject = document.getElementById('subject').value.trim();
        const message = document.getElementById('message').value.trim();

        if (!name || !email || !subject || !message) return;

        const bodyString = `Sender: ${name}\nContact Email: ${email}\n\nMessage:\n${message}`;
        const mailtoLink = `mailto:charbeltoumieh1@gmail.com?subject=${encodeURIComponent('AI Portfolio: ' + subject)}&body=${encodeURIComponent(bodyString)}`;

        window.location.href = mailtoLink;
    });
}

// ==========================================
// 11. Mouse Glow Coordinates Tracker
// ==========================================
function initCursorGlow() {
    const glow = document.getElementById('cursorGlow');
    if (!glow || window.matchMedia('(max-width: 1024px)').matches) return;

    let targetX = 0, targetY = 0;
    let currentX = 0, currentY = 0;

    window.addEventListener('mousemove', (e) => {
        targetX = e.clientX;
        targetY = e.clientY;
    });

    function animateGlow() {
        // Easing interpolation
        currentX += (targetX - currentX) * 0.1;
        currentY += (targetY - currentY) * 0.1;

        glow.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate3d(-50%, -50%, 0)`;
        requestAnimationFrame(animateGlow);
    }
    
    animateGlow();
}
