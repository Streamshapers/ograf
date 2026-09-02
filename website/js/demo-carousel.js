(function () {
    const track = document.querySelector('.demo-carousel__track');
    const slides = [...document.querySelectorAll('.demo-carousel__slide')];
    const btnPrev = document.querySelector('.demo-carousel__btn--prev');
    const btnNext = document.querySelector('.demo-carousel__btn--next');
    const dots = [...document.querySelectorAll('.demo-carousel__dot')];
    const dotList = document.querySelector('.demo-carousel__dots');

    if (!track || !slides.length || !btnPrev || !btnNext || !dotList) return;

    let current = 0;

    function getOffset(index) {
        const slideWidth = slides[0].offsetWidth;
        const gap = parseFloat(getComputedStyle(track).gap) || 20;

        return index * (slideWidth + gap);
    }

    function goTo(index, { moveTabFocus = false } = {}) {
        const selectedIndex = Math.max(0, Math.min(index, slides.length - 1));
        const focusedControl = document.activeElement;
        current = selectedIndex;
        track.style.transform = `translateX(-${getOffset(selectedIndex)}px)`;

        slides.forEach((slide, slideIndex) => {
            const isActive = slideIndex === selectedIndex;
            slide.classList.toggle('is-active', isActive);
            slide.setAttribute('aria-hidden', String(!isActive));
            slide.inert = !isActive;
        });
        dots.forEach((dot, dotIndex) => {
            const isActive = dotIndex === selectedIndex;
            dot.classList.toggle('is-active', isActive);
            dot.setAttribute('aria-selected', String(isActive));
            dot.tabIndex = isActive ? 0 : -1;
        });

        btnPrev.disabled = selectedIndex === 0;
        btnNext.disabled = selectedIndex === slides.length - 1;

        if (moveTabFocus || (focusedControl === btnPrev && btnPrev.disabled)
            || (focusedControl === btnNext && btnNext.disabled)) {
            dots[selectedIndex].focus();
        }
    }

    btnPrev.addEventListener('click', () => goTo(current - 1));
    btnNext.addEventListener('click', () => goTo(current + 1));
    dots.forEach((dot, index) => dot.addEventListener('click', () => goTo(index)));

    dotList.addEventListener('keydown', event => {
        let nextIndex = null;
        if (event.key === 'ArrowLeft') nextIndex = (current - 1 + slides.length) % slides.length;
        if (event.key === 'ArrowRight') nextIndex = (current + 1) % slides.length;
        if (event.key === 'Home') nextIndex = 0;
        if (event.key === 'End') nextIndex = slides.length - 1;
        if (nextIndex === null) return;

        event.preventDefault();
        goTo(nextIndex, { moveTabFocus: true });
    });

    window.addEventListener('resize', () => goTo(current));
    goTo(0);
})();
