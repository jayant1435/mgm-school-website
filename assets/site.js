(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  // Mobile menu
  const menuButton = $('.menu-trigger');
  const menu = $('#mobile-nav');
  const header = $('.site-header');

  const updateHeaderHeight = () => {
    if (header) {
      document.documentElement.style.setProperty('--header-h', `${header.offsetHeight}px`);
    }
  };

  const openMenu = () => {
    if (!menu || !menuButton) return;
    updateHeaderHeight();
    menu.hidden = false;
    document.body.classList.add('menu-open');
    menuButton.setAttribute('aria-expanded', 'true');
    menuButton.setAttribute('aria-label', 'Close menu');
  };
  const closeMenu = () => {
    if (!menu || !menuButton) return;
    menu.hidden = true;
    document.body.classList.remove('menu-open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open menu');
  };
  if (menuButton && menu) {
    closeMenu();
    updateHeaderHeight();
    menuButton.addEventListener('click', event => {
      event.stopPropagation();
      menu.hidden ? openMenu() : closeMenu();
    });
    $$('a', menu).forEach(link => link.addEventListener('click', closeMenu));
    window.addEventListener('resize', () => {
      updateHeaderHeight();
      if (window.innerWidth > 1060) closeMenu();
    }, { passive: true });
    window.addEventListener('orientationchange', () => {
      setTimeout(updateHeaderHeight, 100);
    }, { passive: true });
    document.addEventListener('click', event => {
      if (!menu.hidden && !menu.contains(event.target) && !menuButton.contains(event.target)) closeMenu();
    });
  }

  // Infinite looping carousel: clones sets to both sides, resets position on scrollend without vibration.
  const setupCarousel = rail => {
    const originals = $$('.activity-slide', rail);
    if (originals.length < 2) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const n = originals.length;

    const copy = node => {
      const dup = node.cloneNode(true);
      dup.classList.add('is-clone');
      dup.setAttribute('aria-hidden', 'true');
      dup.querySelectorAll('a,button').forEach(el => { el.tabIndex = -1; });
      return dup;
    };

    // Prepend 2 clone sets and append 2 clone sets for generous swipe buffer
    const p1 = originals.map(copy);
    const p2 = originals.map(copy);
    const n1 = originals.map(copy);
    const n2 = originals.map(copy);
    p1.slice().reverse().forEach(node => rail.insertBefore(node, rail.firstChild));
    p2.slice().reverse().forEach(node => rail.insertBefore(node, rail.firstChild));
    n1.forEach(node => rail.appendChild(node));
    n2.forEach(node => rail.appendChild(node));

    let timer = null;
    let isInteracting = false;
    let resumeTimeout = null;
    let isNormalizing = false;
    let scrollEndTimer = null;
    let isVisible = true;

    const getSetWidth = () => {
      const all = Array.from(rail.querySelectorAll('.activity-slide'));
      if (all.length < 3 * n) return 0;
      return all[3 * n].offsetLeft - all[2 * n].offsetLeft;
    };

    const getSlideScrollTarget = (index) => {
      const all = Array.from(rail.querySelectorAll('.activity-slide'));
      const target = all[index];
      if (!target) return 0;
      const base = target.offsetLeft - rail.offsetLeft;
      if (window.innerWidth <= 780) {
        return Math.round(base - (rail.clientWidth - target.offsetWidth) / 2);
      }
      return base;
    };

    const initPosition = () => {
      rail.style.scrollBehavior = 'auto';
      rail.style.scrollSnapType = 'none';
      rail.scrollLeft = getSlideScrollTarget(2 * n);
      setTimeout(() => {
        rail.style.scrollBehavior = '';
        rail.style.scrollSnapType = '';
      }, 50);
    };

    // Teleport position seamlessly ONLY when scrolling has completely stopped
    const checkLoop = () => {
      if (isNormalizing) return;
      const setWidth = getSetWidth();
      if (!setWidth) return;

      const startOfOriginals = getSlideScrollTarget(2 * n);
      const endOfOriginals = getSlideScrollTarget(3 * n);

      // If user scrolled into the prepended clone buffer (left)
      if (rail.scrollLeft < startOfOriginals - 10) {
        isNormalizing = true;
        const prevSnap = rail.style.scrollSnapType;
        rail.style.scrollSnapType = 'none';
        rail.style.scrollBehavior = 'auto';
        while (rail.scrollLeft < startOfOriginals - 10) {
          rail.scrollLeft += setWidth;
        }
        requestAnimationFrame(() => {
          rail.style.scrollSnapType = prevSnap;
          rail.style.scrollBehavior = '';
          isNormalizing = false;
        });
      }
      // If user scrolled into the appended clone buffer (right)
      else if (rail.scrollLeft >= endOfOriginals - 10) {
        isNormalizing = true;
        const prevSnap = rail.style.scrollSnapType;
        rail.style.scrollSnapType = 'none';
        rail.style.scrollBehavior = 'auto';
        while (rail.scrollLeft >= endOfOriginals - 10) {
          rail.scrollLeft -= setWidth;
        }
        requestAnimationFrame(() => {
          rail.style.scrollSnapType = prevSnap;
          rail.style.scrollBehavior = '';
          isNormalizing = false;
        });
      }
    };

    const stop = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };

    const getStep = () => {
      const all = Array.from(rail.querySelectorAll('.activity-slide'));
      if (all.length > 2 * n + 1) {
        return all[2 * n + 1].offsetLeft - all[2 * n].offsetLeft;
      }
      return 320;
    };

    const advance = () => {
      if (document.hidden || reduced.matches || isInteracting || !isVisible) return;
      rail.scrollBy({ left: getStep(), behavior: 'smooth' });
    };

    const play = () => {
      stop();
      if (!reduced.matches && !document.hidden && !isInteracting && isVisible) {
        timer = setInterval(advance, 4000);
      }
    };

    const pauseInteraction = () => {
      isInteracting = true;
      stop();
      if (resumeTimeout) clearTimeout(resumeTimeout);
      resumeTimeout = setTimeout(() => {
        isInteracting = false;
        play();
      }, 5000);
    };

    // Use native scrollend event where supported, with debounced fallback for infinite teleport
    rail.addEventListener('scrollend', checkLoop, { passive: true });
    rail.addEventListener('scroll', () => {
      clearTimeout(scrollEndTimer);
      scrollEndTimer = setTimeout(checkLoop, 150);
    }, { passive: true });

    rail.addEventListener('pointerdown', pauseInteraction, { passive: true });
    rail.addEventListener('touchstart', pauseInteraction, { passive: true });
    rail.addEventListener('wheel', pauseInteraction, { passive: true });
    rail.addEventListener('mouseenter', stop, { passive: true });
    rail.addEventListener('mouseleave', () => {
      if (!isInteracting) play();
    }, { passive: true });
    rail.addEventListener('focusin', stop);
    rail.addEventListener('focusout', play);

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          isVisible = entry.isIntersecting;
          if (isVisible) {
            play();
          } else {
            stop();
          }
        });
      }, { threshold: 0.15 });
      observer.observe(rail);
    }
    // Desktop navigation arrow buttons
    const section = rail.closest('.home-routes') || rail.parentElement;
    const prevBtn = section ? section.querySelector('.carousel-arrow.prev') : null;
    const nextBtn = section ? section.querySelector('.carousel-arrow.next') : null;

    if (prevBtn) {
      prevBtn.addEventListener('click', e => {
        e.preventDefault();
        pauseInteraction();
        rail.scrollBy({ left: -getStep(), behavior: 'smooth' });
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', e => {
        e.preventDefault();
        pauseInteraction();
        rail.scrollBy({ left: getStep(), behavior: 'smooth' });
      });
    }

    // Desktop Grab & Drag
    let isMouseDown = false;
    let startX = 0;
    let scrollStart = 0;
    let hasDragged = false;

    rail.addEventListener('mousedown', e => {
      if (e.button !== 0) return;
      isMouseDown = true;
      hasDragged = false;
      startX = e.pageX - rail.offsetLeft;
      scrollStart = rail.scrollLeft;
      rail.classList.add('is-dragging');
      pauseInteraction();
    });

    window.addEventListener('mousemove', e => {
      if (!isMouseDown) return;
      const x = e.pageX - rail.offsetLeft;
      const walk = (x - startX) * 1.4;
      if (Math.abs(x - startX) > 5) {
        hasDragged = true;
      }
      rail.scrollLeft = scrollStart - walk;
    });

    window.addEventListener('mouseup', () => {
      if (!isMouseDown) return;
      isMouseDown = false;
      rail.classList.remove('is-dragging');
      checkLoop();
    });

    rail.addEventListener('click', e => {
      if (hasDragged) {
        e.preventDefault();
        e.stopPropagation();
        hasDragged = false;
      }
    }, true);

    window.addEventListener('resize', () => initPosition(), { passive: true });
    window.addEventListener('load', () => initPosition(), { once: true });

    // Initialize position and start auto-scroll immediately
    initPosition();
    play();
    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(() => initPosition());
    }
  };
  $$('[data-carousel]').forEach(setupCarousel);

  // Silent video: attempt playback when in view; leave the poster visible if
  // the browser blocks autoplay. The on-card button always allows manual play.
  const PAUSE_ICON_SVG = '<svg class="icon-pause" aria-hidden="true" fill="currentColor" height="15" viewBox="0 0 24 24" width="15" style="display:block;"><rect height="16" rx="1.5" width="4" x="5" y="4"></rect><rect height="16" rx="1.5" width="4" x="15" y="4"></rect></svg>';
  const PLAY_ICON_SVG = '<svg class="icon-play" aria-hidden="true" fill="currentColor" height="15" viewBox="0 0 24 24" width="15" style="display:block;margin-left:2px;"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5z"></path></svg>';

  $$('.motion-media').forEach(frame => {
    const video = $('video', frame);
    const toggle = $('.video-toggle', frame);
    if (!video || !toggle) return;
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    const setButton = () => {
      const running = !video.paused && !video.ended;
      frame.classList.toggle('is-playing', running);
      toggle.setAttribute('aria-label', running ? 'Pause video' : 'Play video');
      toggle.innerHTML = running ? PAUSE_ICON_SVG : PLAY_ICON_SVG;
    };
    toggle.addEventListener('click', async () => {
      if (video.paused) { try { await video.play(); } catch(e) { video.controls = true; } }
      else video.pause();
      setButton();
    });
    video.addEventListener('loadeddata', setButton);
    video.addEventListener('playing', setButton);
    video.addEventListener('play', setButton);
    video.addEventListener('pause', setButton);
    video.addEventListener('error', () => { frame.classList.remove('is-playing'); toggle.hidden = true; });
    if ('IntersectionObserver' in window) {
      const watch = new IntersectionObserver(items => {
        for (const item of items) {
          if (item.isIntersecting) {
            if (!reducedMotion.matches) video.play().catch(() => {});
          } else video.pause();
        }
      }, { threshold: .3 });
      watch.observe(frame);
    } else if (!reducedMotion.matches) video.play().catch(() => {});
    setButton();
  });

  // Staff modal
  const staff = [
    { name: 'Sabitri Majhi', qualification: 'B.A.', photo: 'teacher-portrait-sabitri' },
    { name: 'Kalyani Singh', qualification: 'D.El.Ed., B.Ed., M.A.', photo: 'teacher-portrait-kalyani' },
    { name: 'Tofina Khatun', qualification: 'B.A.', photo: 'teacher-portrait-tofina' },
    { name: 'Kavita Sanyasi', qualification: 'B.Ed., M.A.', photo: 'teacher-portrait-kavita' },
    { name: 'Shilpi Singh', qualification: 'M.Com.', photo: 'teacher-portrait-shilpi' },
    { name: 'Pratiusha Minj', qualification: 'B.Sc., B.Ed.', photo: 'teacher-portrait-pratiusha' }
  ];
  const teacherModal = $('#teacher-modal');
  let returnFocus = null;
  const openTeacher = (index, button) => {
    const person = staff[index];
    if (!teacherModal || !person) return;
    returnFocus = button;
    $('#teacher-modal-title').textContent = person.name;
    $('#teacher-modal-qual').textContent = `Qualification: ${person.qualification}`;
    const photo = $('#teacher-modal-img');
    photo.src = `assets/img/${person.photo}.webp`;
    photo.alt = `Portrait of ${person.name}`;
    teacherModal.hidden = false;
    document.body.classList.add('lock-scroll');
    $('[data-modal-close]', teacherModal)?.focus();
  };
  const closeTeacher = () => {
    if (!teacherModal || teacherModal.hidden) return;
    teacherModal.hidden = true;
    document.body.classList.remove('lock-scroll');
    returnFocus?.focus();
  };
  $$('[data-teacher]').forEach(button => button.addEventListener('click', () => openTeacher(Number(button.dataset.teacher), button)));
  $$('[data-modal-close]').forEach(button => button.addEventListener('click', closeTeacher));

  // Gallery lightbox derived from DOM
  const lightbox = $('#lightbox');
  const galleryButtons = $$('[data-lightbox]').sort((a, b) => Number(a.dataset.lightbox) - Number(b.dataset.lightbox));
  const galleryData = galleryButtons.map(button => [button.dataset.file, button.dataset.caption || $('.journal-caption', button)?.textContent?.trim() || 'School photograph']);
  let activePhoto = 0;
  let initialTouch = null;
  const showPhoto = () => {
    if (!galleryData[activePhoto]) return;
    const [file, label] = galleryData[activePhoto];
    const image = $('#lightbox-img');
    image.src = `assets/img/${file}.webp`;
    image.alt = label;
    $('#lightbox-caption').textContent = label;
    $('#lightbox-position').textContent = `${activePhoto + 1} of ${galleryData.length}`;
  };
  const openPhoto = (index, button) => {
    if (!lightbox || !galleryData[index]) return;
    returnFocus = button;
    activePhoto = index;
    showPhoto();
    lightbox.hidden = false;
    document.body.classList.add('lock-scroll');
    $('[data-lightbox-close]', lightbox)?.focus();
  };
  const closePhoto = () => {
    if (!lightbox || lightbox.hidden) return;
    lightbox.hidden = true;
    $('#lightbox-img').removeAttribute('src');
    document.body.classList.remove('lock-scroll');
    returnFocus?.focus();
  };
  const advancePhoto = step => {
    activePhoto = (activePhoto + step + galleryData.length) % galleryData.length;
    showPhoto();
  };
  galleryButtons.forEach(button => button.addEventListener('click', () => openPhoto(Number(button.dataset.lightbox), button)));
  $$('[data-lightbox-close]').forEach(button => button.addEventListener('click', closePhoto));
  $('[data-lightbox-prev]')?.addEventListener('click', () => advancePhoto(-1));
  $('[data-lightbox-next]')?.addEventListener('click', () => advancePhoto(1));
  if (lightbox) {
    lightbox.addEventListener('touchstart', event => { initialTouch = event.changedTouches[0]?.screenX ?? null; }, { passive: true });
    lightbox.addEventListener('touchend', event => {
      if (initialTouch === null) return;
      const movement = (event.changedTouches[0]?.screenX ?? initialTouch) - initialTouch;
      initialTouch = null;
      if (Math.abs(movement) > 65) advancePhoto(movement < 0 ? 1 : -1);
    }, { passive: true });
  }

  // Contact form: open email draft only
  const form = $('#message-form');
  if (form) {
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!form.reportValidity()) {
        $('.form-response', form).textContent = 'Please complete the required fields before continuing.';
        return;
      }
      const values = Object.fromEntries(new FormData(form).entries());
      const body = [
        'Hello Manish Giri Memorial School,', '',
        values.message.trim(), '',
        `From: ${values.name.trim()}`,
        `Phone: ${values.phone.trim()}`,
        `Email: ${values.email?.trim() || 'Not provided'}`,
        `Topic: ${values.topic}`
      ].join('\n');
      const subject = `${values.topic} — Manish Giri Memorial School`;
      const href = `mailto:mgmsschool16@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      $('.form-response', form).textContent = 'Your email app should open with a ready draft. Please review it and press Send there.';
      window.location.href = href;
    });
  }

  // Accessibility + keyboard handling for overlays
  const focusTrap = modal => {
    const controls = $$('button:not([disabled]),a[href],input,textarea,select', modal).filter(element => element.getClientRects().length);
    if (!controls.length) return null;
    return { first: controls[0], last: controls[controls.length - 1] };
  };
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      closeMenu();
      if (!teacherModal?.hidden) closeTeacher();
      if (!lightbox?.hidden) closePhoto();
      return;
    }
    const modal = !teacherModal?.hidden ? teacherModal : (!lightbox?.hidden ? lightbox : null);
    if (!modal || event.key !== 'Tab') return;
    const trap = focusTrap(modal);
    if (!trap) return;
    if (event.shiftKey && document.activeElement === trap.first) {
      event.preventDefault();
      trap.last.focus();
    } else if (!event.shiftKey && document.activeElement === trap.last) {
      event.preventDefault();
      trap.first.focus();
    }
  });

  $('#copyright-year')?.replaceChildren(document.createTextNode(String(new Date().getFullYear())));

  // Reveal animations on desktop and mobile scroll
  const revealTargets = [
    '.hero-copy', '.hero-media', '.intro-split > *', '.values-grid > *', '.motion-card',
    '.home-contact-inner > *', '.journal-item', '.learning-entry', '.learn-note-grid > *', '.admissions-grid > *',
    '.admission-steps > div', '.contact-details > *', '.contact-form', '.principal-grid > *', '.person', '.team-photo-grid > *',
    '.belief-list > div', '.story-hero-grid > *', '.partnership-grid > *', '.story-people-grid > *'
  ];
  revealTargets.forEach(selector => $$(selector).forEach(node => node.setAttribute('data-reveal', '')));

  if (!reducedMotion.matches && 'IntersectionObserver' in window) {
    document.body.classList.add('has-observer');
    const observed = $$('[data-reveal]');
    observed.forEach((element, index) => element.style.setProperty('--reveal-delay', `${(index % 3) * 80}ms`));
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        entry.target.classList.toggle('entered', entry.isIntersecting);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -8% 0px' });
    observed.forEach(element => observer.observe(element));
  } else {
    $$('[data-reveal]').forEach(element => element.classList.add('entered'));
  }
})();
