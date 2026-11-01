/**
 * Greenwood Public School — Form Handler
 * Handles admission enquiry, contact, and alumni forms.
 * Sends data to the backend API (Phase 5 — API Integration).
 */

document.addEventListener('DOMContentLoaded', () => {

    // ============================================
    // UTILITY: Email & Phone Validation
    // ============================================
    function validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).toLowerCase());
    }

    function validatePhone(phone) {
        return /^\d{10}$/.test(String(phone).replace(/[\s\-()]/g, ''));
    }

    function validateForm(form) {
        let isValid = true;
        const requiredInputs = form.querySelectorAll('[required]');
        
        requiredInputs.forEach(input => {
            // Reset styling
            input.style.borderColor = '';
            
            if (!input.value.trim()) {
                isValid = false;
                input.style.borderColor = '#EF4444';
            } else if (input.type === 'email' && !validateEmail(input.value)) {
                isValid = false;
                input.style.borderColor = '#EF4444';
            } else if (input.type === 'tel' && input.value.trim() && !validatePhone(input.value)) {
                isValid = false;
                input.style.borderColor = '#EF4444';
            }
        });

        return isValid;
    }

    // Clear error styling on input
    document.querySelectorAll('form input, form select, form textarea').forEach(input => {
        input.addEventListener('input', () => {
            input.style.borderColor = '';
        });
    });

    // ============================================
    // ADMISSION ENQUIRY FORM
    // ============================================
    const admissionForm = document.getElementById('admissionForm');
    if (admissionForm) {
        admissionForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!validateForm(admissionForm)) return;

            try {
                await EduSphereAPI.submitForm(admissionForm, '/admissions', {
                    successMessage: 'Thank you! Your admission enquiry has been submitted successfully. Our team will contact you shortly.',
                    fieldMap: {
                        studentName: 'studentName',
                        parentName: 'parentName',
                        email: 'email',
                        phone: 'phone',
                        dob: 'dob',
                        classApplied: 'classApplied',
                        message: 'message',
                    },
                });
            } catch (error) {
                console.error('Admission form error:', error);
            }
        });
    }

    // ============================================
    // CONTACT FORM
    // ============================================
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!validateForm(contactForm)) return;

            try {
                await EduSphereAPI.submitForm(contactForm, '/contact', {
                    successMessage: 'Your message has been sent successfully! We will get back to you soon.',
                    fieldMap: {
                        contactName: 'name',
                        contactEmail: 'email',
                        contactPhone: 'phone',
                        contactSubject: 'subject',
                        contactMessage: 'message',
                    },
                });
            } catch (error) {
                console.error('Contact form error:', error);
            }
        });
    }

    // ============================================
    // ALUMNI REGISTRATION FORM
    // ============================================
    const alumniForm = document.getElementById('alumniForm');
    if (alumniForm) {
        alumniForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!validateForm(alumniForm)) return;

            try {
                await EduSphereAPI.submitForm(alumniForm, '/alumni', {
                    successMessage: 'Welcome back, Thomian! Your alumni registration has been submitted. We look forward to staying connected!',
                    fieldMap: {
                        alumniName: 'name',
                        alumniEmail: 'email',
                        alumniPhone: 'phone',
                        alumniGraduationYear: 'graduationYear',
                        alumniCurrentOccupation: 'currentOccupation',
                        alumniMessage: 'message',
                    },
                });
            } catch (error) {
                console.error('Alumni form error:', error);
            }
        });
    }

});
