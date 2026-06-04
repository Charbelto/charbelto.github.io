/**
 * Charbel Toumieh - Portfolio Interaction Driver Script (script.js)
 */

document.addEventListener('DOMContentLoaded', () => {
    initLoader();
    initThemeToggle();
    initNavigation();
    initSandboxTabs();
    initAgentSimulator();
    initTypedText();
    initCounterAnimation();
    initScrollAnimations();
    initProjectFilters();
    initShowMore();
    initContactForm();
    initCursorGlow();
});

// ==========================================
// 1. Initial Page Loading Animation
// ==========================================
function initLoader() {
    const loader = document.getElementById('loader');
    const progress = loader ? loader.querySelector('.loader-progress') : null;
    const percentText = document.getElementById('loaderPercent');
    
    if (!loader || !progress || !percentText) return;
    
    document.body.style.overflow = 'hidden';
    
    let currentPercent = 0;
    const interval = setInterval(() => {
        currentPercent += Math.floor(Math.random() * 8) + 4;
        if (currentPercent >= 100) {
            currentPercent = 100;
            clearInterval(interval);
            setTimeout(() => {
                loader.classList.add('hidden');
                document.body.style.overflow = '';
            }, 300);
        }
        progress.style.width = currentPercent + '%';
        percentText.textContent = currentPercent + '%';
    }, 45);
}

// ==========================================
// 2. Light / Dark Theme Management
// ==========================================
function initThemeToggle() {
    const toggle = document.getElementById('themeToggle');
    if (!toggle) return;

    // Check system preference first, fallback to dark
    const storedTheme = localStorage.getItem('theme');
    const systemPrefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    const initialTheme = storedTheme || (systemPrefersLight ? 'light' : 'dark');
    
    document.documentElement.setAttribute('data-theme', initialTheme);

    toggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const targetTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', targetTheme);
        localStorage.setItem('theme', targetTheme);
    });
}

// ==========================================
// 3. Header Navigation & Active Links Scrollspy
// ==========================================
function initNavigation() {
    const navbar = document.querySelector('.navbar');
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');
    
    if (!navbar) return;

    // Sticky scroll effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Mobile hamburger menu toggle
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            const isActive = navMenu.classList.toggle('active');
            navToggle.classList.toggle('active', isActive);
            document.body.style.overflow = isActive ? 'hidden' : '';
        });
    }

    // Close mobile menu on nav link click
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (navMenu && navToggle) {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });

    // Scrollspy active tag updates
    const sections = document.querySelectorAll('section[id]');
    window.addEventListener('scroll', () => {
        const scrollPos = window.scrollY + 160;
        
        sections.forEach(section => {
            const top = section.offsetTop;
            const height = section.offsetHeight;
            const id = section.getAttribute('id');
            
            if (scrollPos >= top && scrollPos < top + height) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    });
}

// ==========================================
// 4. Hero Visual Workspace Tabs Toggle
// ==========================================
function initSandboxTabs() {
    const codeBtn = document.getElementById('tabCodeBtn');
    const terminalBtn = document.getElementById('tabTerminalBtn');
    const codeTab = document.getElementById('tab-code');
    const terminalTab = document.getElementById('tab-terminal');
    
    if (!codeBtn || !terminalBtn || !codeTab || !terminalTab) return;
    
    codeBtn.addEventListener('click', () => {
        codeBtn.classList.add('active');
        terminalBtn.classList.remove('active');
        codeTab.classList.add('active');
        terminalTab.classList.remove('active');
    });
    
    terminalBtn.addEventListener('click', () => {
        terminalBtn.classList.add('active');
        codeBtn.classList.remove('active');
        terminalTab.classList.add('active');
        codeTab.classList.remove('active');
    });
}

// ==========================================
// 5. Agent Sandbox simulated ReAct LLM logs
// ==========================================
function initAgentSimulator() {
    const consoleBody = document.getElementById('consoleBody');
    if (!consoleBody) return;

    // Steps mimicking a ReAct (Reasoning & Action) Agent loop
    const logSteps = [
        { type: 'comment', text: '# Fetching agent workspace variables...' },
        { type: 'keyword', text: '>>> Agent initialized with GPT-4o backend' },
        { type: 'info', text: 'Prompt query: "Analyze Charbel\'s engineering logs"' },
        { type: 'comment', text: '# Thought: I should retrieve candidate stats from database' },
        { type: 'accent', text: 'Executing VectorDBRetriever(query="experience schema")' },
        { type: 'info', text: 'Observation: Found 6 technical engineering internships/roles.' },
        { type: 'comment', text: '# Thought: Let\'s query details on the Top audited project repositories.' },
        { type: 'accent', text: 'Executing VectorDBRetriever(query="audited codebases list")' },
        { type: 'info', text: 'Observation: 23 projects verified. DermSense skin disease classifier PyTorch CNN weights operational. OULAD retention data models saved.' },
        { type: 'comment', text: '# Thought: I should check code compiler output for verification.' },
        { type: 'accent', text: 'Executing PythonREPL(code="print(\'Validating model compiling...\')")' },
        { type: 'success', text: 'stdout: Validating model compiling... [OK]' },
        { type: 'comment', text: '# Thought: All projects compile. I can provide the final engineering summary.' },
        { type: 'success', text: '[SUCCESS] Task resolved in 3.8 seconds.' },
        { type: 'info', text: 'Answer: Charbel Toumieh matches target profile for Senior AI & LLM Systems roles. 23 repositories are verified and running.' }
    ];

    let stepIdx = 0;

    function renderNextLine() {
        if (stepIdx >= logSteps.length) {
            // Wait 5 seconds, clear screen, and restart
            setTimeout(() => {
                consoleBody.innerHTML = '<div class="log-line text-comment"># Initializing agent shell console...</div>';
                stepIdx = 0;
                setTimeout(renderNextLine, 600);
            }, 6000);
            return;
        }

        const step = logSteps[stepIdx];
        const container = document.createElement('div');
        container.className = 'log-line';

        if (step.type === 'comment') {
            container.className += ' text-comment';
            container.textContent = step.text;
        } else if (step.type === 'keyword') {
            container.className += ' text-keyword';
            container.textContent = step.text;
        } else if (step.type === 'info') {
            container.className += ' text-info';
            container.textContent = step.text;
        } else if (step.type === 'accent') {
            container.className += ' text-accent';
            container.textContent = step.text;
        } else if (step.type === 'success') {
            container.className += ' text-success';
            container.textContent = step.text;
        }

        consoleBody.appendChild(container);
        consoleBody.scrollTop = consoleBody.scrollHeight;
        
        stepIdx++;
        
        // Realistic dynamic delays between actions
        const typingDelay = step.type === 'accent' ? 1400 : Math.random() * 500 + 400;
        setTimeout(renderNextLine, typingDelay);
    }

    // Delay start of simulator logs slightly to let loader finish
    setTimeout(renderNextLine, 2500);
}

// ==========================================
// 6. Hero Typed Subtitle Text Rotation
// ==========================================
function initTypedText() {
    const target = document.querySelector('.typed-text');
    if (!target) return;

    const phrases = [
        "Large Language Models (LLMs)",
        "Multi-Agent AI Workflows",
        "Computer Vision Neural Networks",
        "Production-Grade MLOps APIs",
        "Custom Data & ETL Pipelines"
    ];

    let phraseIdx = 0;
    let charIdx = 0;
    let isDeleting = false;
    let delay = 100;

    function type() {
        const currentPhrase = phrases[phraseIdx];
        
        if (isDeleting) {
            target.textContent = currentPhrase.substring(0, charIdx - 1);
            charIdx--;
            delay = 40;
        } else {
            target.textContent = currentPhrase.substring(0, charIdx + 1);
            charIdx++;
            delay = 90;
        }

        if (!isDeleting && charIdx === currentPhrase.length) {
            // Hold full phrase for 2.2 seconds before deleting
            delay = 2200;
            isDeleting = true;
        } else if (isDeleting && charIdx === 0) {
            isDeleting = false;
            phraseIdx = (phraseIdx + 1) % phrases.length;
            delay = 500;
        }

        setTimeout(type, delay);
    }

    type();
}

// ==========================================
// 7. Stat Counters Numeric Animation
// ==========================================
function initCounterAnimation() {
    const stats = document.querySelectorAll('.stat-number');
    if (stats.length === 0) return;

    const runCounter = (el) => {
        const max = parseInt(el.getAttribute('data-count'), 10);
        const duration = 1800; // ms
        const step = max / (duration / 16);
        let val = 0;

        const count = () => {
            val += step;
            if (val < max) {
                el.textContent = Math.floor(val);
                requestAnimationFrame(count);
            } else {
                el.textContent = max;
            }
        };
        count();
    };

    if (!('IntersectionObserver' in window)) {
        stats.forEach(runCounter);
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                runCounter(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    stats.forEach(stat => observer.observe(stat));
}

// ==========================================
// 8. Element Fade-In Scroll Intersection Observability
// ==========================================
function initScrollAnimations() {
    const cards = document.querySelectorAll(
        '.highlight-card, .timeline-item, .education-card, .extra-item, .skill-category, .project-card, .contact-card, .contact-form, .about-image'
    );
    
    cards.forEach(card => card.classList.add('reveal-item'));

    if (!('IntersectionObserver' in window)) {
        cards.forEach(card => card.classList.add('revealed'));
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                // stop observing once element is shown
                observer.unobserve(entry.target);
            }
        });
    }, { root: null, rootMargin: '0px 0px -40px 0px', threshold: 0.05 });

    cards.forEach(card => observer.observe(card));
}

// ==========================================
// 9. Portfolio Filter Tabs Actions
// ==========================================
function initProjectFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-card');
    const showMoreBtn = document.getElementById('showMoreBtn');
    
    if (filterBtns.length === 0 || projectCards.length === 0) return;

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filter = btn.getAttribute('data-filter');
            const isAll = filter === 'all';

            // Show More drawer button is only relevant for the "All" view
            if (showMoreBtn) {
                showMoreBtn.style.display = isAll ? 'inline-flex' : 'none';
            }

            projectCards.forEach(card => {
                const cardCat = card.getAttribute('data-category');
                const isExtra = card.classList.contains('project-extra');

                if (isAll) {
                    if (isExtra) {
                        card.classList.remove('visible');
                    } else {
                        card.style.display = 'flex';
                        setTimeout(() => { card.style.opacity = '1'; card.style.transform = 'scale(1)'; }, 10);
                    }
                } else {
                    if (cardCat === filter) {
                        card.style.display = 'flex';
                        card.classList.remove('project-extra'); // temp override for clean visual transition
                        setTimeout(() => { card.style.opacity = '1'; card.style.transform = 'scale(1)'; }, 10);
                    } else {
                        card.style.opacity = '0';
                        card.style.transform = 'scale(0.95)';
                        setTimeout(() => { 
                            card.style.display = 'none'; 
                            // restore the extra tag class if filter reverts
                            if (isExtra) card.classList.add('project-extra'); 
                        }, 200);
                    }
                }
            });
            
            // If expand button is active, reset button state on filtering
            if (showMoreBtn && showMoreBtn.classList.contains('expanded')) {
                showMoreBtn.classList.remove('expanded');
                showMoreBtn.querySelector('span').textContent = 'Show More Projects';
            }
        });
    });
}

// ==========================================
// 10. Drawer Show-More/Less Extra Repos Toggle
// ==========================================
function initShowMore() {
    const showMoreBtn = document.getElementById('showMoreBtn');
    const grid = document.getElementById('projectsGrid');
    
    if (!showMoreBtn || !grid) return;

    showMoreBtn.addEventListener('click', () => {
        const isExpanded = showMoreBtn.classList.toggle('expanded');
        const extraCards = grid.querySelectorAll('.project-extra');
        const label = showMoreBtn.querySelector('span');

        if (isExpanded) {
            label.textContent = 'Show Less Projects';
            extraCards.forEach((card, i) => {
                card.style.display = 'flex';
                setTimeout(() => {
                    card.classList.add('visible');
                }, i * 65); // Staggered entry delay
            });
        } else {
            label.textContent = 'Show More Projects';
            extraCards.forEach(card => {
                card.classList.remove('visible');
                setTimeout(() => {
                    card.style.display = 'none';
                }, 300);
            });
            
            // Smoothly scroll container header back into viewport view
            document.getElementById('projects').scrollIntoView({ behavior: 'smooth' });
        }
    });
}

// ==========================================
// 11. Contact Form Submit Redirection
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

        const body = `Sender Name: ${name}\nSender Email: ${email}\n\nMessage Payload:\n${message}`;
        const mailto = `mailto:charbeltoumieh1@gmail.com?subject=${encodeURIComponent('[AI Portfolio] ' + subject)}&body=${encodeURIComponent(body)}`;

        window.location.href = mailto;
    });
}

// ==========================================
// 12. Cursor Follow Coordinates Glow
// ==========================================
function initCursorGlow() {
    const glow = document.getElementById('cursorGlow');
    
    // Disable coordinates tracking calculations on smaller screens for performance
    if (!glow || window.matchMedia('(max-width: 1024px)').matches) return;

    let targetX = 0, targetY = 0;
    let currX = 0, currY = 0;

    window.addEventListener('mousemove', (e) => {
        glow.classList.add('active');
        targetX = e.clientX;
        targetY = e.clientY;
    });

    window.addEventListener('mouseleave', () => {
        glow.classList.remove('active');
    });

    function stepAnimation() {
        // Easing factor calculation
        currX += (targetX - currX) * 0.08;
        currY += (targetY - currY) * 0.08;

        glow.style.transform = `translate3d(${currX}px, ${currY}px, 0) translate3d(-50%, -50%, 0)`;
        requestAnimationFrame(stepAnimation);
    }
    
    stepAnimation();
}
