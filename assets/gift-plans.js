(function () {
  'use strict';

  // ─── Constantes ────────────────────────────────────────────────────────────

  var SESSION_KEY = 'giftPlansState';

  var EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var ZIP_REGEX   = /^[0-9]{5}$/;

  // Campos requeridos del formulario con su ID en el DOM y clave en el estado
  var REQUIRED_FIELDS = [
    { domId: 'gp-recipient-name',    key: 'recipient_name',    message: 'Recipient name is required.' },
    { domId: 'gp-recipient-email',   key: 'recipient_email',   message: 'Please enter a valid email address.' },
    { domId: 'gp-recipient-address', key: 'recipient_address', message: 'Street address is required.' },
    { domId: 'gp-recipient-city',    key: 'recipient_city',    message: 'City is required.' },
    { domId: 'gp-recipient-state',   key: 'recipient_state',   message: 'Please select a state.' },
    { domId: 'gp-recipient-zip',     key: 'recipient_zip',     message: 'Please enter a valid 5-digit zip code.' },
    { domId: 'gp-start-date',        key: 'start_date',        message: 'Please select a valid start date.' }
  ];

  // Todos los campos que se persisten en sessionStorage (incluye el opcional)
  var ALL_FIELDS = REQUIRED_FIELDS.map(function (f) { return f; }).concat([
    { domId: 'gp-gift-message', key: 'gift_message' }
  ]);

  // ─── Estado central ────────────────────────────────────────────────────────

  var state = {
    boxSize:  null,   // 'regular' | 'pro' | 'elite'
    duration: null,   // 3 | 6 | 12
    fields: {
      recipient_name:    '',
      recipient_email:   '',
      recipient_address: '',
      recipient_city:    '',
      recipient_state:   '',
      recipient_zip:     '',
      start_date:        '',
      gift_message:      ''
    }
  };

  // ─── Referencias al DOM ────────────────────────────────────────────────────

  var submitBtn   = document.querySelector('.gift-plans__submit');
  var submitError = document.querySelector('.gift-plans__submit-error');
  var submitPrice = document.querySelector('[data-submit-price]');
  var charCount   = document.getElementById('gp-gift-message-count');

  // ─── Utilidades de UI ──────────────────────────────────────────────────────

  // Muestra un mensaje de error debajo de un campo
  function showFieldError(domId, message) {
    var input = document.getElementById(domId);
    var error = document.getElementById('gp-error-' + domId.replace('gp-', ''));
    if (input) input.classList.add('gift-plans__form-input--error');
    if (error) error.textContent = message;
  }

  // Limpia el error de un campo
  function clearFieldError(domId) {
    var input = document.getElementById(domId);
    var error = document.getElementById('gp-error-' + domId.replace('gp-', ''));
    if (input) input.classList.remove('gift-plans__form-input--error');
    if (error) error.textContent = '';
  }

  // Limpia todos los errores de campo
  function clearAllFieldErrors() {
    ALL_FIELDS.forEach(function (f) { clearFieldError(f.domId); });
  }

  // Actualiza las clases de estado visual de cada step
  function updateStepStates() {
    var step1 = document.querySelector('[data-step="1"]');
    var step2 = document.querySelector('[data-step="2"]');
    var step3 = document.querySelector('[data-step="3"]');
    if (!step1 || !step2 || !step3) return;

    // Step 1: activo al inicio, completado cuando hay boxSize
    step1.classList.toggle('is-active',    !state.boxSize);
    step1.classList.toggle('is-completed', !!state.boxSize);
    step1.classList.remove('is-locked');

    // Step 2: bloqueado sin boxSize, activo con boxSize, completado con duration
    step2.classList.toggle('is-locked',    !state.boxSize);
    step2.classList.toggle('is-active',    !!state.boxSize && !state.duration);
    step2.classList.toggle('is-completed', !!state.duration);

    // Step 3: bloqueado sin duration, activo con duration, completado cuando form listo
    var formComplete = isFormReady();
    step3.classList.toggle('is-locked',    !state.duration);
    step3.classList.toggle('is-active',    !!state.duration && !formComplete);
    step3.classList.toggle('is-completed', !!state.duration && formComplete);
  }

  // Muestra u oculta el error global bajo el botón submit
  function setSubmitError(message) {
    if (!submitError) return;
    if (message) {
      submitError.textContent = message;
      submitError.removeAttribute('hidden');
    } else {
      submitError.textContent = '';
      submitError.setAttribute('hidden', '');
    }
  }

  // Actualiza el precio visible en el botón y en las opciones de duración
  function updatePriceDisplay() {
    if (!window.GIFT_PLANS_DATA || !state.boxSize) return;

    var product = window.GIFT_PLANS_DATA[state.boxSize];
    if (!product) return;

    // Actualiza el precio en cada opción de duración
    product.variants.forEach(function (variant) {
      var priceEl = document.querySelector('[data-price-for="' + variant.duration + '"]');
      if (priceEl) priceEl.textContent = variant.price_formatted;
    });

    // Actualiza el precio en el botón submit si hay duración seleccionada
    if (state.duration && submitPrice) {
      var selectedVariant = findVariant(state.boxSize, state.duration);
      if (selectedVariant) {
        submitPrice.textContent = selectedVariant.price_formatted;
      }
    }
  }

  // Resetea los precios de las opciones de duración al valor placeholder
  function resetPriceDisplay() {
    document.querySelectorAll('[data-price-for]').forEach(function (el) {
      el.textContent = '—';
    });
    if (submitPrice) submitPrice.textContent = '$0.00';
  }

  // Genera las opciones de duración en el DOM según el box seleccionado
  function renderDurationOptions(boxSize) {
    var container = document.getElementById('gp-duration-list');
    if (!container) return;

    container.innerHTML = '';

    if (!window.GIFT_PLANS_DATA || !boxSize) return;

    var product = window.GIFT_PLANS_DATA[boxSize];
    if (!product || !product.variants || !product.variants.length) return;

    var variants = product.variants;
    var total = variants.length;

    variants.forEach(function (variant, index) {
      var label = variant.duration + (variant.duration === 1 ? ' Month' : ' Months');
      var tagText = '';
      if (total > 1) {
        if (index === total - 1) {
          tagText = 'Best Value';
        } else if (index > 0) {
          tagText = 'Popular';
        }
      }

      var tagHTML = tagText
        ? '<span class="gift-plans__duration-tag">' + tagText + '</span>'
        : '';

      var html =
        '<label class="gift-plans__duration-option" data-duration="' + variant.duration + '">' +
          '<input type="radio" name="gift_duration" value="' + variant.duration + '" class="gift-plans__duration-radio sr-only" aria-label="' + label + '">' +
          '<span class="gift-plans__duration-card">' +
            '<span class="gift-plans__duration-card-left">' +
              '<span class="gift-plans__duration-dot"></span>' +
              '<span class="gift-plans__duration-name">' + label + '</span>' +
            '</span>' +
            '<span class="gift-plans__duration-card-right">' +
              tagHTML +
              '<span class="gift-plans__duration-price" data-price-for="' + variant.duration + '">' + variant.price_formatted + '</span>' +
            '</span>' +
          '</span>' +
        '</label>';

      container.insertAdjacentHTML('beforeend', html);
    });
  }

  // Habilita o deshabilita el botón submit según el estado completo
  function updateSubmitButton() {
    if (!submitBtn) return;
    var ready = isFormReady();
    submitBtn.disabled = !ready;
  }

  // Marca una card de box como seleccionada o deseleccionada
  function setBoxCardSelected(boxSize) {
    document.querySelectorAll('.gift-plans__box-card').forEach(function (card) {
      var isSelected = card.dataset.boxSize === boxSize;
      card.classList.toggle('is-selected', isSelected);
    });
  }

  // Marca una opción de duración como seleccionada o deseleccionada
  function setDurationSelected(duration) {
    document.querySelectorAll('.gift-plans__duration-option').forEach(function (opt) {
      var isSelected = parseInt(opt.dataset.duration, 10) === duration;
      opt.classList.toggle('is-selected', isSelected);
    });
  }

  // Muestra el botón en estado de carga
  function setSubmitLoading(loading) {
    if (!submitBtn) return;
    if (loading) {
      submitBtn.dataset.originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = 'Adding to cart…';
      submitBtn.disabled = true;
    } else {
      if (submitBtn.dataset.originalText) {
        submitBtn.innerHTML = submitBtn.dataset.originalText;
      }
      submitBtn.disabled = false;
    }
  }

  // ─── Lógica de estado ──────────────────────────────────────────────────────

  // Busca la variante correcta en GIFT_PLANS_DATA
  function findVariant(boxSize, duration) {
    if (!window.GIFT_PLANS_DATA) return null;
    var product = window.GIFT_PLANS_DATA[boxSize];
    if (!product) return null;
    for (var i = 0; i < product.variants.length; i++) {
      if (product.variants[i].duration === duration) {
        return product.variants[i];
      }
    }
    return null;
  }

  // Busca el selling plan correcto según la duración (ej. "3 month subscription...")
  function findSellingPlan(boxSize, duration) {
    if (!window.GIFT_PLANS_DATA) return null;
    var product = window.GIFT_PLANS_DATA[boxSize];
    if (!product || !product.selling_plans) return null;
    for (var i = 0; i < product.selling_plans.length; i++) {
      var plan = product.selling_plans[i];
      if (plan.name && plan.name.toLowerCase().indexOf(duration + ' month') === 0) {
        return plan.id;
      }
    }
    return null;
  }

  // Comprueba si el formulario está listo para hacer submit
  function isFormReady() {
    if (!state.boxSize || !state.duration) return false;
    var allFilled = REQUIRED_FIELDS.every(function (f) {
      return state.fields[f.key] && state.fields[f.key].trim() !== '';
    });
    return allFilled;
  }

  // ─── Validaciones ──────────────────────────────────────────────────────────

  // Valida todos los campos requeridos y muestra errores inline
  function validateForm() {
    clearAllFieldErrors();
    var valid = true;

    REQUIRED_FIELDS.forEach(function (f) {
      var value = (state.fields[f.key] || '').trim();

      // Validación de email
      if (f.key === 'recipient_email') {
        if (!value || !EMAIL_REGEX.test(value)) {
          showFieldError(f.domId, f.message);
          valid = false;
        }
        return;
      }

      // Validación de zip (5 dígitos)
      if (f.key === 'recipient_zip') {
        if (!ZIP_REGEX.test(value)) {
          showFieldError(f.domId, f.message);
          valid = false;
        }
        return;
      }

      // Validación de fecha (no puede ser pasada)
      if (f.key === 'start_date') {
        var today = new Date();
        today.setHours(0, 0, 0, 0);
        var selected = new Date(value + 'T00:00:00');
        if (!value || selected < today) {
          showFieldError(f.domId, f.message);
          valid = false;
        }
        return;
      }

      // Validación genérica: campo vacío
      if (!value) {
        showFieldError(f.domId, f.message);
        valid = false;
      }
    });

    return valid;
  }

  // ─── sessionStorage ────────────────────────────────────────────────────────

  // Guarda el estado actual en sessionStorage
  function saveState() {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({
        boxSize:  state.boxSize,
        duration: state.duration,
        fields:   state.fields
      }));
    } catch (e) {
      // sessionStorage puede no estar disponible en algunos contextos
    }
  }

  // Restaura el estado desde sessionStorage y actualiza el DOM
  function restoreState() {
    try {
      var raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return;
      var saved = JSON.parse(raw);

      // Restaurar box size
      if (saved.boxSize) {
        state.boxSize = saved.boxSize;
        var radio = document.querySelector(
          'input[name="gift_box_size"][value="' + saved.boxSize + '"]'
        );
        if (radio) radio.checked = true;
        setBoxCardSelected(saved.boxSize);

        // Renderizar las opciones de duración antes de restaurar la selección
        renderDurationOptions(saved.boxSize);
        updatePriceDisplay();
      }

      // Restaurar duración
      if (saved.duration) {
        state.duration = saved.duration;
        var durationRadio = document.querySelector(
          'input[name="gift_duration"][value="' + saved.duration + '"]'
        );
        if (durationRadio) durationRadio.checked = true;
        setDurationSelected(saved.duration);
      }

      // Restaurar campos del formulario
      if (saved.fields) {
        Object.keys(saved.fields).forEach(function (key) {
          state.fields[key] = saved.fields[key] || '';
          var fieldDef = ALL_FIELDS.find(function (f) { return f.key === key; });
          if (!fieldDef) return;
          var el = document.getElementById(fieldDef.domId);
          if (el && saved.fields[key]) el.value = saved.fields[key];
        });
      }

      updateStepStates();
      updateSubmitButton();
    } catch (e) {
      // Datos corruptos: limpiar para no bloquear futuros usos
      sessionStorage.removeItem(SESSION_KEY);
    }
  }

  // Limpia el estado del sessionStorage tras un add-to-cart exitoso
  function clearState() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  // ─── Listeners ─────────────────────────────────────────────────────────────

  // Listener: selección de box card
  function attachBoxCardListeners() {
    document.querySelectorAll('.gift-plans__box-card').forEach(function (card) {
      card.addEventListener('click', function () {
        var boxSize = card.dataset.boxSize;
        if (!boxSize) return;

        state.boxSize = boxSize;
        state.duration = null;

        // Regenerar opciones de duración para el box seleccionado
        renderDurationOptions(boxSize);
        resetPriceDisplay();

        setBoxCardSelected(boxSize);
        updatePriceDisplay();


        updateStepStates();
        updateSubmitButton();
        saveState();
      });
    });
  }

  // Listener: selección de duración (event delegation — el contenedor es estático, las opciones son dinámicas)
  function attachDurationListeners() {
    var container = document.getElementById('gp-duration-list');
    if (!container) return;

    container.addEventListener('click', function (e) {
      var opt = e.target.closest('.gift-plans__duration-option');
      if (!opt) return;

      var duration = parseInt(opt.dataset.duration, 10);
      if (!duration) return;

      state.duration = duration;
      setDurationSelected(duration);

      // Actualizar precio en el botón submit
      if (state.boxSize) {
        var variant = findVariant(state.boxSize, duration);
        if (variant && submitPrice) {
          submitPrice.textContent = variant.price_formatted;
        }
      }

      updateStepStates();
      updateSubmitButton();

      // Scroll suave al Step 3 al seleccionar duración
      var step3 = document.querySelector('[data-step="3"]');
      if (step3) step3.scrollIntoView({ behavior: 'smooth', block: 'start' });

      saveState();
    });
  }

  // Listener: cambios en campos del formulario
  function attachFormListeners() {
    ALL_FIELDS.forEach(function (f) {
      var el = document.getElementById(f.domId);
      if (!el) return;

      var eventType = (el.tagName === 'SELECT' || el.type === 'date') ? 'change' : 'input';

      el.addEventListener(eventType, function () {
        state.fields[f.key] = el.value;
        clearFieldError(f.domId);
        updateStepStates();
        updateSubmitButton();
        saveState();
      });
    });

    // Contador de caracteres del mensaje opcional
    var messageEl = document.getElementById('gp-gift-message');
    if (messageEl && charCount) {
      messageEl.addEventListener('input', function () {
        charCount.textContent = messageEl.value.length + ' / 500';
      });
    }
  }

  // Listener: submit button
  function attachSubmitListener() {
    if (!submitBtn) return;

    submitBtn.addEventListener('click', function () {
      setSubmitError(null);

      if (!validateForm()) {
        // Scroll al primer campo con error
        var firstError = document.querySelector('.gift-plans__form-input--error');
        if (firstError) {
          firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
          firstError.focus();
        }
        return;
      }

      var variant = findVariant(state.boxSize, state.duration);
      if (!variant) {
        setSubmitError('Could not find the selected product. Please try again.');
        return;
      }

      var sellingPlanId = findSellingPlan(state.boxSize, state.duration);
      addToCart(variant.id, sellingPlanId);
    });
  }

  // ─── AJAX: Add to Cart ─────────────────────────────────────────────────────

  function addToCart(variantId, sellingPlanId) {
    setSubmitLoading(true);

    var payload = {
      id: variantId,
      quantity: 1,
      properties: {
        gift_subscription:  'true',
        box_size:           state.boxSize,
        duration:           String(state.duration),
        recipient_name:     state.fields.recipient_name,
        recipient_email:    state.fields.recipient_email,
        recipient_address:  state.fields.recipient_address,
        recipient_city:     state.fields.recipient_city,
        recipient_state:    state.fields.recipient_state,
        recipient_zip:      state.fields.recipient_zip,
        recipient_country:  'US',
        start_date:         state.fields.start_date,
        gift_message:       state.fields.gift_message
      }
    };

    // Incluir selling_plan si el producto lo requiere
    if (sellingPlanId) {
      payload.selling_plan = sellingPlanId;
    }

    fetch('/cart/add.js', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload)
    })
      .then(function (response) {
        if (!response.ok) {
          return response.json().then(function (data) {
            throw new Error(data.description || 'Could not add to cart.');
          });
        }
        return response.json();
      })
      .then(function () {
        // Éxito: limpiar estado y redirigir al checkout
        clearState();
        window.location.href = '/checkout';
      })
      .catch(function (err) {
        setSubmitLoading(false);
        setSubmitError(err.message || 'Something went wrong. Please try again.');
      });
  }

  // ─── Inicialización ────────────────────────────────────────────────────────

  function init() {
    // Verificar que GIFT_PLANS_DATA esté disponible
    if (!window.GIFT_PLANS_DATA) {
      console.error('[Gift Plans] window.GIFT_PLANS_DATA no está definido.');
      return;
    }

    // Establecer fecha mínima en el date picker (hoy)
    var dateInput = document.getElementById('gp-start-date');
    if (dateInput) {
      dateInput.setAttribute('min', new Date().toISOString().split('T')[0]);
    }

    // Estado inicial de steps (antes de restaurar)
    updateStepStates();

    // Restaurar estado guardado antes de adjuntar listeners
    restoreState();

    // Adjuntar listeners
    attachBoxCardListeners();
    attachDurationListeners();
    attachFormListeners();
    attachSubmitListener();
  }

  // Esperar a que el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
