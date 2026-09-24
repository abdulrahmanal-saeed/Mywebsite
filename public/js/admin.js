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

  // Photo cropper: square crop, shown as circle or square to match the chosen shape.
  var editor = document.querySelector('[data-photo-editor]');
  if (editor) {
    var OUT = 800;
    var fileInput = editor.querySelector('[data-crop-input]');
    var box = editor.querySelector('[data-cropper]');
    var canvas = box.querySelector('canvas');
    var ctx = canvas.getContext('2d');
    var zoomInput = editor.querySelector('[data-crop-zoom]');
    var preview = editor.querySelector('[data-preview="photo"]');
    var note = editor.querySelector('[data-crop-note]');
    var shapeInputs = editor.querySelectorAll('input[name="photo_shape"]');
    var img = null, zoom = 1, cx = 0, cy = 0, fileName = 'photo.jpg', applied = false;

    function isCircle() {
      var checked = editor.querySelector('input[name="photo_shape"]:checked');
      return !checked || checked.value === 'circle';
    }
    // Size of the source square (in image pixels) visible in the frame.
    function viewSize() { return Math.min(img.width, img.height) / zoom; }
    function clamp() {
      var half = viewSize() / 2;
      cx = Math.min(Math.max(cx, half), img.width - half);
      cy = Math.min(Math.max(cy, half), img.height - half);
    }
    function drawTo(context, size) {
      var v = viewSize();
      context.drawImage(img, cx - v / 2, cy - v / 2, v, v, 0, 0, size, size);
    }
    function render() {
      if (!img) return;
      var W = canvas.width;
      ctx.clearRect(0, 0, W, W);
      drawTo(ctx, W);
      // Dim everything outside the final shape.
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath();
      ctx.rect(0, 0, W, W);
      if (isCircle()) ctx.arc(W / 2, W / 2, W / 2 - 2, 0, Math.PI * 2, true);
      else ctx.rect(W - 2, 2, -(W - 4), W - 4);
      ctx.fill('evenodd');
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (isCircle()) ctx.arc(W / 2, W / 2, W / 2 - 2, 0, Math.PI * 2);
      else ctx.rect(2, 2, W - 4, W - 4);
      ctx.stroke();
      ctx.restore();
    }
    function open(src, name) {
      var image = new Image();
      image.onload = function () {
        img = image;
        fileName = (name || 'photo').replace(/\.[^.]+$/, '') + '-cropped.jpg';
        zoom = 1;
        zoomInput.value = 1;
        cx = img.width / 2;
        // Portraits: start near the top where the face usually is.
        cy = img.height > img.width ? img.width / 2 + (img.height - img.width) * 0.15 : img.height / 2;
        clamp();
        box.hidden = false;
        note.hidden = true;
        render();
        box.scrollIntoView({ behavior: 'smooth', block: 'center' });
      };
      image.src = src;
    }

    fileInput.addEventListener('change', function () {
      applied = false;
      var f = fileInput.files && fileInput.files[0];
      if (f) open(URL.createObjectURL(f), f.name);
    });
    editor.querySelector('[data-crop-current]').addEventListener('click', function (e) {
      open(e.currentTarget.getAttribute('data-crop-current'), 'photo');
    });
    zoomInput.addEventListener('input', function () {
      zoom = Number(zoomInput.value);
      clamp();
      render();
    });
    canvas.addEventListener('wheel', function (e) {
      e.preventDefault();
      zoom = Math.min(4, Math.max(1, zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08)));
      zoomInput.value = zoom;
      clamp();
      render();
    }, { passive: false });

    var drag = null;
    canvas.addEventListener('pointerdown', function (e) {
      drag = { x: e.clientX, y: e.clientY, cx: cx, cy: cy };
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', function (e) {
      if (!drag || !img) return;
      var scale = viewSize() / canvas.getBoundingClientRect().width;
      cx = drag.cx - (e.clientX - drag.x) * scale;
      cy = drag.cy - (e.clientY - drag.y) * scale;
      clamp();
      render();
    });
    canvas.addEventListener('pointerup', function () { drag = null; });
    canvas.addEventListener('pointercancel', function () { drag = null; });

    shapeInputs.forEach(function (r) {
      r.addEventListener('change', function () {
        preview.classList.toggle('is-circle', isCircle());
        render();
      });
    });

    editor.querySelector('[data-crop-cancel]').addEventListener('click', function () {
      box.hidden = true;
      if (!applied) fileInput.value = '';
    });
    editor.querySelector('[data-crop-apply]').addEventListener('click', function () {
      var out = document.createElement('canvas');
      out.width = out.height = Math.min(OUT, Math.round(viewSize()));
      var octx = out.getContext('2d');
      octx.fillStyle = '#fff';
      octx.fillRect(0, 0, out.width, out.height);
      drawTo(octx, out.width);
      out.toBlob(function (blob) {
        var file = new File([blob], fileName, { type: 'image/jpeg' });
        var dt = new DataTransfer();
        dt.items.add(file);
        fileInput.files = dt.files;
        applied = true;
        preview.src = URL.createObjectURL(blob);
        box.hidden = true;
        note.hidden = false;
      }, 'image/jpeg', 0.9);
    });
  }

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
