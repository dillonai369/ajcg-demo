/* ============================================================
 * AJ Commercial Group · Momentum Build
 * Transparent nav → solid nav on scroll
 *
 * Pages with class="has-hero" on body get a transparent nav
 * overlaying the first dark section (hero/page-header/property-
 * hero/broker-hero). Once the user scrolls past that section,
 * the nav becomes solid navy + fixed at the top of the viewport.
 *
 * Threshold = the height of the first dark section minus a small
 * buffer so the transition feels natural (kicks in just before
 * the section fully leaves view).
 * ============================================================ */
(function () {
  if (!document.body.classList.contains('has-hero')) return;
  var nav = document.querySelector('.nav');
  if (!nav) return;

  var darkSection = document.querySelector('.hero, .property-hero, .broker-hero, .page-header');

  function getThreshold() {
    if (darkSection) {
      // Become solid 80px before the dark section fully scrolls out
      return Math.max(80, darkSection.offsetHeight - 80);
    }
    // Fallback for any page without a dark first section
    return 80;
  }

  var threshold = getThreshold();

  function check() {
    if (window.scrollY > threshold) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  }

  check();
  window.addEventListener('scroll', check, { passive: true });
  window.addEventListener('resize', function () {
    threshold = getThreshold();
    check();
  });
})();
