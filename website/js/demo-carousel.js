(function () {
  const track    = document.querySelector('.demo-carousel__track');
  const slides   = [...document.querySelectorAll('.demo-carousel__slide')];
  const btnPrev  = document.querySelector('.demo-carousel__btn--prev');
  const btnNext  = document.querySelector('.demo-carousel__btn--next');
  const dots     = [...document.querySelectorAll('.demo-carousel__dot')];

  let current = 0;

  function getOffset(index) {
    const slideWidth = slides[0].offsetWidth;
    const gap = parseFloat(getComputedStyle(track).gap) || 20;
    return index * (slideWidth + gap);
  }

  function goTo(index) {
    current = index;
    track.style.transform = `translateX(-${getOffset(index)}px)`;

    const hasPrev = index > 0;
    const hasNext = index < slides.length - 1;

    slides.forEach((slide, i) => {
      const isActive = i === index;
      slide.classList.toggle('is-active', isActive);
      slide.setAttribute('aria-hidden', isActive ? 'false' : 'true');
      slide.inert = !isActive;
    });
    dots.forEach((dot, i) => {
      dot.classList.toggle('is-active', i === index);
      dot.setAttribute('aria-selected', i === index ? 'true' : 'false');
    });

    btnPrev.disabled = !hasPrev;
    btnNext.disabled = !hasNext;
  }

  btnPrev.addEventListener('click', () => { if (current > 0) goTo(current - 1); });
  btnNext.addEventListener('click', () => { if (current < slides.length - 1) goTo(current + 1); });
  dots.forEach((dot, i) => dot.addEventListener('click', () => goTo(i)));

  document.querySelector('.demo-carousel__dots').addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft'  && current > 0)                goTo(current - 1);
    if (e.key === 'ArrowRight' && current < slides.length - 1) goTo(current + 1);
  });

  // Recalculate offset on resize (slide widths change)
  window.addEventListener('resize', () => goTo(current));

  goTo(0);
})();
