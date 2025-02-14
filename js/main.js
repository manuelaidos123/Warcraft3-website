// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    // Add animation delay to nav items
    document.querySelectorAll('#mainNav .nav-item').forEach((item, index) => {
        item.style.setProperty('--item-number', index);
    });
});

// Navbar scroll effect
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('#mainNav');
    if (window.scrollY > 50) {
        navbar.classList.add('navbar-scrolled');
    } else {
        navbar.classList.remove('navbar-scrolled');
    }
});
