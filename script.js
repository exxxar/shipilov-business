(function () {
  'use strict';

  // 1. Год в футере
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // 2. Cursor glow (только desktop)
  const cursorGlow = document.querySelector('.cursor-glow');
  if (cursorGlow && window.matchMedia('(min-width: 769px)').matches) {
    let x = window.innerWidth / 2, y = window.innerHeight / 2;
    let tx = x, ty = y;
    document.addEventListener('mousemove', (e) => { tx = e.clientX; ty = e.clientY; });
    function tick() {
      x += (tx - x) * 0.1;
      y += (ty - y) * 0.1;
      cursorGlow.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
      requestAnimationFrame(tick);
    }
    tick();
  }

  // 3. Reveal on scroll
  const revealTargets = document.querySelectorAll('.reveal, .road-item');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
  revealTargets.forEach((el) => revealObserver.observe(el));

  // 4. Stats counters (Исправленная и надёжная версия)
  console.log('🚀 Скрипт загружен. Ищем счётчики...');
  const statElements = document.querySelectorAll('.stat b[data-count]');
  console.log('Найдено элементов-счётчиков:', statElements.length);

  if (statElements.length > 0) {
    const counterObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          console.log('✅ Счётчик появился на экране:', entry.target.dataset.count);
          animateCount(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    statElements.forEach((el) => counterObserver.observe(el));
  }

  function animateCount(el) {
    const target = parseInt(el.dataset.count, 10);
    if (isNaN(target)) return;

    const duration = 2000;
    const start = performance.now();

    function step(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.round(target * eased);

      el.textContent = currentValue.toLocaleString('ru-RU');

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = target.toLocaleString('ru-RU') + '+';
      }
    }
    requestAnimationFrame(step);
  }

  // 5. Burger menu
  const burger = document.querySelector('.burger');
  const nav = document.querySelector('.main-nav');
  if (burger && nav) {
    burger.addEventListener('click', () => {
      burger.classList.toggle('open');
      nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', nav.classList.contains('open'));
      document.body.style.overflow = nav.classList.contains('open') ? 'hidden' : '';
    });
    nav.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', () => {
        burger.classList.remove('open');
        nav.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  // 6. Smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (href.length > 1) {
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });

  // 7. Project card animations
  document.querySelectorAll('.project-card').forEach((card) => {
    card.addEventListener('click', () => {
      card.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.96)' }, { transform: 'scale(1)' }], { duration: 300, easing: 'ease-out' });
    });
  });

  // 8. Fullscreen viewer (ОБЪЯВЛЕН РОВНО ОДИН РАЗ)
  const fsViewer = document.querySelector('.fs-viewer');
  const fsImg = fsViewer?.querySelector('.fs-stage img');
  const fsCaption = fsViewer?.querySelector('.fs-caption');
  const fsPrev = fsViewer?.querySelector('.fs-prev');
  const fsNext = fsViewer?.querySelector('.fs-next');
  const fsClose = fsViewer?.querySelector('.fs-close');
  let fsItems = [];
  let fsIndex = 0;

  function openViewer(items, index) {
    fsItems = items;
    fsIndex = index;
    showFs();
    fsViewer.removeAttribute('hidden');
    fsViewer.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
  function showFs() {
    const item = fsItems[fsIndex];
    if (fsImg && item.image) { fsImg.src = item.image; fsImg.alt = item.title || ''; }
    if (fsCaption) fsCaption.textContent = item.title || '';
  }
  function closeFs() {
    fsViewer.setAttribute('hidden', '');
    fsViewer.style.display = 'none';
    document.body.style.overflow = '';
  }

  if (fsViewer) {
    // Гарантируем скрытие при загрузке
    fsViewer.setAttribute('hidden', '');
    fsViewer.style.display = 'none';

    fsClose?.addEventListener('click', closeFs);
    fsPrev?.addEventListener('click', () => { fsIndex = (fsIndex - 1 + fsItems.length) % fsItems.length; showFs(); });
    fsNext?.addEventListener('click', () => { fsIndex = (fsIndex + 1) % fsItems.length; showFs(); });
    fsViewer.addEventListener('click', (e) => { if (e.target === fsViewer) closeFs(); });
    document.addEventListener('keydown', (e) => {
      if (fsViewer.style.display === 'none') return;
      if (e.key === 'Escape') closeFs();
      if (e.key === 'ArrowLeft') fsPrev?.click();
      if (e.key === 'ArrowRight') fsNext?.click();
    });
  }

  // Привязка к awards & gallery
  const awardItems = Array.from(document.querySelectorAll('.award-grid figure')).map((fig) => ({
    image: fig.querySelector('img')?.src || '',
    title: fig.querySelector('figcaption')?.textContent || ''
  }));
  document.querySelectorAll('.award-grid figure').forEach((fig, i) => {
    fig.addEventListener('click', () => { if (awardItems[i]?.image) openViewer(awardItems, i); });
  });

  const galleryItems = Array.from(document.querySelectorAll('.gallery-grid .photo')).map((ph) => ({
    image: ph.querySelector('img')?.src || '',
    title: ph.textContent.trim()
  }));
  document.querySelectorAll('.gallery-grid .photo').forEach((ph, i) => {
    ph.addEventListener('click', () => { if (galleryItems[i]?.image) openViewer(galleryItems, i); });
  });

  // 9. Cookie Banner Logic
  const cookieBanner = document.getElementById('cookieBanner');
  const acceptCookiesBtn = document.getElementById('acceptCookies');
  if (cookieBanner && acceptCookiesBtn) {
    if (!localStorage.getItem('cookiesAccepted')) {
      setTimeout(() => { cookieBanner.classList.add('show'); }, 1500);
    }
    acceptCookiesBtn.addEventListener('click', () => {
      localStorage.setItem('cookiesAccepted', 'true');
      cookieBanner.classList.remove('show');
    });
  }

  // 10. Form submission
  const form = document.getElementById('contactForm');
  const status = form?.querySelector('.form-status');
  if (form && status) {
    const tokenEl = document.getElementById('formToken');
    if (tokenEl && !tokenEl.value) tokenEl.value = Math.random().toString(36).slice(2) + Date.now().toString(36);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      status.classList.remove('show', 'success', 'error');

      const hp = form.querySelector('input[name="website"]');
      if (hp && hp.value.trim() !== '') {
        status.textContent = 'Спасибо! Заявка отправлена.';
        status.classList.add('show', 'success');
        form.reset();
        return;
      }

      const name = form.name.value.trim();
      const contact = form.contact.value.trim();
      const message = form.message.value.trim();
      const consent1 = form.consent_process.checked;
      const consent2 = form.consent_transfer.checked;

      if (!name || name.length < 2) return showStatus('Укажите имя.', 'error');
      if (!contact || contact.length < 3) return showStatus('Укажите телефон или Telegram.', 'error');
      if (!message || message.length < 5) return showStatus('Напишите сообщение.', 'error');
      if (!consent1) return showStatus('Необходимо согласие на обработку ПДн.', 'error');
      if (!consent2) return showStatus('Необходимо согласие на передачу данных.', 'error');

      const btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      const originalText = btn.innerHTML;
      btn.innerHTML = 'Отправляем...';

      try {
        const data = new FormData(form);
        const res = await fetch(form.action, { method: 'POST', body: data, headers: { 'X-Requested-With': 'XMLHttpRequest' } });
        const json = await res.json().catch(() => ({}));
        if (res.ok && json.success) {
          showStatus('Спасибо! Заявка отправлена. Мы свяжемся с вами.', 'success');
          form.reset();
        } else {
          showStatus(json.message || 'Не удалось отправить заявку.', 'error');
        }
      } catch (err) {
        // При локальном открытии (file://) fetch всегда будет падать. Это нормально.
        console.warn('Fetch error (возможно, сайт открыт как file://):', err);
        showStatus('Для отправки формы сайт должен быть запущен на локальном сервере (http://).', 'error');
      } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
      }

      function showStatus(text, type) {
        status.textContent = text;
        status.classList.add('show', type);
      }
    });
  }

  // 11. Parallax hero orb
  const orb = document.querySelector('.hero-orb');
  if (orb && window.matchMedia('(min-width: 769px)').matches) {
    window.addEventListener('mousemove', (e) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      orb.style.transform = `translate(${((e.clientX - cx) / cx) * 20}px, ${((e.clientY - cy) / cy) * 20}px)`;
    });
  }

  // 12. Header scroll
  const header = document.querySelector('.site-header');
  if (header) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 40) header.classList.add('scrolled');
      else header.classList.remove('scrolled');
    }, { passive: true });
  }
})();