let slideIndex = 1;

setTimeout(showSlides, 1);



function showSlides() {
    let i;
    let sliders = document.getElementsByClassName("Slide");

    for (i = 0; i < sliders.length; i++) {
        sliders[i].style.display = "none";
    }

    slideIndex++;
    if (slideIndex > sliders.length) {slideIndex = 1}
    sliders[slideIndex-1].style.display = "block";
    setTimeout(showSlides, 5000); // Change image every 2 seconds
}
