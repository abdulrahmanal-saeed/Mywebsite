(function () {
  // Confirm before destructive actions.
  document.querySelectorAll('form[data-confirm]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      if (!window.confirm(form.getAttribute('data-confirm'))) e.preventDefault();
    });
  });

  // Mobile sidebar.
  var side = document.getElementById('side');
  var menuBtn = document.querySelector('[data-toggle="side"]');
  if (side && menuBtn) {
    menuBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = side.classList.toggle('is-open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', function (e) {
      if (side.classList.contains('is-open') && !side.contains(e.target)) {
        side.classList.remove('is-open');
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Photo preview before upload.
  document.querySelectorAll('[data-preview-input]').forEach(function (input) {
    var img = document.querySelector('[data-preview="' + input.getAttribute('data-preview-input') + '"]');
    input.addEventListener('change', function () {
      if (img && input.files && input.files[0]) img.src = URL.createObjectURL(input.files[0]);
    });
  });

  // Chart <-> table toggle.
  document.querySelectorAll('[data-toggle-table]').forEach(function (btn) {
    var table = document.getElementById(btn.getAttribute('data-toggle-table'));
    btn.addEventListener('click', function () {
      table.hidden = !table.hidden;
      btn.textContent = table.hidden ? 'Show as table' : 'Hide table';
    });
  });

  // Chart hover tooltip.
  document.querySelectorAll('[data-chart]').forEach(function (chart) {
    var tip = chart.querySelector('.chart__tip');
    var svg = chart.querySelector('svg');
    var active = null;
    chart.querySelectorAll('.chart__col').forEach(function (col) {
      function show() {
        if (active) active.classList.remove('is-active');
        active = col;
        col.classList.add('is-active');
        var parts = col.getAttribute('data-tip').split('|');
        tip.innerHTML = '';
        var strong = document.createElement('strong');
        strong.textContent = parts[0];
        tip.appendChild(strong);
        tip.appendChild(document.createTextNode(parts[1]));
        var hit = col.querySelector('.chart__hit').getBoundingClientRect();
        var box = chart.getBoundingClientRect();
        var x = hit.left - box.left + hit.width / 2;
        tip.hidden = false;
        var half = tip.offsetWidth / 2;
        tip.style.left = Math.min(Math.max(x, half), box.width - half) + 'px';
        tip.style.top = hit.top - box.top + 'px';
      }
      col.addEventListener('mouseenter', show);
      col.addEventListener('click', show);
    });
    svg.addEventListener('mouseleave', function () {
      tip.hidden = true;
      if (active) active.classList.remove('is-active');
    });
  });
})();
