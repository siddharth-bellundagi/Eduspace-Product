/**
 * content-loader.js — Dynamic Content Loader
 *
 * Automatically fetches data from the backend API and renders it
 * into the HTML sections marked with data-firebase-collection attributes.
 *
 * Design principles:
 *   - Progressive enhancement: static HTML is the default, API data replaces it
 *   - Graceful degradation: if the API is down, existing HTML stays visible
 *   - Page-aware: only fetches data relevant to the current page
 */

document.addEventListener('DOMContentLoaded', () => {
    const page = getCurrentPage();

    // --- Route: Which loaders to run per page -----------
    const pageLoaders = {
        'index.html':    [loadHomeTicker, loadHomeNotices, loadHomeToppers],
        'news.html':     [loadAnnouncements, loadCirculars, loadHolidays, loadUpcomingEvents],
        'gallery.html':  [loadGallery],
        'faculty.html':  [loadFaculty, loadStaff],
        'achievements.html': [loadAchievements, loadAwards],
        'ssc-toppers.html': [loadSscToppers],
        'student-life.html': [loadStudentLife],
        'sports.html':   [loadStudentLife],
        'cultural-activities.html': [loadStudentLife],
        'educational-trips.html': [loadStudentLife],
        'parents.html':  [loadParentDownloads, loadParentCirculars, loadPta],
        'alumni.html':   [loadAlumniStories, loadAlumniEvents],
        'academics.html': [loadAcademicPrograms, loadAcademicCalendar, loadSyllabus, loadExamInfo],
        'primary-school.html': [loadAcademicPrograms],
        'secondary-school.html': [loadAcademicPrograms],
        'syllabus.html': [loadSyllabus],
        'academic-calendar.html': [loadAcademicCalendar, loadExamInfo],
    };

    const loaders = pageLoaders[page] || [];
    loaders.forEach(loader => {
        try { loader(); } catch (e) { console.warn('[ContentLoader]', e.message); }
    });
});

// --- Helpers --------------------------------------------
function getCurrentPage() {
    let path = (window.location.pathname || '').trim();
    path = path.split('?')[0].split('#')[0];
    path = path.replace(/\/+$/, '');
    const lastPart = path.split('/').pop() || 'index.html';
    if (!lastPart || !lastPart.includes('.')) {
        return 'index.html';
    }
    return lastPart;
}

function formatDate(dateStr) {
    if (!dateStr) return { day: '--', month: '' };
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return { day: '--', month: '' };
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return { day: String(d.getDate()).padStart(2, '0'), month: months[d.getMonth()] };
}

function formatFullDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function truncate(text, max = 150) {
    if (!text || text.length <= max) return text || '';
    return text.substring(0, max) + '...';
}

function showSectionError(container) {
    // Silently fail — keep existing static HTML visible
    console.warn('[ContentLoader] API error for section, keeping static content.');
}

function showEmptyState(container, message, icon = 'fa-inbox') {
    container.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: #888;">
            <i class="fa-solid ${icon}" style="font-size: 2rem; margin-bottom: 0.75rem; display: block; opacity: 0.5;"></i>
            <p style="font-size: 0.95rem;">${message}</p>
        </div>
    `;
}

// --- HOME PAGE ------------------------------------------

async function loadHomeTicker() {
    try {
        // Fetch both ticker items and active announcements so announcements appear in the Announcements ticker
        const [tickerRes, annRes] = await Promise.all([
            EduSphereAPI.get('/ticker').catch(() => ({ data: [] })),
            EduSphereAPI.get('/news/announcements').catch(() => ({ data: [] }))
        ]);

        const tickerItems = tickerRes.data || [];
        const announcements = annRes.data || [];

        const allItems = [];
        // Put active announcements first so user immediately sees their newly added announcements
        announcements.forEach(a => {
            if (a.title) {
                const prefix = a.priority === 'urgent' ? '?? [URGENT] ' : '';
                allItems.push(prefix + a.title + (a.content ? ': ' + truncate(a.content, 90) : ''));
            }
        });
        tickerItems.forEach(t => {
            const text = t.text || t.title;
            if (text) allItems.push(text);
        });

        if (allItems.length === 0) return;

        const tickerContent = document.querySelector('.ticker-content');
        if (!tickerContent) return;

        let html = '';
        allItems.forEach(text => {
            html += `<div class="ticker-item"><span>?</span> ${text}</div>`;
        });
        // Duplicate for seamless infinite marquee scroll
        allItems.forEach(text => {
            html += `<div class="ticker-item"><span>?</span> ${text}</div>`;
        });

        tickerContent.innerHTML = html;
        console.log('[ContentLoader] Home ticker loaded with ' + allItems.length + ' items');
    } catch (e) {
        console.warn('[ContentLoader] Error loading home ticker:', e);
    }
}

async function loadHomeNotices() {
    try {
        const result = await EduSphereAPI.get('/news/announcements');
        const items = result.data;
        if (!items || items.length === 0) return;

        const noticeList = document.querySelector('#noticeBoard .notice-list');
        if (!noticeList) return;

        noticeList.innerHTML = items.slice(0, 6).map(item => {
            const date = formatDate(item.date || item.createdAt);
            const priorityBadge = item.priority === 'urgent'
                ? '<span style="background:#ef4444; color:#fff; font-size:10px; font-weight:700; padding:2px 7px; border-radius:4px; margin-left:6px; text-transform:uppercase; display:inline-block; vertical-align:middle;">Urgent</span>'
                : (item.priority === 'high' ? '<span style="background:#f59e0b; color:#fff; font-size:10px; font-weight:700; padding:2px 7px; border-radius:4px; margin-left:6px; text-transform:uppercase; display:inline-block; vertical-align:middle;">Important</span>' : '');

            return `
                <div class="notice-item" style="display:flex; gap:14px; align-items:flex-start; padding:12px 0; border-bottom:1px solid rgba(0,0,0,0.06);">
                    <div class="notice-date" style="flex-shrink:0;">
                        <span>${date.day}</span>
                        <span>${date.month}</span>
                    </div>
                    <div class="notice-text" style="flex:1;">
                        <h4 style="margin:0 0 4px; font-size:0.95rem;">${item.title || ''}${priorityBadge}</h4>
                        <p class="text-muted" style="margin:0; font-size:0.85rem; line-height:1.4;">${truncate(item.content || item.description || '', 120)}</p>
                    </div>
                </div>
            `;
        }).join('');
        console.log('[ContentLoader] Home notices loaded with ' + items.length + ' announcements');
    } catch (e) {
        console.warn('[ContentLoader] Error loading home notices:', e);
    }
}

// --- NEWS PAGE ------------------------------------------

async function loadAnnouncements() {
    try {
        const result = await EduSphereAPI.get('/news/announcements');
        const items = result.data;

        const noticeList = document.querySelector('[data-firebase-collection="announcements"] .notice-list');
        if (!noticeList || !items || items.length === 0) return;

        noticeList.innerHTML = items.map(item => {
            const date = formatDate(item.date || item.createdAt);
            return `
                <div class="notice-item">
                    <div class="notice-date">
                        <span>${date.day}</span>
                        <span>${date.month}</span>
                    </div>
                    <div class="notice-text">
                        <h4>${item.title || ''}</h4>
                        <p class="text-muted">${item.content || item.description || ''}</p>
                    </div>
                </div>
            `;
        }).join('');
    } catch (e) {
        showSectionError();
    }
}

async function loadCirculars() {
    try {
        const result = await EduSphereAPI.get('/news/circulars');
        const items = result.data;

        const container = document.querySelector('[data-firebase-collection="circulars"]');
        if (!container || !items || items.length === 0) return;

        container.innerHTML = items.map(item => `
            <div style="display: flex; align-items: center; gap: 12px; padding: 0.75rem 0; border-bottom: 1px solid rgba(0,0,0,0.08);">
                <i class="fa-solid fa-file-pdf" style="color: #EF4444; font-size: 1.2rem;"></i>
                <div style="flex: 1;">
                    <strong style="font-size: 0.9rem;">${item.title || ''}</strong>
                    <div style="font-size: 0.8rem; color: #888;">${formatFullDate(item.date || item.createdAt)}</div>
                </div>
                ${item.fileUrl ? `<a href="${item.fileUrl}" target="_blank" style="color: var(--primary); font-size: 0.85rem; font-weight: 600;"><i class="fa-solid fa-download"></i></a>` : ''}
            </div>
        `).join('');
    } catch (e) {
        showSectionError();
    }
}

async function loadHolidays() {
    try {
        const result = await EduSphereAPI.get('/news/holidays');
        const items = result.data;

        const container = document.querySelector('[data-firebase-collection="holidays"]');
        if (!container || !items || items.length === 0) return;

        container.innerHTML = items.map(item => `
            <div style="display: flex; align-items: center; gap: 12px; padding: 0.75rem 0; border-bottom: 1px solid rgba(0,0,0,0.08);">
                <i class="fa-solid fa-calendar-xmark" style="color: var(--warning); font-size: 1rem;"></i>
                <div>
                    <strong style="font-size: 0.9rem;">${item.title || ''}</strong>
                    <div style="font-size: 0.8rem; color: #888;">${formatFullDate(item.date || item.createdAt)}</div>
                </div>
            </div>
        `).join('');
    } catch (e) {
        showSectionError();
    }
}

async function loadUpcomingEvents() {
    try {
        const result = await EduSphereAPI.get('/events');
        const items = result.data;

        const section = document.querySelector('[data-firebase-collection="upcoming-events"]');
        if (!section) return;

        const placeholder = section.querySelector('.placeholder-content');
        if (!placeholder) return;

        if (!items || items.length === 0) {
            showEmptyState(placeholder, 'No upcoming events at this time. Check back soon!', 'fa-calendar-check');
            return;
        }

        placeholder.outerHTML = `
            <div class="grid grid-3 gap-lg">
                ${items.map(item => {
                    const date = formatDate(item.date || item.createdAt);
                    return `
                        <div class="info-card" style="text-align: left; border-top: 4px solid var(--primary);">
                            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 0.75rem;">
                                <div style="background: var(--primary); color: white; padding: 8px 12px; border-radius: 8px; text-align: center; min-width: 50px;">
                                    <div style="font-size: 1.3rem; font-weight: 700; line-height: 1;">${date.day}</div>
                                    <div style="font-size: 0.7rem; text-transform: uppercase;">${date.month}</div>
                                </div>
                                <h4 style="font-size: 1rem; margin: 0;">${item.title || ''}</h4>
                            </div>
                            <p class="text-muted" style="font-size: 0.9rem;">${truncate(item.description || '', 120)}</p>
                            ${item.venue ? `<p style="font-size: 0.8rem; color: var(--primary);"><i class="fa-solid fa-location-dot"></i> ${item.venue}</p>` : ''}
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    } catch (e) {
        showSectionError();
    }
}

// --- GALLERY PAGE ---------------------------------------

async function loadGallery() {
    try {
        const result = await EduSphereAPI.get('/gallery');
        const items = result.data;
        if (!items || items.length === 0) return; // Keep static gallery

        const galleryGrid = document.querySelector('.gallery-grid');
        if (!galleryGrid) return;

        const galleryItemsHtml = [];
        items.forEach(item => {
            const category = (item.category || 'campus').toLowerCase();
            const classGrade = (item.classGrade || '').trim();
            const classTag = classGrade ? `[${classGrade}] ` : '';

            // Handle multi-image albums — check ALL possible field names
            let photos = [];
            if (item.images && Array.isArray(item.images) && item.images.length > 0) {
                photos = item.images.map(img => typeof img === 'string' ? { url: img } : img);
            } else if (item.imagesJson) {
                try {
                    const parsed = typeof item.imagesJson === 'string' ? JSON.parse(item.imagesJson) : item.imagesJson;
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        photos = parsed.map(img => typeof img === 'string' ? { url: img } : img);
                    }
                } catch(e) {}
            }
            if (photos.length === 0 && item.imageUrl) {
                photos = [{ url: item.imageUrl }];
            }

            photos.forEach(p => {
                if (!p.url) return;
                const resolvedUrl = EduSphereAPI.resolveUrl(p.url);
                const captionText = `${classTag}${item.title || 'School Photo'}`;

                // Calculate filter categories
                const filterCategories = [category];
                if (classGrade) {
                    const cleanClass = classGrade.toLowerCase().replace(/\s+/g, '-');
                    filterCategories.push(cleanClass);
                    if (['nursery', 'jr. kg', 'sr. kg', 'jr kg', 'sr kg'].includes(classGrade.toLowerCase())) {
                        filterCategories.push('pre-primary');
                    }
                    if (['class 1', 'class 2', 'class 3', 'class 4', 'class 5'].includes(classGrade.toLowerCase())) {
                        filterCategories.push('primary');
                    }
                    if (['class 6', 'class 7', 'class 8', 'class 9', 'class 10'].includes(classGrade.toLowerCase())) {
                        filterCategories.push('secondary');
                    }
                }

                galleryItemsHtml.push(`
                    <div class="gallery-item" data-category="${filterCategories.join(' ')}">
                        <img src="${resolvedUrl}" alt="${captionText}" loading="lazy"
                             onerror="this.closest('.gallery-item').style.display='none'">
                        <div class="gallery-caption">${captionText}</div>
                    </div>
                `);
            });
        });

        if (galleryItemsHtml.length > 0) {
            // PREPEND API items before existing static images — static images never disappear
            const existingStatic = galleryGrid.innerHTML;
            galleryGrid.innerHTML = galleryItemsHtml.join('') + existingStatic;
        }

        // Re-initialize gallery lightbox and filter from main.js
        reinitGalleryInteractions();
    } catch (e) {
        console.warn('[ContentLoader] Error loading gallery:', e);
        // Keep static gallery on error
    }
}

function reinitGalleryInteractions() {
    // Re-bind filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    const galleryItems = document.querySelectorAll('.gallery-item');

    if (filterButtons.length > 0 && galleryItems.length > 0) {
        filterButtons.forEach(btn => {
            // Remove old listeners by cloning
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);

            newBtn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                newBtn.classList.add('active');
                const filterValue = (newBtn.getAttribute('data-filter') || 'all').toLowerCase();
                document.querySelectorAll('.gallery-item').forEach(item => {
                    const itemCats = (item.getAttribute('data-category') || '').toLowerCase().split(' ');
                    if (filterValue === 'all' || itemCats.includes(filterValue)) {
                        item.style.display = 'block';
                        item.style.animation = 'fadeIn 0.5s ease forwards';
                    } else {
                        item.style.display = 'none';
                    }
                });
            });
        });
    }

    // Re-bind lightbox
    const lightbox = document.querySelector('.lightbox');
    const lightboxImg = document.querySelector('.lightbox-img');
    const lightboxCaption = document.querySelector('.lightbox-caption');

    if (lightbox && lightboxImg) {
        document.querySelectorAll('.gallery-item').forEach(item => {
            item.addEventListener('click', () => {
                const img = item.querySelector('img');
                const caption = item.querySelector('.gallery-caption');
                if (img) lightboxImg.setAttribute('src', img.getAttribute('src'));
                if (caption && lightboxCaption) lightboxCaption.textContent = caption.textContent;
                lightbox.style.display = 'flex';
                document.body.style.overflow = 'hidden';
            });
        });
    }
}

// --- FACULTY PAGE ---------------------------------------

async function loadFaculty() {
    try {
        const result = await EduSphereAPI.get('/faculty');
        const items = result.data;

        const section = document.querySelector('[data-firebase-collection="faculty"]');
        if (!section || !items || items.length === 0) return;

        const grid = section.querySelector('.grid');
        const placeholder = section.querySelector('.placeholder-content');

        if (grid && items.length > 0) {
            grid.innerHTML = items.map(item => {
                const photo = item.photoUrl || item.imageUrl;
                const photoSrc = photo ? EduSphereAPI.resolveUrl(photo) : 'assets/school_building_hero.jpg';
                return `
                <div class="leader-card">
                    <div class="leader-img-wrapper" style="width: 100px; height: 100px;">
                        <img src="${photoSrc}" alt="${item.name || 'Faculty'}" style="width: 100%; height: 100%; object-fit: cover;">
                    </div>
                    <div class="leader-info">
                        <h4>${item.name || ''}</h4>
                        <span class="leader-role" style="font-size: 0.75rem;">${item.designation || item.role || ''}</span>
                        ${item.qualification ? `<span style="font-size: 0.7rem; color: #888; display: block;">${item.qualification}</span>` : ''}
                    </div>
                </div>
                `;
            }).join('');

            // Remove placeholder if data loaded
            if (placeholder) placeholder.style.display = 'none';
        }
    } catch (e) {
        showSectionError();
    }
}

async function loadStaff() {
    try {
        const result = await EduSphereAPI.get('/staff');
        const items = result.data;

        const section = document.querySelector('[data-firebase-collection="staff"]');
        if (!section || !items || items.length === 0) return;

        const placeholder = section.querySelector('.placeholder-content');
        if (!placeholder) return;

        placeholder.outerHTML = `
            <div class="grid grid-4 gap-lg">
                ${items.map(item => {
                    const photo = item.photoUrl || item.imageUrl;
                    const photoSrc = photo ? EduSphereAPI.resolveUrl(photo) : 'assets/school_building_hero.jpg';
                    return `
                    <div class="leader-card">
                        <div class="leader-img-wrapper" style="width: 80px; height: 80px;">
                            <img src="${photoSrc}" alt="${item.name || 'Staff'}" style="width: 100%; height: 100%; object-fit: cover;">
                        </div>
                        <div class="leader-info">
                            <h4>${item.name || ''}</h4>
                            <span class="leader-role" style="font-size: 0.75rem;">${item.designation || item.role || ''}</span>
                        </div>
                    </div>
                    `;
                }).join('')}
            </div>
        `;
    } catch (e) {
        showSectionError();
    }
}

// --- ACHIEVEMENTS PAGE ----------------------------------

async function loadAchievements() {
    try {
        const result = await EduSphereAPI.get('/achievements');
        const items = result.data;

        const grid = document.getElementById('achievementsGrid') || document.querySelector('[data-firebase-collection="student-achievements"] .grid');
        if (!grid) return;

        if (!items || items.length === 0) {
            grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: #64748b;"><i class="fa-solid fa-trophy" style="font-size: 2.5rem; opacity: 0.4; margin-bottom: 1rem; display: block;"></i><p style="font-size: 1.1rem; font-weight: 500;">No student achievements published yet.</p><p style="font-size: 0.9rem;">Check back soon for updates on student excellence!</p></div>';
            return;
        }

        const categoryColors = {
            'sports': { bg: '#ecfdf5', text: '#059669', badgeBg: '#10b981', badgeText: '#fff', icon: 'fa-medal' },
            'academic': { bg: '#fef3c7', text: '#d97706', badgeBg: 'var(--secondary)', badgeText: 'var(--dark)', icon: 'fa-graduation-cap' },
            'cultural': { bg: '#f5f3ff', text: '#7c3aed', badgeBg: '#8b5cf6', badgeText: '#fff', icon: 'fa-masks-theater' },
            'science': { bg: '#e0f2fe', text: '#0284c7', badgeBg: '#0ea5e9', badgeText: '#fff', icon: 'fa-flask' },
            'other': { bg: '#f1f5f9', text: '#475569', badgeBg: '#64748b', badgeText: '#fff', icon: 'fa-award' },
        };

        grid.innerHTML = items.map(item => {
            const rawCat = (item.category || 'academic').toLowerCase();
            const catStyle = categoryColors[rawCat] || categoryColors['academic'];
            const photoUrl = item.imageUrl ? EduSphereAPI.resolveUrl(item.imageUrl) : '';
            const dateStr = item.achievementDate || item.date ? formatFullDate(item.achievementDate || item.date) : '';
            const studentName = item.studentName || '';
            const classGrade = item.classGrade || item.class || '';

            return `
                <div class="card achievement-card" data-category="${rawCat}" style="background: var(--white); border-radius: var(--radius-lg); box-shadow: var(--shadow-md); overflow: hidden; display: flex; flex-direction: column; transition: transform 0.25s ease, box-shadow 0.25s ease; border: 1px solid #e2e8f0;">
                    <!-- Photo or Trophy Header -->
                    <div style="position: relative; width: 100%; height: 210px; background: linear-gradient(135deg, var(--primary) 0%, #1e3a8a 100%); display: flex; align-items: center; justify-content: center; overflow: hidden;">
                        ${photoUrl ? `
                            <img src="${photoUrl}" alt="${studentName || item.title}" style="width: 100%; height: 100%; object-fit: cover; object-position: center top;" onerror="this.onerror=null; this.parentElement.innerHTML='<div style=\\'text-align:center; color:#fff;\\'><i class=\\'fa-solid fa-trophy\\' style=\\'font-size:3rem; color:var(--secondary); margin-bottom:8px; display:block;\\'></i><span style=\\'font-size:0.8rem; font-weight:600;\\'>STUDENT EXCELLENCE</span></div>';">
                        ` : `
                            <div style="text-align: center; color: rgba(255,255,255,0.9); padding: 1.5rem;">
                                <i class="fa-solid fa-trophy" style="font-size: 3.5rem; color: var(--secondary); margin-bottom: 8px; display: block; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));"></i>
                                <span style="font-size: 0.8rem; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">Student Excellence</span>
                            </div>
                        `}
                        <span class="badge" style="position: absolute; top: 12px; right: 12px; background: ${catStyle.badgeBg}; color: ${catStyle.badgeText}; font-weight: 700; text-transform: capitalize; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; box-shadow: 0 2px 6px rgba(0,0,0,0.25);">
                            <i class="fa-solid ${catStyle.icon}"></i> ${item.category || 'Achievement'}
                        </span>
                    </div>

                    <!-- Card Body -->
                    <div style="padding: 1.25rem 1.5rem; flex: 1; display: flex; flex-direction: column;">
                        ${(studentName || classGrade) ? `
                            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 8px; flex-wrap: wrap;">
                                ${studentName ? `
                                    <div style="display: flex; align-items: center; gap: 6px; font-size: 0.95rem; font-weight: 700; color: var(--primary);">
                                        <i class="fa-solid fa-user-graduate" style="color: var(--secondary);"></i>
                                        <span>${studentName}</span>
                                    </div>
                                ` : '<div></div>'}
                                ${classGrade ? `
                                    <span style="font-size: 0.75rem; background: #f1f5f9; color: #475569; padding: 2px 10px; border-radius: 12px; font-weight: 600; border: 1px solid #e2e8f0;">
                                        Class ${classGrade}
                                    </span>
                                ` : ''}
                            </div>
                        ` : ''}

                        <h3 style="font-size: 1.15rem; margin: 4px 0 8px; color: var(--dark); font-weight: 700; line-height: 1.4;">${item.title || ''}</h3>
                        <p class="text-muted" style="font-size: 0.9rem; line-height: 1.6; margin-bottom: 14px; flex: 1;">${item.description || ''}</p>

                        <div style="padding-top: 10px; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; color: #64748b;">
                            ${dateStr ? `<span><i class="fa-regular fa-calendar" style="margin-right: 4px;"></i>${dateStr}</span>` : '<span></span>'}
                            <span style="color: var(--secondary); font-weight: 600;"><i class="fa-solid fa-star"></i> Greenwood Pride</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        setupAchievementFilters();
    } catch (e) {
        console.warn('[Achievements] Error loading achievements:', e.message);
        showSectionError();
    }
}

function setupAchievementFilters() {
    const filterContainer = document.getElementById('achievementFilters');
    if (!filterContainer) return;

    const filterBtns = filterContainer.querySelectorAll('.filter-btn');
    const cards = document.querySelectorAll('.achievement-card');

    filterBtns.forEach(btn => {
        // Remove previous listener by cloning
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);

        newBtn.addEventListener('click', () => {
            const currentFilterBtns = filterContainer.querySelectorAll('.filter-btn');
            currentFilterBtns.forEach(b => b.classList.remove('active'));
            newBtn.classList.add('active');

            const filter = (newBtn.getAttribute('data-filter') || 'all').toLowerCase();
            const currentCards = document.querySelectorAll('.achievement-card');

            currentCards.forEach(card => {
                const cardCat = (card.getAttribute('data-category') || '').toLowerCase();
                if (filter === 'all' || cardCat === filter) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
}

async function loadAwards() {
    try {
        const result = await EduSphereAPI.get('/awards');
        const items = result.data;

        const grid = document.getElementById('awardsGrid') || document.querySelector('[data-firebase-collection="awards"] .grid');
        if (!grid || !items || items.length === 0) return;

        grid.innerHTML = items.map(item => `
            <div class="info-card" style="text-align: center; border-top: 4px solid var(--secondary); background: var(--white); padding: var(--space-xl); border-radius: var(--radius-lg); box-shadow: var(--shadow-md);">
                <i class="fa-solid fa-award" style="font-size: 2.5rem; color: var(--secondary); margin-bottom: 1rem; display: block;"></i>
                <h4 style="font-size: 1.15rem; margin-bottom: 0.5rem; color: var(--dark); font-weight: 700;">${item.title || ''}</h4>
                <p class="text-muted" style="font-size: 0.9rem; line-height: 1.6; margin-bottom: 1rem;">${truncate(item.description || '', 160)}</p>
                <div style="display: flex; justify-content: center; gap: 10px; align-items: center; font-size: 0.85rem; flex-wrap: wrap;">
                    ${item.year ? `<span class="badge badge-gold"><i class="fa-regular fa-calendar-check"></i> ${item.year}</span>` : ''}
                    ${item.recipient ? `<span class="badge badge-info"><i class="fa-solid fa-school"></i> ${item.recipient}</span>` : ''}
                </div>
            </div>
        `).join('');
    } catch (e) {
        console.warn('[Awards] Error loading awards:', e.message);
    }
}

// --- STUDENT LIFE PAGE ----------------------------------

async function loadStudentLife() {
    const categories = [
        { key: 'sports', collection: 'student-life-sports' },
        { key: 'cultural', collection: 'student-life-cultural' },
        { key: 'competitions', collection: 'student-life-competitions' },
        { key: 'trips', collection: 'student-life-trips' },
    ];

    for (const cat of categories) {
        try {
            const result = await EduSphereAPI.get(`/student-life?category=${cat.key}`);
            const items = result.data;

            const section = document.querySelector(`[data-firebase-collection="${cat.collection}"]`);
            if (!section || !items || items.length === 0) continue;

            const placeholder = section.querySelector('.placeholder-content');
            if (!placeholder) continue;

            placeholder.outerHTML = `
                <div class="grid grid-3 gap-lg">
                    ${items.map(item => `
                        <div class="info-card" style="text-align: left;">
                            ${item.imageUrl ? `<img src="${EduSphereAPI.resolveUrl(item.imageUrl)}" alt="${item.title}" style="width: 100%; height: 180px; object-fit: cover; border-radius: 8px; margin-bottom: 1rem;" loading="lazy">` : ''}
                            <h4 style="font-size: 1rem; margin-bottom: 0.5rem;">${item.title || ''}</h4>
                            <p class="text-muted" style="font-size: 0.9rem;">${truncate(item.description || '', 150)}</p>
                        </div>
                    `).join('')}
                </div>
            `;
        } catch (e) {
            // Keep static content for this category
        }
    }
}

// --- PARENTS PAGE ---------------------------------------

async function loadParentDownloads() {
    try {
        const result = await EduSphereAPI.get('/parents/downloads');
        const items = result.data;

        const section = document.querySelector('[data-firebase-collection="parent-downloads"]');
        if (!section) return;

        const container = document.getElementById('downloadsListContainer');
        const filterBar = document.getElementById('classFilterBar');
        if (!container) return;

        if (!items || items.length === 0) {
            container.innerHTML = `
                <div class="empty-downloads">
                    <i class="fa-solid fa-folder-open"></i>
                    <p>No downloads available yet. Check back soon!</p>
                </div>
            `;
            return;
        }

        // Store all items for client-side filtering
        window._parentDownloads = items;

        // Render function
        function renderDownloads(filter) {
            const filtered = filter === 'all'
                ? items
                : items.filter(item => {
                    const grade = (item.classGrade || 'all').toLowerCase();
                    return grade === filter.toLowerCase() || grade === 'all';
                });

            if (filtered.length === 0) {
                container.innerHTML = `
                    <div class="empty-downloads">
                        <i class="fa-solid fa-filter-circle-xmark"></i>
                        <p>No downloads found for this class. Try selecting "All Classes".</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = filtered.map(item => {
                const fileUrl = item.fileUrl ? EduSphereAPI.resolveUrl(item.fileUrl) : '';
                const isPdf = fileUrl.toLowerCase().includes('.pdf');
                const iconClass = isPdf ? 'pdf' : 'doc';
                const iconName = isPdf ? 'fa-file-pdf' : 'fa-file-lines';
                const classLabel = (item.classGrade && item.classGrade !== 'all') ? item.classGrade : 'All Classes';
                const categoryLabel = (item.category || 'circular').charAt(0).toUpperCase() + (item.category || 'circular').slice(1);
                const dateLabel = formatFullDate(item.createdAt);

                return `
                    <div class="download-card">
                        <div class="file-icon ${iconClass}">
                            <i class="fa-solid ${iconName}"></i>
                        </div>
                        <div class="file-meta">
                            <h4>${item.title || 'Untitled Document'}</h4>
                            <div class="meta-tags">
                                <span class="tag-class"><i class="fa-solid fa-graduation-cap"></i> ${classLabel}</span>
                                <span class="tag-category">${categoryLabel}</span>
                                ${dateLabel ? `<span class="tag-date"><i class="fa-regular fa-calendar"></i> ${dateLabel}</span>` : ''}
                            </div>
                            ${item.description ? `<p style="font-size: 0.85rem; color: #666; margin: 6px 0 0;">${truncate(item.description, 120)}</p>` : ''}
                        </div>
                        ${fileUrl ? `<a href="${fileUrl}" target="_blank" class="download-btn"><i class="fa-solid fa-download"></i> Download</a>` : ''}
                    </div>
                `;
            }).join('');
        }

        // Initial render — show all
        renderDownloads('all');

        // Bind class filter buttons
        if (filterBar) {
            filterBar.querySelectorAll('.class-filter-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    filterBar.querySelectorAll('.class-filter-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    const classFilter = btn.getAttribute('data-class') || 'all';
                    renderDownloads(classFilter);
                });
            });
        }
    } catch (e) {
        console.warn('[ContentLoader] Error loading parent downloads:', e);
        const container = document.getElementById('downloadsListContainer');
        if (container) {
            container.innerHTML = `
                <div class="empty-downloads">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    <p>Unable to load downloads. Please try again later.</p>
                </div>
            `;
        }
    }
}

async function loadParentCirculars() {
    try {
        const result = await EduSphereAPI.get('/parents/circulars');
        const items = result.data;

        const section = document.querySelector('[data-firebase-collection="parent-circulars"]');
        if (!section || !items || items.length === 0) return;

        const placeholder = section.querySelector('.placeholder-content');
        if (!placeholder) return;

        placeholder.outerHTML = `
            <div style="display: flex; flex-direction: column; gap: 0;">
                ${items.map(item => `
                    <div style="display: flex; align-items: center; gap: 16px; padding: 1rem 0; border-bottom: 1px solid rgba(0,0,0,0.08);">
                        <i class="fa-solid fa-scroll" style="color: var(--primary); font-size: 1.3rem;"></i>
                        <div style="flex: 1;">
                            <strong style="font-size: 0.95rem;">${item.title || ''}</strong>
                            <div style="font-size: 0.8rem; color: #888;">${formatFullDate(item.date || item.createdAt)}</div>
                        </div>
                        ${item.fileUrl ? `<a href="${item.fileUrl}" target="_blank" style="color: var(--primary); font-weight: 600; font-size: 0.85rem;"><i class="fa-solid fa-eye"></i> View</a>` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    } catch (e) {
        showSectionError();
    }
}

async function loadPta() {
    try {
        const result = await EduSphereAPI.get('/parents/pta');
        const items = result.data;

        const section = document.querySelector('[data-firebase-collection="pta"]');
        if (!section || !items || items.length === 0) return;

        const placeholder = section.querySelector('.placeholder-content');
        if (!placeholder) return;

        placeholder.outerHTML = `
            <div class="grid grid-2 gap-lg">
                ${items.map(item => `
                    <div class="info-card" style="text-align: left;">
                        <h4 style="font-size: 1rem; margin-bottom: 0.5rem;">${item.title || ''}</h4>
                        <p class="text-muted" style="font-size: 0.9rem;">${truncate(item.content || '', 200)}</p>
                        ${item.date ? `<p style="font-size: 0.8rem; color: #888;"><i class="fa-regular fa-calendar"></i> ${formatFullDate(item.date)}</p>` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    } catch (e) {
        showSectionError();
    }
}

// --- ALUMNI PAGE ----------------------------------------

async function loadAlumniStories() {
    try {
        const result = await EduSphereAPI.get('/alumni-content/stories');
        const items = result.data;

        const section = document.querySelector('[data-firebase-collection="alumni-stories"]');
        if (!section || !items || items.length === 0) return;

        const placeholder = section.querySelector('.placeholder-content');
        if (!placeholder) return;

        placeholder.outerHTML = `
            <div class="grid grid-2 gap-lg">
                ${items.map(item => `
                    <div class="info-card" style="text-align: left; border-left: 4px solid var(--primary);">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                            <h4 style="font-size: 1.05rem; margin: 0;">${item.title || ''}</h4>
                            ${item.batch ? `<span style="font-size: 0.75rem; background: var(--primary); color: white; padding: 2px 8px; border-radius: 12px;">Batch ${item.batch}</span>` : ''}
                        </div>
                        <p class="text-muted" style="font-size: 0.9rem; margin-bottom: 0.75rem;">${truncate(item.content || '', 200)}</p>
                        <p style="font-size: 0.85rem; font-weight: 600; color: var(--primary);"><i class="fa-solid fa-user-graduate"></i> ${item.author || ''}</p>
                    </div>
                `).join('')}
            </div>
        `;
    } catch (e) {
        showSectionError();
    }
}

async function loadAlumniEvents() {
    try {
        const result = await EduSphereAPI.get('/alumni-content/events');
        const items = result.data;

        const section = document.querySelector('[data-firebase-collection="alumni-events"]');
        if (!section || !items || items.length === 0) return;

        const placeholder = section.querySelector('.placeholder-content');
        if (!placeholder) return;

        placeholder.outerHTML = `
            <div class="grid grid-3 gap-lg">
                ${items.map(item => {
                    const date = formatDate(item.date);
                    return `
                        <div class="info-card" style="text-align: left; border-top: 4px solid var(--secondary);">
                            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 0.75rem;">
                                <div style="background: var(--secondary); color: var(--dark); padding: 8px 12px; border-radius: 8px; text-align: center; min-width: 50px;">
                                    <div style="font-size: 1.2rem; font-weight: 700; line-height: 1;">${date.day}</div>
                                    <div style="font-size: 0.7rem; text-transform: uppercase;">${date.month}</div>
                                </div>
                                <h4 style="font-size: 1rem; margin: 0;">${item.title || ''}</h4>
                            </div>
                            <p class="text-muted" style="font-size: 0.9rem;">${truncate(item.description || '', 120)}</p>
                            ${item.venue ? `<p style="font-size: 0.8rem; color: var(--primary);"><i class="fa-solid fa-location-dot"></i> ${item.venue}</p>` : ''}
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    } catch (e) {
        showSectionError();
    }
}

// --- ACADEMICS PAGE -------------------------------------

/**
 * loadAcademicPrograms — Fetches programs and updates tab panels + timings cards
 */
async function loadAcademicPrograms() {
    try {
        const result = await EduSphereAPI.get('/academics/programs');
        const programs = result.data;
        if (!programs || programs.length === 0) return;

        programs.forEach(prog => {
            const key = prog.sectionKey;
            if (!key) return;

            // Update tab panel content
            const panel = document.getElementById(key);
            if (panel) {
                const highlights = (prog.highlights || '').split('|').filter(Boolean);
                const highlightsHtml = highlights.length > 0
                    ? `<ul style="margin-top: var(--space-md); list-style: none; padding: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                        ${highlights.map(h => `<li style="font-size: 0.9rem; color: var(--dark);"><i class="fa-solid fa-check-circle" style="color: var(--secondary); margin-right: 6px;"></i>${h.trim()}</li>`).join('')}
                       </ul>`
                    : '';

                const imgSrc = prog.imageUrl ? EduSphereAPI.resolveUrl(prog.imageUrl) : 'assets/school_classroom.jpg';
                const linkHtml = key === 'prePrimary'
                    ? `<div style="margin-top: var(--space-md);"><a href="pre-primary-activities.html" class="btn btn-secondary"><i class="fa-solid fa-shapes"></i> Explore Pre-Primary Activities</a></div>`
                    : '';

                panel.innerHTML = `
                    <div class="grid grid-2 gap-xl" style="align-items: center;">
                        <div>
                            <h3 style="margin-bottom: var(--space-sm); font-size: 1.5rem;">${prog.title}</h3>
                            ${prog.timings ? `<div style="margin-bottom: var(--space-sm);"><span style="font-size: 0.8rem; background: var(--primary); color: white; padding: 4px 12px; border-radius: 16px;"><i class="fa-regular fa-clock"></i> ${prog.timings}</span></div>` : ''}
                            ${prog.ageCriteria ? `<div style="margin-bottom: var(--space-sm);"><span style="font-size: 0.8rem; background: var(--light); padding: 4px 12px; border-radius: 16px;"><i class="fa-solid fa-child"></i> ${prog.ageCriteria}</span></div>` : ''}
                            <p class="text-muted">${prog.content || prog.description || ''}</p>
                            ${highlightsHtml}
                            ${linkHtml}
                        </div>
                        <div>
                            <img src="${imgSrc}" alt="${prog.title}" style="border-radius: var(--radius-lg); box-shadow: var(--shadow-lg); width: 100%;">
                        </div>
                    </div>
                `;
            }

            // Update timings card
            const timingCard = document.getElementById(`timing-${key}`);
            if (timingCard) {
                const timingEl = timingCard.querySelector('.timing-value');
                const ageEl = timingCard.querySelector('.age-value');
                if (timingEl && prog.timings) timingEl.textContent = prog.timings;
                if (ageEl && prog.ageCriteria) ageEl.innerHTML = `<i class="fa-solid fa-child"></i> ${prog.ageCriteria}`;
            }
        });
    } catch (e) {
        console.warn('[Academics] Could not load programs:', e.message);
    }
}

/**
 * loadAcademicCalendar — Fetches calendar events with class filter
 */
async function loadAcademicCalendar() {
    try {
        const result = await EduSphereAPI.get('/academics/calendar');
        const items = result.data;

        const container = document.getElementById('calendarGrid');
        const filterBar = document.getElementById('calendarFilterBar');
        if (!container) return;

        if (!items || items.length === 0) {
            container.innerHTML = '<p class="text-muted text-center" style="grid-column: 1 / -1;">No calendar events scheduled yet.</p>';
            return;
        }

        // Build class filter
        const classes = [...new Set(items.map(i => i.classGrade || 'all'))];
        if (filterBar && classes.length > 1) {
            filterBar.innerHTML = `
                <button class="btn btn-sm btn-primary calendar-filter active" data-filter="all" style="margin: 4px;">All Events</button>
                ${classes.filter(c => c !== 'all').map(c =>
                    `<button class="btn btn-sm btn-outline calendar-filter" data-filter="${c}" style="margin: 4px;">${c}</button>`
                ).join('')}
            `;
            filterBar.addEventListener('click', (e) => {
                const btn = e.target.closest('.calendar-filter');
                if (!btn) return;
                filterBar.querySelectorAll('.calendar-filter').forEach(b => { b.classList.remove('active', 'btn-primary'); b.classList.add('btn-outline'); });
                btn.classList.add('active', 'btn-primary');
                btn.classList.remove('btn-outline');
                const filter = btn.dataset.filter;
                container.querySelectorAll('.calendar-card').forEach(card => {
                    card.style.display = (filter === 'all' || card.dataset.classGrade === filter || card.dataset.classGrade === 'all') ? '' : 'none';
                });
            });
        }

        container.innerHTML = items.map(item => {
            const d = item.eventDate ? new Date(item.eventDate) : null;
            const dayStr = d ? d.getDate() : '?';
            const monthStr = d ? d.toLocaleString('en-IN', { month: 'short' }) : '';
            return `
                <div class="card calendar-card" data-class-grade="${item.classGrade || 'all'}" style="display: flex; align-items: flex-start; gap: var(--space-md); padding: var(--space-md);">
                    <div style="background: var(--primary); color: white; padding: 10px 14px; border-radius: var(--radius-md); text-align: center; min-width: 55px; flex-shrink: 0;">
                        <div style="font-size: 1.3rem; font-weight: 700; line-height: 1;">${dayStr}</div>
                        <div style="font-size: 0.7rem; text-transform: uppercase;">${monthStr}</div>
                    </div>
                    <div style="flex: 1;">
                        <h4 style="margin: 0 0 4px; font-size: 1rem;">${item.title || ''}</h4>
                        ${item.classGrade && item.classGrade !== 'all' ? `<span style="font-size: 0.7rem; background: var(--secondary); padding: 2px 8px; border-radius: 10px;">${item.classGrade}</span>` : ''}
                        ${item.content ? `<p class="text-muted" style="font-size: 0.85rem; margin: 6px 0 0;">${truncate(item.content, 100)}</p>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    } catch (e) {
        console.warn('[Academics] Could not load calendar:', e.message);
    }
}

/**
 * loadSyllabus — Fetches syllabus items with class filter and download links
 */
async function loadSyllabus() {
    try {
        const result = await EduSphereAPI.get('/academics/syllabus');
        const items = result.data;

        const container = document.getElementById('syllabusGrid');
        const filterBar = document.getElementById('syllabusFilterBar');
        if (!container) return;

        if (!items || items.length === 0) {
            container.innerHTML = '<p class="text-muted text-center" style="grid-column: 1 / -1;">No syllabus items available yet.</p>';
            return;
        }

        // Build class filter
        const classes = [...new Set(items.map(i => i.classGrade).filter(Boolean))];
        if (filterBar && classes.length > 1) {
            filterBar.innerHTML = `
                <button class="btn btn-sm btn-primary syllabus-filter active" data-filter="all" style="margin: 4px;">All Classes</button>
                ${classes.map(c =>
                    `<button class="btn btn-sm btn-outline syllabus-filter" data-filter="${c}" style="margin: 4px;">${c}</button>`
                ).join('')}
            `;
            filterBar.addEventListener('click', (e) => {
                const btn = e.target.closest('.syllabus-filter');
                if (!btn) return;
                filterBar.querySelectorAll('.syllabus-filter').forEach(b => { b.classList.remove('active', 'btn-primary'); b.classList.add('btn-outline'); });
                btn.classList.add('active', 'btn-primary');
                btn.classList.remove('btn-outline');
                const filter = btn.dataset.filter;
                container.querySelectorAll('.syllabus-card').forEach(card => {
                    card.style.display = (filter === 'all' || card.dataset.classGrade === filter) ? '' : 'none';
                });
            });
        }

        container.innerHTML = items.map(item => {
            const downloadBtn = item.fileUrl
                ? `<a href="${EduSphereAPI.resolveUrl(item.fileUrl)}" target="_blank" class="btn btn-sm btn-secondary" style="margin-top: var(--space-sm);"><i class="fa-solid fa-download"></i> Download PDF</a>`
                : '';
            return `
                <div class="card syllabus-card" data-class-grade="${item.classGrade || ''}" style="padding: var(--space-md);">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div style="flex: 1;">
                            <h4 style="margin: 0 0 6px; font-size: 1rem;">${item.title || ''}</h4>
                            ${item.classGrade ? `<span style="font-size: 0.75rem; background: var(--light); padding: 2px 10px; border-radius: 12px; font-weight: 600;">${item.classGrade}</span>` : ''}
                        </div>
                        <i class="fa-solid fa-book-open" style="font-size: 1.5rem; color: var(--primary); opacity: 0.3;"></i>
                    </div>
                    ${item.content ? `<p class="text-muted" style="font-size: 0.85rem; margin: 8px 0 0;">${truncate(item.content, 150)}</p>` : ''}
                    ${downloadBtn}
                </div>
            `;
        }).join('');
    } catch (e) {
        console.warn('[Academics] Could not load syllabus:', e.message);
    }
}

/**
 * loadExamInfo — Fetches exam schedules with type badges
 */
async function loadExamInfo() {
    try {
        const result = await EduSphereAPI.get('/academics/exams');
        const items = result.data;

        const container = document.getElementById('examsGrid');
        if (!container) return;

        if (!items || items.length === 0) {
            container.innerHTML = '<p class="text-muted text-center" style="grid-column: 1 / -1;">No exam schedules available yet.</p>';
            return;
        }

        const examTypeColors = {
            'unit-test': 'var(--info, #3b82f6)',
            'mid-term': 'var(--warning, #f59e0b)',
            'final': 'var(--success, #10b981)',
            'prelim': 'var(--danger, #ef4444)',
            'practical': 'var(--purple, #8b5cf6)',
        };

        container.innerHTML = items.map(item => {
            const typeColor = examTypeColors[item.examType] || 'var(--secondary)';
            const typeName = item.examType ? item.examType.replace('-', ' ') : 'exam';
            const dateStr = item.eventDate ? new Date(item.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
            const downloadBtn = item.fileUrl
                ? `<a href="${EduSphereAPI.resolveUrl(item.fileUrl)}" target="_blank" style="font-size: 0.8rem; color: var(--primary); text-decoration: none;"><i class="fa-solid fa-file-pdf"></i> Download Schedule</a>`
                : '';

            return `
                <div class="card" style="padding: var(--space-md); border-top: 3px solid ${typeColor};">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-sm);">
                        <span style="font-size: 0.7rem; background: ${typeColor}; color: white; padding: 3px 10px; border-radius: 12px; text-transform: capitalize; font-weight: 600;">${typeName}</span>
                        ${item.classGrade && item.classGrade !== 'all' ? `<span style="font-size: 0.7rem; background: var(--light); padding: 2px 8px; border-radius: 10px;">${item.classGrade}</span>` : ''}
                    </div>
                    <h4 style="margin: 0 0 6px; font-size: 1rem;">${item.title || ''}</h4>
                    ${dateStr ? `<p style="font-size: 0.8rem; color: #888; margin: 0 0 6px;"><i class="fa-regular fa-calendar"></i> ${dateStr}</p>` : ''}
                    ${item.content ? `<p class="text-muted" style="font-size: 0.85rem; margin: 0 0 6px;">${truncate(item.content, 120)}</p>` : ''}
                    ${downloadBtn}
                </div>
            `;
        }).join('');
    } catch (e) {
        console.warn('[Academics] Could not load exam info:', e.message);
    }
}

// Keep loadCurriculum as alias for backward compatibility
async function loadCurriculum() { return loadSyllabus(); }

// --- SSC TOPPERS LOADERS ---------------------------------

/**
 * loadHomeToppers — Renders latest year's top 3 SSC scorers on Homepage
 */
async function loadHomeToppers() {
    try {
        const grid = document.getElementById('homeToppersGrid');
        if (!grid) return;

        const result = await EduSphereAPI.get('/ssc-toppers/latest');
        const data = result.data;
        if (!data || !data.toppers || data.toppers.length === 0) return;

        const subtitle = document.getElementById('homeToppersSubtitle');
        if (subtitle && data.year) {
            subtitle.textContent = `Celebrating the top academic achievers of Batch ${data.year} upholding our continuous 100% SSC pass legacy.`;
        }

        const rankBadges = {
            1: { label: '?? 1st Rank (School Topper)', bg: '#fef08a', text: '#854d0e', border: '#eab308', pillBg: 'linear-gradient(135deg, #ca8a04 0%, #a16207 100%)' },
            2: { label: '?? 2nd Rank', bg: '#f1f5f9', text: '#334155', border: '#94a3b8', pillBg: 'linear-gradient(135deg, var(--primary) 0%, #1e3a8a 100%)' },
            3: { label: '?? 3rd Rank', bg: '#ffedd5', text: '#9a3412', border: '#d97706', pillBg: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)' },
        };

        grid.innerHTML = data.toppers.map(item => {
            const rank = item.rankNum || 1;
            const rBadge = rankBadges[rank] || { label: `Rank ${rank}`, bg: '#f1f5f9', text: '#475569', border: '#cbd5e1', pillBg: 'linear-gradient(135deg, var(--primary) 0%, #1e3a8a 100%)' };
            const photoUrl = item.imageUrl ? EduSphereAPI.resolveUrl(item.imageUrl) : '';

            return `
                <div class="card" style="background:var(--white); border-radius:var(--radius-lg); box-shadow:var(--shadow-md); padding:1.75rem 1.25rem; text-align:center; border:2px solid ${rBadge.border}; display:flex; flex-direction:column; justify-content:space-between; transition:transform 0.25s, box-shadow 0.25s;">
                    <div>
                        <span class="badge" style="background:${rBadge.bg}; color:${rBadge.text}; font-weight:800; font-size:0.85rem; padding:4px 14px; border-radius:20px; margin-bottom:1rem; display:inline-block;">
                            ${rBadge.label}
                        </span>

                        <div style="width:115px; height:115px; margin:0 auto 1rem; border-radius:50%; padding:3px; background:${rBadge.pillBg}; box-shadow:0 4px 12px rgba(0,0,0,0.15);">
                            ${photoUrl ? `
                                <img src="${photoUrl}" alt="${item.studentName}" style="width:100%; height:100%; object-fit:cover; border-radius:50%; border:2px solid #fff;" onerror="this.onerror=null; this.parentElement.innerHTML='<div style=\\'width:100%; height:100%; border-radius:50%; background:var(--primary); color:#fff; display:flex; align-items:center; justify-content:center; font-size:2.2rem; border:2px solid #fff;\\'><i class=\\'fa-solid fa-graduation-cap\\'></i></div>';">
                            ` : `
                                <div style="width:100%; height:100%; border-radius:50%; background:var(--primary); color:#fff; display:flex; align-items:center; justify-content:center; font-size:2.2rem; border:2px solid #fff;">
                                    <i class="fa-solid fa-graduation-cap"></i>
                                </div>
                            `}
                        </div>

                        <h3 style="font-size:1.25rem; margin:0 0 6px; color:var(--dark); font-weight:700;">${item.studentName || ''}</h3>
                        
                        <div style="display:inline-block; background:${rBadge.pillBg}; color:#fff; font-size:1.35rem; font-weight:800; padding:4px 18px; border-radius:20px; margin:6px 0; letter-spacing:0.5px; box-shadow:0 2px 8px rgba(0,0,0,0.15);">
                            ${item.percentage || ''}
                        </div>

                        ${item.totalMarks ? `<p style="font-size:0.85rem; color:#64748b; font-weight:600; margin:4px 0 0;"><i class="fa-solid fa-calculator" style="margin-right:4px;"></i>${item.totalMarks}</p>` : ''}
                        ${item.remarks ? `<p class="text-muted" style="font-size:0.85rem; margin:8px 0 0; line-height:1.4;">${truncate(item.remarks, 80)}</p>` : ''}
                    </div>

                    <div style="margin-top:1rem; padding-top:0.75rem; border-top:1px solid #f1f5f9; font-size:0.75rem; color:#94a3b8; font-weight:600;">
                        <i class="fa-solid fa-calendar-check" style="margin-right:4px;"></i>Batch ${item.academicYear || data.year}
                    </div>
                </div>
            `;
        }).join('');
    } catch (e) {
        console.warn('[HomeToppers] Error loading home toppers:', e.message);
    }
}

/**
 * loadSscToppers — Handles year selection and podium rendering on ssc-toppers.html
 */
async function loadSscToppers() {
    try {
        const podiumContainer = document.getElementById('toppersPodium');
        const filterContainer = document.getElementById('topperYearFilters');
        if (!podiumContainer) return;

        // 1. Fetch available distinct academic years
        const yearsRes = await EduSphereAPI.get('/ssc-toppers/years');
        const years = yearsRes.data || [];

        if (years.length === 0) {
            podiumContainer.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: #64748b;"><i class="fa-solid fa-medal" style="font-size: 3rem; opacity: 0.3; margin-bottom: 1rem; display: block;"></i><p style="font-size: 1.1rem; font-weight: 500;">No SSC toppers published yet.</p></div>';
            return;
        }

        // 2. Render Year Filter Buttons
        if (filterContainer) {
            filterContainer.innerHTML = years.map((yr, idx) => `
                <button class="year-btn ${idx === 0 ? 'active' : ''}" data-year="${yr}">
                    <i class="fa-solid fa-calendar-days"></i> Batch ${yr}
                </button>
            `).join('');

            // Add click listeners to year buttons
            const btns = filterContainer.querySelectorAll('.year-btn');
            btns.forEach(btn => {
                btn.addEventListener('click', () => {
                    btns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    const selectedYear = btn.getAttribute('data-year');
                    renderToppersForYear(selectedYear);
                });
            });
        }

        // 3. Render initial year (first / latest)
        await renderToppersForYear(years[0]);

    } catch (e) {
        console.warn('[SscToppers] Error loading page:', e.message);
    }
}

async function renderToppersForYear(year) {
    const podiumContainer = document.getElementById('toppersPodium');
    const headerTitle = document.getElementById('topperBatchHeader');
    const additionalSection = document.getElementById('additionalToppersSection');
    const additionalGrid = document.getElementById('additionalToppersGrid');

    if (!podiumContainer) return;

    if (headerTitle) {
        headerTitle.textContent = `Honoring the top academic rankers of Greenwood Public School for Academic Year ${year}.`;
    }

    try {
        const res = await EduSphereAPI.get(`/ssc-toppers?year=${encodeURIComponent(year)}`);
        const toppers = res.data || [];

        if (toppers.length === 0) {
            podiumContainer.innerHTML = `<p style="grid-column: 1 / -1; text-align: center; color: #64748b;">No toppers listed for academic year ${year}.</p>`;
            if (additionalSection) additionalSection.style.display = 'none';
            return;
        }

        // Separate top 3 (rank 1, 2, 3) from rank 4+
        const top3 = toppers.filter(t => (t.rankNum || 1) <= 3);
        const rank4Plus = toppers.filter(t => (t.rankNum || 1) > 3);

        // Find specific ranks
        const rank1 = top3.find(t => t.rankNum == 1);
        const rank2 = top3.find(t => t.rankNum == 2);
        const rank3 = top3.find(t => t.rankNum == 3);

        // Podium layout order: Rank 2 (Left), Rank 1 (Center / Elevated), Rank 3 (Right)
        const orderedTop3 = [];
        if (rank2) orderedTop3.push({ ...rank2, displayRank: 2 });
        if (rank1) orderedTop3.push({ ...rank1, displayRank: 1 });
        if (rank3) orderedTop3.push({ ...rank3, displayRank: 3 });

        // If records didn't have exact 1, 2, 3 rankNums, fallback to array order
        const displayItems = orderedTop3.length > 0 ? orderedTop3 : top3.map((item, idx) => ({ ...item, displayRank: item.rankNum || (idx + 1) }));

        podiumContainer.innerHTML = displayItems.map(item => {
            const r = item.displayRank || item.rankNum || 1;
            const photoUrl = item.imageUrl ? EduSphereAPI.resolveUrl(item.imageUrl) : '';

            let crownClass = 'rank-crown-1';
            let crownText = '<i class="fa-solid fa-crown"></i> 1st Rank (Topper)';
            if (r === 2) { crownClass = 'rank-crown-2'; crownText = '<i class="fa-solid fa-medal"></i> 2nd Rank'; }
            if (r === 3) { crownClass = 'rank-crown-3'; crownText = '<i class="fa-solid fa-award"></i> 3rd Rank'; }

            return `
                <div class="topper-card rank-${r}">
                    <span class="topper-rank-crown ${crownClass}">${crownText}</span>

                    <div class="topper-photo-wrap">
                        ${photoUrl ? `
                            <img src="${photoUrl}" alt="${item.studentName}" class="topper-img" onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'topper-photo-placeholder\\'><i class=\\'fa-solid fa-user-graduate\\'></i></div>';">
                        ` : `
                            <div class="topper-photo-placeholder"><i class="fa-solid fa-user-graduate"></i></div>
                        `}
                    </div>

                    <div style="padding: 0 1.5rem 1.5rem; flex: 1; display: flex; flex-direction: column;">
                        <h3 style="font-size: 1.35rem; margin: 0 0 6px; color: var(--dark); font-weight: 800;">${item.studentName || ''}</h3>

                        <div>
                            <span class="percentage-pill">${item.percentage || ''}</span>
                        </div>

                        ${item.totalMarks ? `<p style="font-size: 0.95rem; font-weight: 700; color: #475569; margin: 4px 0 0;"><i class="fa-solid fa-calculator" style="color:var(--secondary); margin-right:6px;"></i>Score: ${item.totalMarks}</p>` : ''}
                        ${item.stream ? `<p style="font-size: 0.85rem; color: #64748b; margin: 4px 0 0;">${item.stream}</p>` : ''}

                        ${item.remarks ? `
                            <div style="margin-top: 1rem; padding: 8px 12px; background: #f8fafc; border-radius: 8px; font-size: 0.85rem; color: #334155; line-height: 1.5; border-left: 3px solid var(--secondary);">
                                <i class="fa-solid fa-quote-left" style="color:var(--secondary); margin-right:4px;"></i> ${item.remarks}
                            </div>
                        ` : ''}

                        <div style="margin-top: auto; padding-top: 1rem; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; color: #94a3b8; font-weight: 600;">
                            <span><i class="fa-regular fa-calendar-check" style="margin-right:4px;"></i>Batch ${item.academicYear || year}</span>
                            <span style="color: var(--secondary); font-weight: 700;"><i class="fa-solid fa-star"></i> Greenwood Pride</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Handle Rank 4+ if any
        if (additionalSection && additionalGrid) {
            if (rank4Plus.length > 0) {
                additionalSection.style.display = 'block';
                additionalGrid.innerHTML = rank4Plus.map(item => {
                    const photoUrl = item.imageUrl ? EduSphereAPI.resolveUrl(item.imageUrl) : '';
                    return `
                        <div class="card" style="background:var(--white); border-radius:var(--radius-lg); box-shadow:var(--shadow-sm); padding:1.25rem; display:flex; align-items:center; gap:1rem; border:1px solid #e2e8f0;">
                            <div style="width:65px; height:65px; border-radius:50%; overflow:hidden; flex-shrink:0; background:var(--primary); color:#fff; display:flex; align-items:center; justify-content:center;">
                                ${photoUrl ? `<img src="${photoUrl}" alt="${item.studentName}" style="width:100%; height:100%; object-fit:cover;">` : '<i class="fa-solid fa-user-graduate" style="font-size:1.5rem;"></i>'}
                            </div>
                            <div style="flex:1;">
                                <div style="display:flex; justify-content:space-between; align-items:center;">
                                    <h4 style="margin:0; font-size:1.05rem;">${item.studentName}</h4>
                                    <span class="badge badge-gold" style="font-weight:700;">${item.percentage}</span>
                                </div>
                                <span style="font-size:0.75rem; color:#64748b;">Rank ${item.rankNum} • ${item.totalMarks || ''}</span>
                                ${item.remarks ? `<p style="font-size:0.8rem; color:#475569; margin:4px 0 0;">${item.remarks}</p>` : ''}
                            </div>
                        </div>
                    `;
                }).join('');
            } else {
                additionalSection.style.display = 'none';
            }
        }

    } catch (e) {
        console.warn('[SscToppers] Error rendering year:', e.message);
    }
}
