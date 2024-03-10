let slideIndex = 1;
let emailEntered = false;
let resultsShown = false;

showSlides();


function showSlides() {
    
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


function validateEmail() {
    let email = document.getElementsByClassName("textBox")[0].value;
    console.log(email);
    let re = /^[a-zA-Z0-9. _-]+@[a-zA-Z0-9. -]+\. [a-zA-Z]{2,4}$/;
    console.log(re.test(email));
    displayResponse(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email));
}

function displayResponse(isEmail) {
    if (emailEntered){
        let elem = document.getElementsByClassName("email")[0];
        elem.remove();
    }

    let html = document.createElement("h4");
    html.className = "email";
    if (isEmail) {
        var inner = document.createTextNode("You will recieve answer on your E-mail soon..");    
    }
    else {
        var inner = document.createTextNode("Invalid E-mail adress..");
    }

    html.appendChild(inner);
    const appendAfter = document.getElementsByClassName("submitButton")[0]

    appendAfter.parentNode.insertBefore(html, appendAfter.nextSibling);
    emailEntered = true;
}

function SubmitTest() {
    let score = 0;
    let percentage = 0;
    let questions = 6;

    let answers = ["trall.mp3", "arthas_angry.mp3", "tuzad.mp3", "tirend.mp3", "mediv.mp3", "jaina.mp3"];
    
    try {
        for( let i = 0; i < questions; ++i){
            let answerRadio = document.querySelector(`input[name="question${i + 1}"]:checked`);
            let answered = answerRadio.nextElementSibling.childNodes[1].getAttribute("src"); // Returns sounds/*.mp3 of chosen answer
            let answer = answered.split("/")[1]; // Returns second elemend of array (*.mp3) selected by user
            console.log(answer);
            if(answer == answers[i]) 
                score ++;
        }
        
        percentage = score / questions * 100;
        console.log(score);
        console.log(percentage);
    }
    catch(TypeError) {
        alert("You have not chosen all of the options!");
        return;
    }

    ShowResults(score, percentage, questions );
}

function ShowResults(score, percentage, questions) {
    if (resultsShown){
        let elem = document.getElementsByClassName("results")[0];
        elem.remove();
    }

    let message = "";
    let str = `Your score is - ${score}/${questions}. Your percentage of correct answers is - ${percentage}% out of 100%. `

    if (percentage >= 90){
        message = "Wow. You know Warcraft 3 very well!"
    }
    else if (percentage >= 50) {
        message = "You have certainly played Warcraft 3 a little bit."
    }
    else {
        message = "Haven't you played Warcraft 3 yet?"
    }

    str += message;
    str = document.createTextNode(str);

    let html = document.createElement("h4");
    html.appendChild(str);
    html.className = "results";

    const appendAfter = document.getElementsByName("lastQuestion")[0];
    appendAfter.parentNode.insertBefore(html, appendAfter.nextSibling);
    resultsShown = true;
}