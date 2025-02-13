// Initialize Bootstrap components
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all tooltips
    const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltips.forEach(tooltip => new bootstrap.Tooltip(tooltip));

    // Initialize all popovers
    const popovers = document.querySelectorAll('[data-bs-toggle="popover"]');
    popovers.forEach(popover => new bootstrap.Popover(popover));

    // Add fade-in animation to cards
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => card.classList.add('fade-in'));
});

// Email validation
function validateEmail(event) {
    if (event) {
        event.preventDefault();
    }

    const emailInput = document.querySelector('input[type="email"]');
    if (!emailInput) return;

    const email = emailInput.value.trim();
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;

    if (emailRegex.test(email)) {
        showAlert('success', 'Thank you for subscribing! You will receive a confirmation email shortly.');
        emailInput.value = '';
    } else {
        showAlert('danger', 'Please enter a valid email address.');
    }
}

// Alert handling
function showAlert(type, message) {
    // Remove any existing alerts
    const existingAlert = document.querySelector('.alert');
    if (existingAlert) {
        existingAlert.remove();
    }

    // Create new alert
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.role = 'alert';
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    // Insert alert after the form
    const form = document.querySelector('form');
    if (form) {
        form.insertAdjacentElement('afterend', alert);

        // Auto-dismiss alert after 5 seconds
        setTimeout(() => {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        }, 5000);
    }
}

// Test submission handling
function submitTest(event) {
    event.preventDefault();
    
    let score = 0;
    const questions = 6;
    const answers = [
        "trall.mp3",
        "arthas_angry.mp3",
        "tuzad.mp3",
        "tirend.mp3",
        "mediv.mp3",
        "jaina.mp3"
    ];

    try {
        for (let i = 0; i < questions; i++) {
            const selectedAnswer = document.querySelector(`input[name="question${i + 1}"]:checked`);
            if (!selectedAnswer) {
                throw new Error('Please answer all questions before submitting.');
            }
            if (selectedAnswer.value === answers[i]) {
                score++;
            }
        }

        const percentage = (score / questions) * 100;
        showTestResults(score, percentage);
    } catch (error) {
        showAlert('warning', error.message);
    }
}

function showTestResults(score, percentage) {
    let message = `Your score: ${score}/6 (${percentage}%)\n`;
    
    if (percentage >= 90) {
        message += 'Excellent! You are a true Warcraft III expert!';
        type = 'success';
    } else if (percentage >= 70) {
        message += 'Great job! You know your Warcraft III well!';
        type = 'success';
    } else if (percentage >= 50) {
        message += 'Good effort! Keep playing to learn more!';
        type = 'warning';
    } else {
        message += 'Keep practicing! Try playing more Warcraft III to improve your knowledge.';
        type = 'danger';
    }

    showAlert(type, message);

    // Scroll to results
    window.scrollTo({
        top: document.querySelector('.alert').offsetTop - 100,
        behavior: 'smooth'
    });
}

// Add smooth scrolling for all anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});