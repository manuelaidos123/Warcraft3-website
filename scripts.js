// Consolidate all JavaScript into a single file
const utils = {
    validateEmail(email) {
        return /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/.test(email);
    },
    
    showAlert(type, message) {
        // Alert handling logic here
    }
};

// Use the utilities
function handleEmailSubmission(event) {
    if (event) event.preventDefault();
    const email = document.querySelector('input[type="email"]').value.trim();
    
    if (utils.validateEmail(email)) {
        utils.showAlert('success', 'Thank you for subscribing!');
    } else {
        utils.showAlert('danger', 'Please enter a valid email address.');
    }
}

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

    // Form toggle handlers
    document.getElementById('showSignup').addEventListener('click', function(e) {
        e.preventDefault();
        toggleForms('signup');
    });

    document.getElementById('showLogin').addEventListener('click', function(e) {
        e.preventDefault();
        toggleForms('login');
    });

    // Login form handling
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const errorDiv = document.getElementById('loginError');
        
        fetch('auth/login.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                errorDiv.textContent = data.error;
                errorDiv.classList.remove('d-none');
            } else if (data.success) {
                const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
                modal.hide();
                updateLoginStatus(true);
                showAlert('success', 'Login successful!');
            }
        })
        .catch(error => {
            errorDiv.textContent = 'An error occurred. Please try again.';
            errorDiv.classList.remove('d-none');
        });
    });

    // Signup form handling
    document.getElementById('signupForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const errorDiv = document.getElementById('signupError');
        
        // Password validation
        if (formData.get('password') !== formData.get('confirmPassword')) {
            errorDiv.textContent = 'Passwords do not match';
            errorDiv.classList.remove('d-none');
            return;
        }

        fetch('auth/signup.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                errorDiv.textContent = data.error;
                errorDiv.classList.remove('d-none');
            } else if (data.success) {
                const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
                modal.hide();
                showAlert('success', 'Registration successful! Please login.');
            }
        })
        .catch(error => {
            errorDiv.textContent = 'An error occurred. Please try again.';
            errorDiv.classList.remove('d-none');
        });
    });

    // Password strength checker
    document.getElementById('signupPassword').addEventListener('input', function() {
        checkPasswordStrength(this.value);
    });
});

// Email validation
function handleEmailSubmission(event) {
    if (event) event.preventDefault();
    const email = document.querySelector('input[type="email"]').value.trim();
    
    if (utils.validateEmail(email)) {
        utils.showAlert('success', 'Thank you for subscribing!');
    } else {
        utils.showAlert('danger', 'Please enter a valid email address.');
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

// Update UI based on login status
function updateLoginStatus(isLoggedIn) {
    const loginIcon = document.querySelector('.fa-user-circle');
    if (isLoggedIn) {
        loginIcon.classList.add('text-success');
    } else {
        loginIcon.classList.remove('text-success');
    }
}

function toggleForms(showForm) {
    const loginContainer = document.getElementById('loginForm-container');
    const signupContainer = document.getElementById('signupForm-container');
    
    if (showForm === 'signup') {
        loginContainer.style.display = 'none';
        signupContainer.style.display = 'block';
    } else {
        signupContainer.style.display = 'none';
        loginContainer.style.display = 'block';
    }
}

function checkPasswordStrength(password) {
    let strength = 0;
    if (password.match(/[a-z]+/)) strength += 1;
    if (password.match(/[A-Z]+/)) strength += 1;
    if (password.match(/[0-9]+/)) strength += 1;
    if (password.match(/[$@#&!]+/)) strength += 1;
    if (password.length >= 8) strength += 1;

    const strengthIndicator = document.createElement('div');
    strengthIndicator.className = 'password-strength';
    
    if (strength <= 2) {
        strengthIndicator.classList.add('strength-weak');
    } else if (strength <= 4) {
        strengthIndicator.classList.add('strength-medium');
    } else {
        strengthIndicator.classList.add('strength-strong');
    }

    const existingIndicator = document.querySelector('.password-strength');
    if (existingIndicator) existingIndicator.remove();
    
    document.getElementById('signupPassword').parentNode.appendChild(strengthIndicator);
}
