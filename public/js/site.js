(function () {
  var nav = document.querySelector('.nav');
  var toggle = document.querySelector('.nav__toggle');
  var links = document.getElementById('nav-links');

  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    links.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        links.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  function onScroll() {
    if (nav) nav.classList.toggle('is-scrolled', window.scrollY > 8);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var form = document.getElementById('contact-form');
  if (!form || !window.fetch) return;
  var status = form.querySelector('.form__status');
  var button = form.querySelector('button[type="submit"]');

  function show(text, ok) {
    status.textContent = text;
    status.className = 'form__status ' + (ok ? 'is-ok' : 'is-error');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var data = new URLSearchParams(new FormData(form));
    if (!data.get('name') || !data.get('message')) return show('Please enter your name and a message.', false);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.get('email') || '')) return show('Please enter a valid email address.', false);

    button.disabled = true;
    status.textContent = 'Sending…';
    status.className = 'form__status';
    fetch('/contact', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
      body: data.toString(),
    })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (res.ok) {
          form.reset();
          show(form.getAttribute('data-success') || 'Thank you! Your message has been sent.', true);
        } else {
          show(res.error || 'Something went wrong. Please try again.', false);
        }
      })
      .catch(function () { show('Could not send right now. Please email me directly.', false); })
      .then(function () { button.disabled = false; });
  });
})();
