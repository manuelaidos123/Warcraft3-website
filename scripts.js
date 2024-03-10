let slideIndex = 1;
let time = 0

showSlides();


function showSlides() {
    setTimeout(time++, 1);
    
    let slides = document.getElementsByClassName("Slide");
    let dots = document.getElementsByClassName("dot");

    for (let i = 0; i < slides.length; i++) {
        slides[i].style.display = "none";
        //slides[i].className = slides[i].className.replace(" fade-in", "");
    }

    for( let i = 0; i < dots.length; ++i) {
        dots[i].className = dots[i].className.replace("active", "");
    }

    
    if (slideIndex > slides.length) {
        slideIndex = 1;
    }
    //slides[slideIndex - 1].style += ";transition: left .8s cubic-bezier(0.77, 0, 0.175, 1)"
    //slides[slideIndex - 1].className += " fade-in"
    slides[slideIndex-1].style.display = "block";
    dots[slideIndex - 1].className += " active";
    slideIndex++;
    setTimeout(showSlides, 7000);
}

function changeSlides(position) {
    let slides = document.getElementsByClassName("Slide");
    let dots = document.getElementsByClassName("dot");
    slideIndex += position;
    if (slideIndex > slides.length) {slideIndex = 1}
    else if(slideIndex < 1){slideIndex = slides.length}
    for (i = 0; i < slides.length; i++) {
       slides[i].style.display = "none";  
    }
    for (i = 0; i < dots.length; i++) {
        dots[i].className = dots[i].className.replace(" active", "");

      }
        slides[slideIndex-1].style.display = "block";  
        dots[slideIndex-1].className += " active";
    }

function currentSlide(position) {
    let slides = document.getElementsByClassName("Slide");
    let dots = document.getElementsByClassName("dot");
    if (position > slides.length) {position = 1}
    else if(position < 1){position = slides.length}
    for (i = 0; i < slides.length; i++) {
       slides[i].style.display = "none";  
    }
    for (i = 0; i < dots.length; i++) {
        dots[i].className = dots[i].className.replace(" active", "");
      }
        slides[position-1].style.display = "block";  
        dots[position-1].className += " active";
    }