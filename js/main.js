document.addEventListener('DOMContentLoaded', () => {
    // 1. Sticky Navigation Header
    const header = document.querySelector('.main-header');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }

    // 2. Mobile Menu Toggle with body overlay
    const mobileNavToggle = document.querySelector('.mobile-nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    // Create overlay for mobile nav
    const navOverlay = document.createElement('div');
    navOverlay.classList.add('nav-overlay');
    document.body.appendChild(navOverlay);
    
    function openMobileNav() {
        mobileNavToggle.classList.add('open');
        navMenu.classList.add('open');
        navOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        document.body.classList.add('nav-open');
    }
    
    function closeMobileNav() {
        mobileNavToggle.classList.remove('open');
        navMenu.classList.remove('open');
        navOverlay.classList.remove('active');
        document.body.style.overflow = '';
        document.body.classList.remove('nav-open');
    }

    if (mobileNavToggle && navMenu) {
        mobileNavToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            if (navMenu.classList.contains('open')) {
                closeMobileNav();
            } else {
                openMobileNav();
            }
        });
        
        navOverlay.addEventListener('click', closeMobileNav);
        
        // Close on nav link click (for mobile)
        navMenu.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                const parent = link.closest('.nav-item-dropdown');
                if (parent && window.innerWidth <= 1200) {
                    // Check if click target is the chevron icon
                    if (e.target.classList.contains('fa-chevron-down') || e.target.tagName === 'I') {
                        e.preventDefault();
                        parent.classList.toggle('active-drop');
                        e.stopPropagation();
                    } else {
                        closeMobileNav();
                    }
                } else {
                    closeMobileNav();
                }
            });
        });
        
        navMenu.querySelectorAll('.dropdown-link').forEach(link => {
            link.addEventListener('click', closeMobileNav);
        });
        
        navMenu.addEventListener('click', (e) => { e.stopPropagation(); });
    }

    // 3. Highlight Active Link in Navigation
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-link, .dropdown-link');
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPath) {
            link.classList.add('active');
            const parentDropdown = link.closest('.nav-item-dropdown');
            if (parentDropdown) {
                parentDropdown.querySelector('.nav-link').classList.add('active');
            }
        }
    });

    // 4. Hero Carousel Slider with touch/swipe support
    const heroSlides = document.querySelectorAll('.hero-slide');
    if (heroSlides.length > 0) {
        let currentSlide = 0;
        const prevBtn = document.querySelector('.hero-prev');
        const nextBtn = document.querySelector('.hero-next');
        let slideInterval;
        let touchStartX = 0;
        let touchEndX = 0;
        const heroSection = document.querySelector('.hero');

        function showSlide(index) {
            heroSlides.forEach(slide => slide.classList.remove('active'));
            currentSlide = (index + heroSlides.length) % heroSlides.length;
            heroSlides[currentSlide].classList.add('active');
        }

        function nextSlide() { showSlide(currentSlide + 1); }
        function prevSlide() { showSlide(currentSlide - 1); }

        if (nextBtn && prevBtn) {
            nextBtn.addEventListener('click', () => { nextSlide(); resetInterval(); });
            prevBtn.addEventListener('click', () => { prevSlide(); resetInterval(); });
        }

        // Touch/Swipe support for mobile
        if (heroSection) {
            heroSection.addEventListener('touchstart', (e) => {
                touchStartX = e.changedTouches[0].screenX;
            }, { passive: true });
            
            heroSection.addEventListener('touchend', (e) => {
                touchEndX = e.changedTouches[0].screenX;
                const diff = touchStartX - touchEndX;
                if (Math.abs(diff) > 50) {
                    if (diff > 0) nextSlide();
                    else prevSlide();
                    resetInterval();
                }
            }, { passive: true });
        }

        function startInterval() { slideInterval = setInterval(nextSlide, 6000); }
        function resetInterval() { clearInterval(slideInterval); startInterval(); }
        startInterval();
    }

    // 5. Stat Counter Animation
    const statsSection = document.querySelector('.stats');
    const statNumbers = document.querySelectorAll('.stat-number');
    let animated = false;

    function animateStats() {
        statNumbers.forEach(stat => {
            const target = parseInt(stat.getAttribute('data-target'), 10);
            const duration = 2000;
            const step = target / (duration / 16);
            let current = 0;

            const updateNumber = () => {
                current += step;
                if (current < target) {
                    stat.textContent = Math.floor(current) + (stat.textContent.includes('+') ? '+' : '');
                    requestAnimationFrame(updateNumber);
                } else {
                    stat.textContent = target + (target >= 10 ? '+' : '');
                }
            };
            updateNumber();
        });
    }

    if (statsSection && statNumbers.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !animated) {
                animateStats();
                animated = true;
                observer.unobserve(statsSection);
            }
        }, { threshold: 0.3 });
        observer.observe(statsSection);
    }

    // 6. Testimonial Slider with touch swipe
    const testimonialTrack = document.querySelector('.testimonial-track');
    const testimonialSlides = document.querySelectorAll('.testimonial-slide');
    const dotsContainer = document.querySelector('.testimonial-dots');
    
    if (testimonialTrack && testimonialSlides.length > 0) {
        let activeIdx = 0;
        
        if (dotsContainer) {
            dotsContainer.innerHTML = '';
            testimonialSlides.forEach((_, idx) => {
                const dot = document.createElement('div');
                dot.classList.add('testimonial-dot');
                if (idx === 0) dot.classList.add('active');
                dot.addEventListener('click', () => goToTestimonial(idx));
                dotsContainer.appendChild(dot);
            });
        }

        function goToTestimonial(index) {
            activeIdx = index;
            testimonialTrack.style.transform = `translateX(-${index * 100}%)`;
            const dots = document.querySelectorAll('.testimonial-dot');
            dots.forEach((dot, idx) => {
                dot.classList.toggle('active', idx === index);
            });
        }

        // Touch swipe for testimonials
        let tTouchStartX = 0;
        testimonialTrack.addEventListener('touchstart', (e) => {
            tTouchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        testimonialTrack.addEventListener('touchend', (e) => {
            const diff = tTouchStartX - e.changedTouches[0].screenX;
            if (Math.abs(diff) > 50) {
                if (diff > 0) goToTestimonial((activeIdx + 1) % testimonialSlides.length);
                else goToTestimonial((activeIdx - 1 + testimonialSlides.length) % testimonialSlides.length);
            }
        }, { passive: true });

        let testimonialInterval = setInterval(() => {
            goToTestimonial((activeIdx + 1) % testimonialSlides.length);
        }, 5000);
        testimonialTrack.addEventListener('mouseenter', () => clearInterval(testimonialInterval));
        testimonialTrack.addEventListener('mouseleave', () => {
            testimonialInterval = setInterval(() => {
                goToTestimonial((activeIdx + 1) % testimonialSlides.length);
            }, 5000);
        });
    }

    // 7. FAQ Accordions
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    accordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const item = header.parentElement;
            const content = item.querySelector('.accordion-content');
            const isActive = item.classList.contains('active');
            document.querySelectorAll('.accordion-item').forEach(accItem => {
                accItem.classList.remove('active');
                accItem.querySelector('.accordion-content').style.maxHeight = null;
            });
            if (!isActive) {
                item.classList.add('active');
                content.style.maxHeight = content.scrollHeight + "px";
            }
        });
    });

    // 8. Gallery Filter and Lightbox
    const filterButtons = document.querySelectorAll('.filter-btn');
    const galleryItems = document.querySelectorAll('.gallery-item');
    const lightbox = document.querySelector('.lightbox');
    const lightboxImg = document.querySelector('.lightbox-img');
    const lightboxCaption = document.querySelector('.lightbox-caption');
    const lightboxClose = document.querySelector('.lightbox-close');

    if (filterButtons.length > 0 && galleryItems.length > 0) {
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const filterValue = btn.getAttribute('data-filter');
                galleryItems.forEach(item => {
                    if (filterValue === 'all' || item.getAttribute('data-category') === filterValue) {
                        item.style.display = 'block';
                        item.style.animation = 'fadeIn 0.5s ease forwards';
                    } else {
                        item.style.display = 'none';
                    }
                });
            });
        });
    }

    if (galleryItems.length > 0 && lightbox && lightboxImg) {
        galleryItems.forEach(item => {
            item.addEventListener('click', () => {
                const img = item.querySelector('img');
                const caption = item.querySelector('.gallery-caption').textContent;
                lightboxImg.setAttribute('src', img.getAttribute('src'));
                lightboxCaption.textContent = caption;
                lightbox.style.display = 'flex';
                document.body.style.overflow = 'hidden';
            });
        });

        const closeLightbox = () => {
            lightbox.style.display = 'none';
            document.body.style.overflow = '';
        };
        if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
        lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });
    }

    // 9. Academic Tabs
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');
    if (tabButtons.length > 0 && tabPanels.length > 0) {
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                tabButtons.forEach(b => b.classList.remove('active'));
                tabPanels.forEach(p => p.classList.remove('active'));
                btn.classList.add('active');
                const targetPanel = document.getElementById(btn.getAttribute('data-tab'));
                if (targetPanel) targetPanel.classList.add('active');
            });
        });
    }

    // 10. Back-to-top button
    const backToTop = document.getElementById('backToTop');
    if (backToTop) {
        window.addEventListener('scroll', () => {
            backToTop.style.display = window.scrollY > 300 ? 'flex' : 'none';
        });
        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // 11. Scroll Reveal Animation
    const revealElements = document.querySelectorAll('.info-card, .feature-card, .notice-board, .form-card, .welcome-image, .welcome-text, .stat-item, .gallery-item, .contact-info-item');
    if (revealElements.length > 0 && 'IntersectionObserver' in window) {
        revealElements.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(25px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        });
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry, i) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }, i * 80);
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
        revealElements.forEach(el => revealObserver.observe(el));
    }
});
