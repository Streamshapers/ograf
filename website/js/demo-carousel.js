(function () {
    const track = document.querySelector('.demo-carousel__track');
    const slides = [...document.querySelectorAll('.demo-carousel__slide')];
    const btnPrev = document.querySelector('.demo-carousel__btn--prev');
    const btnNext = document.querySelector('.demo-carousel__btn--next');
    const dots = [...document.querySelectorAll('.demo-carousel__dot')];
    const dotList = document.querySelector('.demo-carousel__dots');
    const carousel = document.querySelector('.demo-carousel');

    if (!track || !slides.length || !btnPrev || !btnNext || !dotList) return;

    let current = 0;

    function loadSlide(slide) {
        slide.querySelectorAll('iframe[data-src]').forEach(iframe => {
            iframe.src = iframe.dataset.src;
            iframe.removeAttribute('data-src');
        });
    }

    function getOffset(index) {
        const slideWidth = slides[0].offsetWidth;
        const gap = parseFloat(getComputedStyle(track).gap) || 20;

        return index * (slideWidth + gap);
    }

    function goTo(index, { loadContent = true, moveTabFocus = false } = {}) {
        const selectedIndex = Math.max(0, Math.min(index, slides.length - 1));
        const focusedControl = document.activeElement;
        current = selectedIndex;
        if (loadContent) loadSlide(slides[selectedIndex]);
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

    if (carousel && 'IntersectionObserver' in window) {
        const playerObserver = new IntersectionObserver(entries => {
            if (!entries.some(entry => entry.isIntersecting)) return;
            playerObserver.disconnect();
            loadSlide(slides[current]);
        }, { rootMargin: '500px 0px' });
        playerObserver.observe(carousel);
    } else {
        loadSlide(slides[current]);
    }

    window.addEventListener('resize', () => goTo(current, { loadContent: false }));
    goTo(0, { loadContent: false });
})();
