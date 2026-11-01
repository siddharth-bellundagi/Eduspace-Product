/**
 * admin-dashboard.js — Admin Control Panel Application Script
 * 
 * Manages administrative workflow for Greenwood Public School:
 *   - Authentication protection check
 *   - Backend system health check indicator
 *   - Sidebar module navigation
 *   - Dynamic data tables & pagination
 *   - Search & filtering
 *   - Complete CRUD operations (Create, Read, Update, Delete) via EduSphereAPI
 */

const AdminDashboard = (() => {
    // --- Application State -----------------------------
    let currentModule = 'announcements';
    let currentPage = 1;
    const limit = 50;
    let moduleData = [];
    let filteredData = [];
    let editingItemId = null;

    // --- Module Definitions & Schemas ------------------
    const MODULES = {
        announcements: {
            title: 'Announcements',
            endpoint: '/news/announcements',
            adminEndpoint: '/news/announcements/all',
            columns: [
                { key: 'title', label: 'Title' },
                { key: 'priority', label: 'Priority', format: (val) => `<span class="badge badge-${getPriorityBadge(val)}">${val || 'low'}</span>` },
                { key: 'isActive', label: 'Status', format: (val) => val !== false ? '<span class="badge badge-success">Active</span>' : '<span class="badge badge-neutral">Inactive</span>' },
                { key: 'createdAt', label: 'Created Date', format: (val) => formatDate(val) },
            ],
            fields: [
                { name: 'title', label: 'Announcement Title', type: 'text', required: true, fullWidth: true },
                { name: 'priority', label: 'Priority Level', type: 'select', options: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
                { name: 'isActive', label: 'Active Status', type: 'select', options: [{ val: true, label: 'Active' }, { val: false, label: 'Inactive' }], default: true },
                { name: 'expiresAt', label: 'Expiration Date (Optional)', type: 'date' },
                { name: 'content', label: 'Announcement Content', type: 'textarea', required: true, fullWidth: true },
            ]
        },
        ticker: {
            title: 'News Ticker Items',
            endpoint: '/news/ticker',
            adminEndpoint: '/news/ticker/all',
            columns: [
                { key: 'text', label: 'Ticker Message' },
                { key: 'order', label: 'Display Order' },
                { key: 'isActive', label: 'Status', format: (val) => val !== false ? '<span class="badge badge-success">Active</span>' : '<span class="badge badge-neutral">Inactive</span>' },
            ],
            fields: [
                { name: 'text', label: 'Ticker Text', type: 'textarea', required: true, fullWidth: true },
                { name: 'link', label: 'Click Link URL (Optional)', type: 'text', fullWidth: true },
                { name: 'order', label: 'Display Order (0-100)', type: 'number', default: 0 },
                { name: 'isActive', label: 'Active Status', type: 'select', options: [{ val: true, label: 'Active' }, { val: false, label: 'Inactive' }], default: true },
            ]
        },
        events: {
            title: 'Upcoming Events',
            endpoint: '/events',
            adminEndpoint: '/events/all',
            columns: [
                { key: 'title', label: 'Event Title' },
                { key: 'date', label: 'Event Date', format: (val) => formatDate(val) },
                { key: 'time', label: 'Time' },
                { key: 'venue', label: 'Venue' },
                { key: 'isActive', label: 'Status', format: (val) => val !== false ? '<span class="badge badge-success">Active</span>' : '<span class="badge badge-neutral">Inactive</span>' },
            ],
            fields: [
                { name: 'title', label: 'Event Title', type: 'text', required: true, fullWidth: true },
                { name: 'date', label: 'Event Date', type: 'date', required: true },
                { name: 'time', label: 'Time (e.g. 10:00 AM)', type: 'text' },
                { name: 'venue', label: 'Venue Location', type: 'text', fullWidth: true },
                { name: 'isActive', label: 'Active Status', type: 'select', options: [{ val: true, label: 'Active' }, { val: false, label: 'Inactive' }], default: true },
                { name: 'description', label: 'Event Description', type: 'textarea', required: true, fullWidth: true },
            ]
        },
        gallery: {
            title: 'Photo Gallery & Albums',
            endpoint: '/gallery',
            adminEndpoint: '/gallery/all',
            columns: [
                { 
                    key: 'imageUrl', 
                    label: 'Preview', 
                    format: (val, item) => {
                        const count = item.images && item.images.length ? item.images.length : (val ? 1 : 0);
                        const img = val ? `<img src="${EduSphereAPI.resolveUrl(val)}" style="width: 52px; height: 36px; object-fit: cover; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">` : '<div style="width: 52px; height: 36px; background: #f1f5f9; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 10px;">No Img</div>';
                        return `<div style="display: flex; align-items: center; gap: 8px;">${img} <span class="badge badge-info" title="${count} photo(s)"><i class="fa-solid fa-images"></i> ${count}</span></div>`;
                    } 
                },
                { key: 'title', label: 'Album / Photo Title' },
                { key: 'classGrade', label: 'Class / Grade', format: (val) => val ? `<span class="badge badge-gold">${val}</span>` : '<span style="color:#94a3b8;">General</span>' },
                { key: 'category', label: 'Category', format: (val) => `<span class="badge badge-neutral">${val || 'campus'}</span>` },
                { key: 'isActive', label: 'Status', format: (val) => val !== false ? '<span class="badge badge-success">Active</span>' : '<span class="badge badge-neutral">Inactive</span>' },
            ],
            fields: [
                { name: 'title', label: 'Album / Photo Title', type: 'text', required: true, fullWidth: true, placeholder: 'e.g. Science Exhibition 2026, Annual Sports Meet' },
                { 
                    name: 'classGrade', 
                    label: 'Target Class / Grade (Class-wise Gallery)', 
                    type: 'select', 
                    options: [
                        { val: '', label: 'All Classes / Whole School' },
                        { val: 'Nursery', label: 'Pre-Primary: Nursery' },
                        { val: 'Jr. KG', label: 'Pre-Primary: Jr. KG' },
                        { val: 'Sr. KG', label: 'Pre-Primary: Sr. KG' },
                        { val: 'Class 1', label: 'Class 1' },
                        { val: 'Class 2', label: 'Class 2' },
                        { val: 'Class 3', label: 'Class 3' },
                        { val: 'Class 4', label: 'Class 4' },
                        { val: 'Class 5', label: 'Class 5' },
                        { val: 'Class 6', label: 'Class 6' },
                        { val: 'Class 7', label: 'Class 7' },
                        { val: 'Class 8', label: 'Class 8' },
                        { val: 'Class 9', label: 'Class 9' },
                        { val: 'Class 10', label: 'Class 10' }
                    ], 
                    default: '' 
                },
                { 
                    name: 'category', 
                    label: 'Gallery Category', 
                    type: 'select', 
                    options: ['campus', 'pre-primary', 'academics', 'sports', 'cultural', 'trips', 'events', 'celebrations', 'other'], 
                    default: 'campus' 
                },
                { name: 'isActive', label: 'Active Status', type: 'select', options: [{ val: true, label: 'Active' }, { val: false, label: 'Inactive' }], default: true },
                { 
                    name: 'images', 
                    label: 'Upload Photos (Select Multiple in 1-Click)', 
                    type: 'file', 
                    multiple: true, 
                    fullWidth: true,
                    accept: 'image/jpeg,image/png,image/webp,image/jpg',
                    helpText: 'Select one or multiple photos (Hold Ctrl / Shift while selecting). All will be uploaded under this single title.'
                },
                { name: 'description', label: 'Album Description / Details', type: 'textarea', fullWidth: true, placeholder: 'Brief summary of the activity or event...' },
            ]
        },
        faculty: {
            title: 'Faculty & Staff',
            endpoint: '/faculty',
            adminEndpoint: '/faculty/all',
            columns: [
                { 
                    key: 'photoUrl', 
                    label: 'Photo', 
                    format: (val, item) => {
                        const img = val || item.imageUrl;
                        return img ? `<img src="${EduSphereAPI.resolveUrl(img)}" style="width: 38px; height: 38px; border-radius: 50%; object-fit: cover; border: 2px solid #e2e8f0;">` : `<div style="width: 38px; height: 38px; border-radius: 50%; background: #e2e8f0; display: flex; align-items: center; justify-content: center; color: #64748b; font-size: 14px;"><i class="fa-solid fa-user"></i></div>`;
                    }
                },
                { key: 'name', label: 'Name' },
                { key: 'designation', label: 'Designation' },
                { key: 'department', label: 'Department' },
                { key: 'orderNum', label: 'Order', format: (val, item) => item.order !== undefined ? item.order : (val !== undefined ? val : 0) },
                { key: 'isActive', label: 'Status', format: (val) => val !== false ? '<span class="badge badge-success">Active</span>' : '<span class="badge badge-neutral">Inactive</span>' },
            ],
            fields: [
                { name: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'e.g. Dr. Ramesh Sharma' },
                { name: 'designation', label: 'Designation / Role', type: 'text', required: true, placeholder: 'e.g. Principal, Senior Science Teacher' },
                { name: 'department', label: 'Department / Section', type: 'text', placeholder: 'e.g. Science, Mathematics, Primary Section' },
                { name: 'qualification', label: 'Qualification', type: 'text', placeholder: 'e.g. M.Sc., B.Ed.' },
                { name: 'experience', label: 'Years of Experience', type: 'text', placeholder: 'e.g. 10 Years' },
                { name: 'email', label: 'Email Address (Optional)', type: 'email' },
                { name: 'order', label: 'Display Order (Ascending)', type: 'number', default: 0 },
                { name: 'isActive', label: 'Active Status', type: 'select', options: [{ val: true, label: 'Active' }, { val: false, label: 'Inactive' }], default: true },
                { 
                    name: 'photo', 
                    label: 'Faculty Photo (Upload Image)', 
                    type: 'file', 
                    fullWidth: true,
                    accept: 'image/jpeg,image/png,image/webp,image/jpg',
                    helpText: 'Upload a clear passport or portrait photo (JPG, PNG, WebP)'
                },
            ]
        },
        admissions: {
            title: 'Admission Enquiries',
            endpoint: '/admissions',
            adminEndpoint: '/admissions',
            readOnlyModule: true,
            columns: [
                { key: 'studentName', label: 'Student Name' },
                { key: 'parentName', label: 'Parent Name' },
                { key: 'classApplied', label: 'Class Applied' },
                { key: 'phone', label: 'Phone' },
                { key: 'status', label: 'Status', format: (val) => `<span class="badge badge-${getStatusBadge(val)}">${val || 'new'}</span>` },
                { key: 'createdAt', label: 'Submitted Date', format: (val) => formatDate(val) },
            ],
            fields: [
                { name: 'status', label: 'Update Status', type: 'select', options: ['new', 'read', 'replied', 'archived'], required: true },
                { name: 'adminNotes', label: 'Admin Internal Notes', type: 'textarea', fullWidth: true },
            ]
        },
        contact: {
            title: 'Contact Messages',
            endpoint: '/contact',
            adminEndpoint: '/contact',
            readOnlyModule: true,
            columns: [
                { key: 'name', label: 'Sender Name' },
                { key: 'email', label: 'Email' },
                { key: 'subject', label: 'Subject' },
                { key: 'status', label: 'Status', format: (val) => `<span class="badge badge-${getStatusBadge(val)}">${val || 'new'}</span>` },
                { key: 'createdAt', label: 'Received Date', format: (val) => formatDate(val) },
            ],
            fields: [
                { name: 'status', label: 'Update Status', type: 'select', options: ['new', 'read', 'replied', 'archived'], required: true },
                { name: 'adminNotes', label: 'Admin Internal Notes', type: 'textarea', fullWidth: true },
            ]
        },
        alumni: {
            title: 'Alumni Registrations',
            endpoint: '/alumni',
            adminEndpoint: '/alumni',
            readOnlyModule: true,
            noCreate: true,
            columns: [
                { key: 'name', label: 'Alumni Name' },
                { key: 'passoutYear', label: 'Passout Year' },
                { key: 'email', label: 'Email' },
                { key: 'phone', label: 'Phone' },
                { key: 'currentOccupation', label: 'Occupation' },
            ],
            fields: []
        },
        downloads: {
            title: 'Parent Downloads',
            endpoint: '/parents/downloads',
            adminEndpoint: '/parents/downloads/all',
            columns: [
                { key: 'title', label: 'Document Title' },
                { key: 'classGrade', label: 'Class', format: (val) => `<span class="badge badge-info">${val || 'All'}</span>` },
                { key: 'category', label: 'Category', format: (val) => `<span class="badge badge-gold">${val || 'circular'}</span>` },
                { key: 'fileUrl', label: 'File', format: (val) => val ? `<a href="${EduSphereAPI.resolveUrl(val)}" target="_blank" style="color: #2563eb;"><i class="fa-solid fa-file-pdf"></i> View File</a>` : 'No file' },
                { key: 'isActive', label: 'Status', format: (val) => val !== false ? '<span class="badge badge-success">Active</span>' : '<span class="badge badge-neutral">Inactive</span>' },
            ],
            fields: [
                { name: 'title', label: 'Document Title', type: 'text', required: true, fullWidth: true },
                { name: 'classGrade', label: 'For Class', type: 'select', options: [
                    { val: 'all', label: 'All Classes' },
                    { val: 'Nursery', label: 'Nursery' },
                    { val: 'Jr. KG', label: 'Jr. KG' },
                    { val: 'Sr. KG', label: 'Sr. KG' },
                    { val: 'Class 1', label: 'Class 1' },
                    { val: 'Class 2', label: 'Class 2' },
                    { val: 'Class 3', label: 'Class 3' },
                    { val: 'Class 4', label: 'Class 4' },
                    { val: 'Class 5', label: 'Class 5' },
                    { val: 'Class 6', label: 'Class 6' },
                    { val: 'Class 7', label: 'Class 7' },
                    { val: 'Class 8', label: 'Class 8' },
                    { val: 'Class 9', label: 'Class 9' },
                    { val: 'Class 10', label: 'Class 10' }
                ], default: 'all' },
                { name: 'category', label: 'Category', type: 'select', options: ['circular', 'forms', 'syllabus', 'timetable', 'report', 'other'], default: 'circular' },
                { name: 'isActive', label: 'Active Status', type: 'select', options: [{ val: true, label: 'Active' }, { val: false, label: 'Inactive' }], default: true },
                { name: 'file', label: 'Upload PDF / Document', type: 'file', fullWidth: true },
                { name: 'description', label: 'Description (Optional)', type: 'textarea', fullWidth: true },
            ]
        },
        achievements: {
            title: 'Student Achievements',
            endpoint: '/achievements',
            adminEndpoint: '/achievements/all',
            columns: [
                { key: 'imageUrl', label: 'Photo', format: (val) => val ? `<img src="${EduSphereAPI.resolveUrl(val)}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;border:1px solid #cbd5e1;">` : '<span style="color:#94a3b8;font-size:0.75rem;">No Photo</span>' },
                { key: 'title', label: 'Achievement Title' },
                { key: 'studentName', label: 'Student' },
                { key: 'classGrade', label: 'Class', format: (val, item) => val || item.class || '-' },
                { key: 'category', label: 'Category', format: (val) => `<span class="badge badge-gold">${val || 'academic'}</span>` },
                { key: 'isActive', label: 'Status', format: (val) => val !== false ? '<span class="badge badge-success">Active</span>' : '<span class="badge badge-neutral">Inactive</span>' },
            ],
            fields: [
                { name: 'title', label: 'Achievement Title', type: 'text', required: true, fullWidth: true },
                { name: 'studentName', label: 'Student Name', type: 'text', placeholder: 'e.g. Rahul Sharma' },
                { name: 'classGrade', label: 'Class / Grade', type: 'text', placeholder: 'e.g. 5, 8, 10' },
                { name: 'category', label: 'Category', type: 'select', options: ['academic', 'sports', 'cultural', 'science', 'other'], default: 'academic' },
                { name: 'date', label: 'Date (Optional)', type: 'date' },
                { name: 'isActive', label: 'Active Status', type: 'select', options: [{ val: true, label: 'Active' }, { val: false, label: 'Inactive' }], default: true },
                { name: 'image', label: 'Student Photo', type: 'file', accept: 'image/*', fullWidth: true, helpText: 'Upload student photo for this achievement (JPG, PNG, WebP)' },
                { name: 'description', label: 'Achievement Description', type: 'textarea', required: true, fullWidth: true },
            ]
        },
                toppers: {
            title: 'SSC Toppers',
            endpoint: '/ssc-toppers',
            adminEndpoint: '/ssc-toppers/all',
            columns: [
                { key: 'imageUrl', label: 'Photo', format: (val) => val ? `<img src="${EduSphereAPI.resolveUrl(val)}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;border:1px solid #cbd5e1;">` : '<span style="color:#94a3b8;font-size:0.75rem;">No Photo</span>' },
                { key: 'studentName', label: 'Student Name' },
                { key: 'academicYear', label: 'Year', format: (val) => `<span class="badge badge-info">${val || ''}</span>` },
                { key: 'rankNum', label: 'Rank', format: (val) => {
                    if (val == 1) return '<span class="badge" style="background:#fef08a;color:#854d0e;font-weight:700;">?? 1st Rank</span>';
                    if (val == 2) return '<span class="badge" style="background:#e2e8f0;color:#334155;font-weight:700;">?? 2nd Rank</span>';
                    if (val == 3) return '<span class="badge" style="background:#fed7aa;color:#9a3412;font-weight:700;">?? 3rd Rank</span>';
                    return `<span class="badge badge-neutral">Rank ${val}</span>`;
                }},
                { key: 'percentage', label: 'Percentage', format: (val) => `<strong style="color:var(--primary); font-size:1.05rem;">${val || ''}</strong>` },
                { key: 'totalMarks', label: 'Marks', format: (val) => val || '-' },
                { key: 'isActive', label: 'Status', format: (val) => val !== false ? '<span class="badge badge-success">Active</span>' : '<span class="badge badge-neutral">Inactive</span>' },
            ],
            fields: [
                { name: 'studentName', label: 'Student Full Name', type: 'text', required: true, placeholder: 'e.g. Aarohi Sharma' },
                { name: 'academicYear', label: 'Academic Year', type: 'text', required: true, placeholder: 'e.g. 2024-25 or 2025-26' },
                { name: 'rankNum', label: 'Rank / Position', type: 'select', options: [
                    { val: 1, label: '?? 1st Rank (Highest Scorer)' },
                    { val: 2, label: '?? 2nd Rank' },
                    { val: 3, label: '?? 3rd Rank' },
                    { val: 4, label: '4th Rank / Merit' },
                    { val: 5, label: '5th Rank / Merit' }
                ], default: 1 },
                { name: 'percentage', label: 'Percentage / Score', type: 'text', required: true, placeholder: 'e.g. 96.40%' },
                { name: 'totalMarks', label: 'Total Marks (Optional)', type: 'text', placeholder: 'e.g. 482 / 500' },
                { name: 'stream', label: 'Medium / Stream', type: 'text', placeholder: 'e.g. English Medium', default: 'English Medium' },
                { name: 'isActive', label: 'Active Status', type: 'select', options: [{ val: true, label: 'Active' }, { val: false, label: 'Inactive' }], default: true },
                { name: 'image', label: 'Student Photo', type: 'file', accept: 'image/*', fullWidth: true, helpText: 'Upload student photo (JPG, PNG, WebP)' },
                { name: 'remarks', label: 'Special Highlights / Remarks (Optional)', type: 'textarea', placeholder: 'e.g. 100/100 in Mathematics, School Highest', fullWidth: true },
            ]
        },
        academicPrograms: {
            title: 'Academic Programs',
            endpoint: '/academics/programs',
            adminEndpoint: '/academics/programs/all',
            columns: [
                { key: 'title', label: 'Program Name' },
                { key: 'sectionKey', label: 'Section', format: (val) => `<span class="badge badge-info">${val || ''}</span>` },
                { key: 'timings', label: 'Daily Timings' },
                { key: 'ageCriteria', label: 'Age Criteria' },
                { key: 'isActive', label: 'Status', format: (val) => val !== false ? '<span class="badge badge-success">Active</span>' : '<span class="badge badge-neutral">Inactive</span>' },
            ],
            fields: [
                { name: 'title', label: 'Program Title', type: 'text', required: true, fullWidth: true },
                { name: 'sectionKey', label: 'Section Key', type: 'select', options: [
                    { val: 'prePrimary', label: 'Pre-Primary' },
                    { val: 'primary', label: 'Primary (Grades 1-4)' },
                    { val: 'secondary', label: 'Secondary (Grades 5-10)' }
                ], required: true },
                { name: 'timings', label: 'Daily Timings (e.g. 9:00 AM – 12:30 PM)', type: 'text' },
                { name: 'ageCriteria', label: 'Age Criteria (e.g. Nursery: 2.5+, Jr. KG: 3.5+)', type: 'text' },
                { name: 'isActive', label: 'Active Status', type: 'select', options: [{ val: true, label: 'Active' }, { val: false, label: 'Inactive' }], default: true },
                { name: 'image', label: 'Program Photo', type: 'file', accept: 'image/*', fullWidth: true, helpText: 'Upload high-resolution image for this academic section' },
                { name: 'highlights', label: 'Key Highlights (separated with |)', type: 'textarea', placeholder: 'Play-based learning|Phonics & early reading|Creative arts & crafts', fullWidth: true },
                { name: 'description', label: 'Detailed Description', type: 'textarea', required: true, fullWidth: true },
            ]
        },
        academicCalendar: {
            title: 'Academic Calendar',
            endpoint: '/academics/calendar',
            adminEndpoint: '/academics/calendar/all',
            columns: [
                { key: 'title', label: 'Event Title' },
                { key: 'eventDate', label: 'Date', format: (val) => formatDate(val) },
                { key: 'classGrade', label: 'Class / Grade' },
                { key: 'isActive', label: 'Status', format: (val) => val !== false ? '<span class="badge badge-success">Active</span>' : '<span class="badge badge-neutral">Inactive</span>' },
            ],
            fields: [
                { name: 'title', label: 'Event / Activity Title', type: 'text', required: true, fullWidth: true },
                { name: 'eventDate', label: 'Event Date', type: 'date', required: true },
                { name: 'classGrade', label: 'Target Class / Grade', type: 'select', options: [
                    { val: 'all', label: 'All Classes' },
                    { val: 'Pre-Primary', label: 'Pre-Primary' },
                    { val: 'Class 1-4', label: 'Primary (Class 1-4)' },
                    { val: 'Class 5-10', label: 'Secondary (Class 5-10)' },
                    { val: 'Class 10', label: 'Class 10 Only' }
                ], default: 'all' },
                { name: 'isActive', label: 'Active Status', type: 'select', options: [{ val: true, label: 'Active' }, { val: false, label: 'Inactive' }], default: true },
                { name: 'description', label: 'Event Details / Notice', type: 'textarea', fullWidth: true },
            ]
        },
        syllabus: {
            title: 'Syllabus & Course Outlines',
            endpoint: '/academics/syllabus',
            adminEndpoint: '/academics/syllabus/all',
            columns: [
                { key: 'title', label: 'Syllabus Title' },
                { key: 'classGrade', label: 'Class' },
                { key: 'fileUrl', label: 'Document', format: (val) => val ? `<a href="${EduSphereAPI.resolveUrl(val)}" target="_blank" class="badge badge-info"><i class="fa-solid fa-file-pdf"></i> View PDF</a>` : '<span class="badge badge-neutral">None</span>' },
                { key: 'isActive', label: 'Status', format: (val) => val !== false ? '<span class="badge badge-success">Active</span>' : '<span class="badge badge-neutral">Inactive</span>' },
            ],
            fields: [
                { name: 'title', label: 'Syllabus Title', type: 'text', required: true, fullWidth: true },
                { name: 'classGrade', label: 'Class / Grade', type: 'select', options: [
                    { val: 'Nursery', label: 'Nursery' },
                    { val: 'Jr. KG', label: 'Jr. KG' },
                    { val: 'Sr. KG', label: 'Sr. KG' },
                    { val: 'Class 1', label: 'Class 1' },
                    { val: 'Class 2', label: 'Class 2' },
                    { val: 'Class 3', label: 'Class 3' },
                    { val: 'Class 4', label: 'Class 4' },
                    { val: 'Class 5', label: 'Class 5' },
                    { val: 'Class 6', label: 'Class 6' },
                    { val: 'Class 7', label: 'Class 7' },
                    { val: 'Class 8', label: 'Class 8' },
                    { val: 'Class 9', label: 'Class 9' },
                    { val: 'Class 10', label: 'Class 10' }
                ], required: true },
                { name: 'isActive', label: 'Active Status', type: 'select', options: [{ val: true, label: 'Active' }, { val: false, label: 'Inactive' }], default: true },
                { name: 'file', label: 'Upload Syllabus Document (PDF)', type: 'file', accept: '.pdf,.doc,.docx', fullWidth: true },
                { name: 'description', label: 'Course Summary / Key Topics', type: 'textarea', fullWidth: true },
            ]
        },
        exams: {
            title: 'Examination Schedules',
            endpoint: '/academics/exams',
            adminEndpoint: '/academics/exams/all',
            columns: [
                { key: 'title', label: 'Exam Title' },
                { key: 'examType', label: 'Type', format: (val) => `<span class="badge badge-warning" style="text-transform: capitalize;">${(val || '').replace('-', ' ')}</span>` },
                { key: 'eventDate', label: 'Date', format: (val) => formatDate(val) },
                { key: 'classGrade', label: 'Class' },
                { key: 'fileUrl', label: 'Timetable', format: (val) => val ? `<a href="${EduSphereAPI.resolveUrl(val)}" target="_blank" class="badge badge-info"><i class="fa-solid fa-file-pdf"></i> PDF</a>` : '<span class="badge badge-neutral">None</span>' },
                { key: 'isActive', label: 'Status', format: (val) => val !== false ? '<span class="badge badge-success">Active</span>' : '<span class="badge badge-neutral">Inactive</span>' },
            ],
            fields: [
                { name: 'title', label: 'Exam Schedule Title', type: 'text', required: true, fullWidth: true },
                { name: 'examType', label: 'Exam Type', type: 'select', options: [
                    { val: 'unit-test', label: 'Unit Test' },
                    { val: 'mid-term', label: 'Mid-Term Examination' },
                    { val: 'final', label: 'Final Examination' },
                    { val: 'prelim', label: 'SSC Preliminary Exam' },
                    { val: 'practical', label: 'Practical Exam' },
                    { val: 'other', label: 'Other Assessment' }
                ], default: 'unit-test' },
                { name: 'eventDate', label: 'Examination Start Date', type: 'date' },
                { name: 'classGrade', label: 'Class / Grade', type: 'select', options: [
                    { val: 'all', label: 'All Classes' },
                    { val: 'Pre-Primary', label: 'Pre-Primary' },
                    { val: 'Class 1-4', label: 'Primary (Class 1-4)' },
                    { val: 'Class 5-10', label: 'Secondary (Class 5-10)' },
                    { val: 'Class 10', label: 'Class 10 SSC' }
                ], default: 'all' },
                { name: 'isActive', label: 'Active Status', type: 'select', options: [{ val: true, label: 'Active' }, { val: false, label: 'Inactive' }], default: true },
                { name: 'file', label: 'Upload Timetable / Scheme PDF', type: 'file', accept: '.pdf,.doc,.docx', fullWidth: true },
                { name: 'description', label: 'Exam Guidelines / Instructions', type: 'textarea', fullWidth: true },
            ]
        }
    };

    // --- Initialization --------------------------------
    async function init() {
        console.log('[AdminDashboard] Initializing Dashboard...');
        
        // 1. Verify Admin Session
        const token = localStorage.getItem('edusphere_admin_token');
        if (!token) {
            console.warn('[AdminDashboard] No active admin token. Requesting login...');
            setTimeout(() => AdminAuth.login(), 500);
        }

        // 2. Perform Backend Health Check
        await checkBackendHealth();

        // 3. Bind UI Event Handlers
        bindEvents();

        // 4. Load Overview Badge Counts
        loadStatsOverview();

        // 5. Render Initial Module Table
        loadModuleData(currentModule);
    }

    // --- Health Check Indicator ------------------------
    async function checkBackendHealth() {
        const pill = document.getElementById('systemHealthPill');
        const text = document.getElementById('systemHealthText');
        try {
            const isHealthy = await EduSphereAPI.healthCheck();
            if (isHealthy) {
                pill.className = 'system-health-pill';
                text.textContent = 'Backend Connected';
            } else {
                pill.className = 'system-health-pill degraded';
                text.textContent = 'System Degraded';
            }
        } catch {
            pill.className = 'system-health-pill degraded';
            text.textContent = 'Backend Offline';
        }
    }

    // --- Stats Overview --------------------------------
    async function loadStatsOverview() {
        const modulesToCount = [
            { key: 'announcements', endpoint: '/news/announcements/all' },
            { key: 'events', endpoint: '/events/all' },
            { key: 'admissions', endpoint: '/admissions' },
            { key: 'faculty', endpoint: '/faculty/all' },
            { key: 'ticker', endpoint: '/news/ticker/all' },
            { key: 'gallery', endpoint: '/gallery/all' },
            { key: 'contact', endpoint: '/contact' },
            { key: 'alumni', endpoint: '/alumni' },
                        { key: 'downloads', endpoint: '/parents/downloads/all' },
            { key: 'achievements', endpoint: '/achievements/all' },
            { key: 'toppers', endpoint: '/ssc-toppers/all' },
            { key: 'academicPrograms', endpoint: '/academics/programs/all' },
            { key: 'academicCalendar', endpoint: '/academics/calendar/all' },
            { key: 'syllabus', endpoint: '/academics/syllabus/all' },
            { key: 'exams', endpoint: '/academics/exams/all' }
        ];

        for (const item of modulesToCount) {
            try {
                const res = await EduSphereAPI.get(item.endpoint);
                const count = res.data
                    ? (Array.isArray(res.data)
                        ? res.data.length
                        : (res.pagination?.total || res.data?.total || res.data?.data?.length || 0))
                    : 0;
                
                // Update badge
                const badge = document.getElementById(`badge-${item.key}`);
                if (badge) badge.textContent = count;

                // Update metric card
                const statElem = document.getElementById(`stat-${item.key}`);
                if (statElem) statElem.textContent = count;
            } catch {
                const badge = document.getElementById(`badge-${item.key}`);
                if (badge) badge.textContent = '0';
            }
        }
    }

    // --- Bind DOM Events -------------------------------
    function bindEvents() {
        // Sidebar tab switching
        document.querySelectorAll('#sidebarMenu button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const moduleKey = btn.getAttribute('data-module');
                if (moduleKey && MODULES[moduleKey]) {
                    document.querySelectorAll('#sidebarMenu button').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    currentModule = moduleKey;
                    currentPage = 1;
                    loadModuleData(currentModule);
                }
            });
        });

        // Search bar
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                applyFilters();
            });
        }

        // Status Filter
        const filterStatus = document.getElementById('filterStatus');
        if (filterStatus) {
            filterStatus.addEventListener('change', () => {
                applyFilters();
            });
        }

        // Export CSV button
        const btnExportCSV = document.getElementById('btnExportCSV');
        if (btnExportCSV) {
            btnExportCSV.addEventListener('click', exportToCSV);
        }

        // Add New button
        document.getElementById('btnAddNew').addEventListener('click', () => {
            openCrudModal();
        });

        // Pagination buttons
        document.getElementById('btnPrevPage').addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderTable();
            }
        });

        document.getElementById('btnNextPage').addEventListener('click', () => {
            const totalPages = Math.ceil(filteredData.length / limit) || 1;
            if (currentPage < totalPages) {
                currentPage++;
                renderTable();
            }
        });

        // Modal Close/Cancel
        document.getElementById('crudModalClose').addEventListener('click', closeCrudModal);
        document.getElementById('crudModalCancel').addEventListener('click', closeCrudModal);

        // Form Submit
        document.getElementById('crudForm').addEventListener('submit', handleFormSubmit);
    }

    // --- Load Module Data ------------------------------
    async function loadModuleData(moduleKey) {
        const config = MODULES[moduleKey];
        if (!config) return;

        // Update header UI
        document.getElementById('currentModuleTitle').textContent = config.title;
        const btnAddNew = document.getElementById('btnAddNew');
        btnAddNew.style.display = config.noCreate ? 'none' : 'inline-flex';

        // Show table loader
        const tbody = document.getElementById('tableBody');
        tbody.innerHTML = `
            <tr>
                <td colspan="${config.columns.length + 1}" style="text-align: center; padding: 2.5rem;">
                    <i class="fa-solid fa-circle-notch fa-spin" style="font-size: 1.8rem; color: #2563eb;"></i>
                    <p style="margin-top: 10px; color: #64748b;">Loading ${config.title}...</p>
                </td>
            </tr>
        `;

        try {
            const res = await EduSphereAPI.get(config.adminEndpoint);
            moduleData = Array.isArray(res.data) ? res.data : (res.data?.data || res.data?.items || []);
            filteredData = [...moduleData];
            currentPage = 1;

            renderTableHeaders();
            renderTable();
        } catch (error) {
            console.error('[AdminDashboard] Failed to fetch module data:', error);
            tbody.innerHTML = `
                <tr>
                    <td colspan="${config.columns.length + 1}" style="text-align: center; padding: 2rem; color: #dc2626;">
                        <i class="fa-solid fa-triangle-exclamation" style="font-size: 1.5rem; margin-bottom: 8px;"></i>
                        <p>${error.message || 'Failed to load records. Make sure you are logged in as admin.'}</p>
                    </td>
                </tr>
            `;
        }
    }

    // --- Render Table Headers --------------------------
    function renderTableHeaders() {
        const config = MODULES[currentModule];
        const headerRow = document.getElementById('tableHeaderRow');
        let html = config.columns.map(col => `<th>${col.label}</th>`).join('');
        html += '<th style="text-align: right; width: 120px;">Actions</th>';
        headerRow.innerHTML = html;
    }

    // --- Apply Search & Filters -----------------------
    function applyFilters() {
        const query = document.getElementById('searchInput').value.toLowerCase().trim();
        const status = document.getElementById('filterStatus').value;

        filteredData = moduleData.filter(item => {
            // Text Search Match
            const matchesText = !query || Object.values(item).some(val => 
                val !== null && val !== undefined && String(val).toLowerCase().includes(query)
            );

            // Status Match
            let matchesStatus = true;
            if (status === 'active') {
                matchesStatus = item.isActive === true || item.status === 'new' || item.status === 'read';
            } else if (status === 'inactive') {
                matchesStatus = item.isActive === false || item.status === 'archived' || item.status === 'replied';
            }

            return matchesText && matchesStatus;
        });

        currentPage = 1;
        renderTable();
    }

    // --- Render Table Data -----------------------------
    function renderTable() {
        const config = MODULES[currentModule];
        const tbody = document.getElementById('tableBody');

        if (!filteredData || filteredData.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="${config.columns.length + 1}" style="text-align: center; padding: 2.5rem; color: #94a3b8;">
                        <i class="fa-solid fa-folder-open" style="font-size: 2rem; margin-bottom: 8px;"></i>
                        <p>No matching records found.</p>
                    </td>
                </tr>
            `;
            updatePagination(0);
            return;
        }

        const startIndex = (currentPage - 1) * limit;
        const pageItems = filteredData.slice(startIndex, startIndex + limit);

        let html = '';
        pageItems.forEach(item => {
            html += '<tr>';
            config.columns.forEach(col => {
                const rawVal = item[col.key];
                const formattedVal = col.format ? col.format(rawVal, item) : (rawVal !== undefined && rawVal !== null ? rawVal : '—');
                html += `<td>${formattedVal}</td>`;
            });

            // Action buttons
            html += '<td style="text-align: right;">';
            html += '<div class="action-btn-group" style="justify-content: flex-end;">';

            if (!config.noCreate) {
                html += `<button class="btn-icon edit" onclick="AdminDashboard.editItem('${item.id}')" title="Edit Item"><i class="fa-solid fa-pen"></i></button>`;
            }

            html += `<button class="btn-icon delete" onclick="AdminDashboard.deleteItem('${item.id}')" title="Delete Item"><i class="fa-solid fa-trash-can"></i></button>`;
            html += '</div></td></tr>';
        });

        tbody.innerHTML = html;
        updatePagination(filteredData.length);
    }

    // --- Pagination Controls UI -----------------------
    function updatePagination(totalItems) {
        const totalPages = Math.ceil(totalItems / limit) || 1;
        document.getElementById('paginationInfo').textContent = `Showing ${Math.min(limit, totalItems)} of ${totalItems} entries`;
        document.getElementById('pageIndicator').textContent = `Page ${currentPage} of ${totalPages}`;

        document.getElementById('btnPrevPage').disabled = currentPage <= 1;
        document.getElementById('btnNextPage').disabled = currentPage >= totalPages;
    }

    // --- CRUD Modal Forms ------------------------------
    function openCrudModal(itemToEdit = null) {
        editingItemId = itemToEdit ? itemToEdit.id : null;
        const config = MODULES[currentModule];
        const modal = document.getElementById('crudModal');
        const titleElem = document.getElementById('crudModalTitle');
        const fieldsContainer = document.getElementById('crudFormFields');

        titleElem.textContent = editingItemId ? `Edit ${config.title.slice(0, -1)}` : `Add New ${config.title.slice(0, -1)}`;

        // Build dynamic form inputs
        let fieldsHTML = '';
        config.fields.forEach(field => {
            const fieldId = `field_${field.name}`;
            let val = itemToEdit ? itemToEdit[field.name] : (field.default !== undefined ? field.default : '');
            if (itemToEdit && (val === undefined || val === null || val === '')) {
                if (field.name === 'classGrade') val = itemToEdit.class || '';
                if (field.name === 'date') val = itemToEdit.achievementDate || '';
                if (field.name === 'achievementDate') val = itemToEdit.date || '';
            }
            const fullClass = field.fullWidth ? 'dashboard-form-full' : '';

            fieldsHTML += `<div class="dashboard-form-group ${fullClass}">`;
            fieldsHTML += `<label for="${fieldId}">${field.label} ${field.required ? '<span style="color:#ef4444;">*</span>' : ''}</label>`;

            if (field.type === 'textarea') {
                fieldsHTML += `<textarea id="${fieldId}" name="${field.name}" rows="4" placeholder="${field.placeholder || ''}" ${field.required ? 'required' : ''}>${val || ''}</textarea>`;
            } else if (field.type === 'select') {
                fieldsHTML += `<select id="${fieldId}" name="${field.name}" ${field.required ? 'required' : ''}>`;
                field.options.forEach(opt => {
                    const optVal = typeof opt === 'object' ? opt.val : opt;
                    const optLabel = typeof opt === 'object' ? opt.label : opt;
                    const selected = String(optVal) === String(val) ? 'selected' : '';
                    fieldsHTML += `<option value="${optVal}" ${selected}>${optLabel}</option>`;
                });
                fieldsHTML += `</select>`;
            } else if (field.type === 'file') {
                const multipleAttr = field.multiple ? 'multiple' : '';
                const acceptAttr = field.accept ? `accept="${field.accept}"` : '';
                fieldsHTML += `<input type="file" id="${fieldId}" name="${field.name}" ${multipleAttr} ${acceptAttr}>`;
                if (field.helpText) {
                    fieldsHTML += `<small style="display:block; margin-top:5px; color:#64748b; font-size:12px;"><i class="fa-solid fa-circle-info"></i> ${field.helpText}</small>`;
                }
                if (itemToEdit) {
                    const currentImg = itemToEdit.photoUrl || itemToEdit.imageUrl || itemToEdit.fileUrl;
                    if (currentImg) {
                        fieldsHTML += `<div style="margin-top:8px; font-size:12px; color:#475569; display: flex; align-items: center; gap: 8px;">
                            <span>Current file:</span>
                            <a href="${EduSphereAPI.resolveUrl(currentImg)}" target="_blank" style="color:#2563eb; text-decoration:underline; font-weight:500;">
                                <i class="fa-solid fa-arrow-up-right-from-square"></i> View current asset
                            </a>
                        </div>`;
                    }
                    if (itemToEdit.images && Array.isArray(itemToEdit.images) && itemToEdit.images.length > 0) {
                        fieldsHTML += `<div style="margin-top:6px; font-size:12px; color:#059669; font-weight: 500;">
                            <i class="fa-solid fa-images"></i> Existing album has ${itemToEdit.images.length} photo(s). Uploading new files will append/update photos.
                        </div>`;
                    }
                }
            } else {
                fieldsHTML += `<input type="${field.type}" id="${fieldId}" name="${field.name}" value="${val !== undefined && val !== null ? val : ''}" placeholder="${field.placeholder || ''}" ${field.required ? 'required' : ''}>`;
            }

            fieldsHTML += `</div>`;
        });

        fieldsContainer.innerHTML = fieldsHTML;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeCrudModal() {
        const modal = document.getElementById('crudModal');
        modal.classList.remove('active');
        document.body.style.overflow = '';
        editingItemId = null;
    }

    // --- Form Submission Handler -----------------------
    async function handleFormSubmit(e) {
        e.preventDefault();
        const config = MODULES[currentModule];
        const submitBtn = document.getElementById('crudModalSubmit');
        const form = document.getElementById('crudForm');

        const formData = new FormData(form);
        const hasFile = Array.from(formData.values()).some(v => v instanceof File && v.size > 0);

        let payload = null;
        if (hasFile) {
            payload = formData;
        } else {
            payload = {};
            formData.forEach((value, key) => {
                if (value instanceof File) return; // Skip empty file inputs
                // Skip empty optional date/text fields (prevents ISO 8601 validation errors)
                if (value === '' || value === null) return;
                if (value === 'true') payload[key] = true;
                else if (value === 'false') payload[key] = false;
                else if (!isNaN(value) && value !== '' && (key === 'order' || key === 'orderNum')) payload[key] = Number(value);
                else payload[key] = value;
            });
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

        try {
            if (editingItemId) {
                // UPDATE
                const endpoint = `${config.endpoint}/${editingItemId}`;
                if (config.readOnlyModule) {
                    await EduSphereAPI.patch(endpoint, payload);
                } else {
                    await EduSphereAPI.put(endpoint, payload);
                }
                showToast(`${config.title.slice(0, -1)} updated successfully`, 'success');
            } else {
                // CREATE
                await EduSphereAPI.post(config.endpoint, payload);
                showToast(`New ${config.title.slice(0, -1)} created successfully`, 'success');
            }

            closeCrudModal();
            loadModuleData(currentModule);
            loadStatsOverview();
        } catch (error) {
            console.error('[AdminDashboard] Save error:', error);
            showToast(error.message || 'Failed to save record', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Save Record';
        }
    }

    // --- Public Actions --------------------------------
    function editItem(id) {
        const item = moduleData.find(i => String(i.id) === String(id));
        if (item) {
            openCrudModal(item);
        }
    }

    async function deleteItem(id) {
        if (!confirm('Are you sure you want to delete this record? This action cannot be undone.')) return;

        const config = MODULES[currentModule];
        try {
            await EduSphereAPI.delete(`${config.endpoint}/${id}`);
            showToast('Record deleted successfully', 'info');
            loadModuleData(currentModule);
            loadStatsOverview();
        } catch (error) {
            console.error('[AdminDashboard] Delete error:', error);
            showToast(error.message || 'Failed to delete record', 'error');
        }
    }

    // --- UI Formatters & Badges ------------------------
    function formatDate(isoStr) {
        if (!isoStr) return '—';
        try {
            return new Date(isoStr).toLocaleDateString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric'
            });
        } catch {
            return isoStr;
        }
    }

    function getPriorityBadge(prio) {
        const map = { urgent: 'danger', high: 'warning', medium: 'info', low: 'neutral' };
        return map[prio] || 'neutral';
    }

    function getStatusBadge(st) {
        const map = { new: 'danger', read: 'info', replied: 'success', archived: 'neutral' };
        return map[st] || 'info';
    }

    function exportToCSV() {
        const config = MODULES[currentModule];
        const dataToExport = filteredData && filteredData.length > 0 ? filteredData : moduleData;

        if (!dataToExport || dataToExport.length === 0) {
            showToast('No records available to export', 'error');
            return;
        }

        const headers = config.columns.map(col => col.label);
        const keys = config.columns.map(col => col.key);

        const csvRows = [];
        // Header row
        csvRows.push(headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(','));

        // Data rows
        dataToExport.forEach(item => {
            const rowValues = keys.map(key => {
                let val = item[key];
                if (val === null || val === undefined) val = '';
                else if (typeof val === 'object') val = JSON.stringify(val);
                return `"${String(val).replace(/"/g, '""')}"`;
            });
            csvRows.push(rowValues.join(','));
        });

        const csvString = csvRows.join('\r\n');
        const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().slice(0, 10);

        link.setAttribute('href', url);
        link.setAttribute('download', `st-thomas-${currentModule}-${timestamp}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast(`Exported ${dataToExport.length} records to CSV`, 'success');
    }

    function showToast(msg, type = 'success') {
        if (window.AdminAuth && typeof window.AdminAuth.showToast === 'function') {
            window.AdminAuth.showToast(msg, type);
        } else {
            alert(msg);
        }
    }

    // Auto init on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    return {
        editItem,
        deleteItem,
        reload: () => loadModuleData(currentModule),
    };
})();

window.AdminDashboard = AdminDashboard;
