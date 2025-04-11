let sections = document.querySelectorAll('section');
let navLinks = document.querySelectorAll('header nav a');

window.onscroll = () => {
    let scrollPosition = window.scrollY + window.innerHeight / 2; 

    sections.forEach(sec => {
        let offset = sec.offsetTop;
        let height = sec.offsetHeight;
        let id = sec.getAttribute('id');

        if (scrollPosition >= offset && scrollPosition < offset + height) {
            navLinks.forEach(link => link.classList.remove('active')); 
            document.querySelector(`header nav a[href*='${id}']`)?.classList.add('active'); 
        }
    });
};