// IIFE to avoid global scope pollution
(() => {
    'use strict';

    // State management
    const state = {
        slideIndex: 1,
        slideInterval: null,
        isAnimating: false
    };

    // Constants
    const SLIDE_INTERVAL = 7000;
    const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    // DOM Elements
    const elements = {
        slides: null,
        dots: null,
        enrollForm: null
    };

    // Initialize the application
    document.addEventListener('DOMContentLoaded', () => {
        initializeElements();
        setupEventListeners();
        startSlideshow();
        setupAccessibility();
    });

    function initializeElements() {
        elements.slides = document.getElementsByClassName('Slide');
        elements.dots = document.getElementsByClassName('dot');
        elements.enrollForm = document.getElementById('enrollForm');
    }

    function setupEventListeners() {
        // Keyboard navigation for slideshow
        document.addEventListener('keydown', handleKeyboardNavigation);

        // Pause slideshow on hover/focus
        const slideshow = document.querySelector('.imageSlider');
        if (slideshow) {
            slideshow.addEventListener('mouseenter', pauseSlideshow);
            slideshow.addEventListener('mouseleave', startSlideshow);
            slideshow.addEventListener('focusin', pauseSlideshow);
            slideshow.addEventListener('focusout', startSlideshow);
        }

        // Form submission
        if (elements.enrollForm) {
            elements.enrollForm.addEventListener('submit', handleFormSubmit);
        }
    }

    function setupAccessibility() {
        // Add aria-live region for slide announcements
        const liveRegion = document.createElement('div');
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.classList.add('visually-hidden');
        document.body.appendChild(liveRegion);
    }

    // Slideshow functions
    function showSlides() {
        if (!elements.slides || !elements.dots) return;

        for (let i = 0; i < elements.slides.length; i++) {
            elements.slides[i].style.display = 'none';
            elements.dots[i].classList.remove('active');
            elements.dots[i].setAttribute('aria-selected', 'false');
        }

        state.slideIndex = state.slideIndex > elements.slides.length ? 1 
            : state.slideIndex < 1 ? elements.slides.length 
            : state.slideIndex;

        elements.slides[state.slideIndex - 1].style.display = 'block';
        elements.dots[state.slideIndex - 1].classList.add('active');
        elements.dots[state.slideIndex - 1].setAttribute('aria-selected', 'true');

        // Announce slide change for screen readers
        announceSlideChange(state.slideIndex);
    }

    function announceSlideChange(index) {
        const liveRegion = document.querySelector('[aria-live="polite"]');
        if (liveRegion) {
            liveRegion.textContent = `Showing slide ${index} of ${elements.slides.length}`;
        }
    }

    function changeSlides(position) {
        if (state.isAnimating) return;
        state.isAnimating = true;

        pauseSlideshow();
        state.slideIndex += position;
        showSlides();

        // Debounce animation flag
        setTimeout(() => {
            state.isAnimating = false;
            startSlideshow();
        }, 500);
    }

    function currentSlide(position) {
        pauseSlideshow();
        state.slideIndex = position;
        showSlides();
        startSlideshow();
    }

    function startSlideshow() {
        if (state.slideInterval) return;
        state.slideInterval = setInterval(() => {
            state.slideIndex++;
            showSlides();
        }, SLIDE_INTERVAL);
    }

    function pauseSlideshow() {
        if (state.slideInterval) {
            clearInterval(state.slideInterval);
            state.slideInterval = null;
        }
    }

    function handleKeyboardNavigation(event) {
        switch (event.key) {
            case 'ArrowLeft':
                event.preventDefault();
                changeSlides(-1);
                break;
            case 'ArrowRight':
                event.preventDefault();
                changeSlides(1);
                break;
        }
    }

    // Form handling
    function handleFormSubmit(event) {
        event.preventDefault();
        const emailInput = event.target.querySelector('.textBox');
        
        if (!emailInput) {
            showFormMessage('System error. Please try again later.', false);
            return;
        }

        const email = emailInput.value.trim();
        if (validateEmail(email)) {
            // Here you would typically send the email to your server
            showFormMessage('Thank you! You will receive a confirmation email shortly.', true);
            emailInput.value = '';
        } else {
            showFormMessage('Please enter a valid email address.', false);
        }
    }

    function validateEmail(email) {
        return EMAIL_REGEX.test(email);
    }

    function showFormMessage(message, isSuccess) {
        const existingMessage = document.querySelector('.form-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        const messageElement = document.createElement('p');
        messageElement.className = `form-message ${isSuccess ? 'success' : 'error'}`;
        messageElement.textContent = message;
        messageElement.setAttribute('role', 'alert');

        const form = document.getElementById('enrollForm');
        if (form) {
            form.appendChild(messageElement);
            
            // Auto-remove message after 5 seconds
            setTimeout(() => {
                messageElement.remove();
            }, 5000);
        }
    }

    // Export functions needed by HTML
    window.changeSlides = changeSlides;
    window.currentSlide = currentSlide;
})();