/**
 * Shahrokh Calculator — Frontend Logic
 * Vanilla JS — بدون هیچ dependency خارجی
 */
(function () {
  'use strict';

  // ─── State ────────────────────────────────────────────────────
  const state = {
    currentStep: 0,
    selections: {},   // { stepId: [ optionId, ... ] }
    totalPrice: 0,
  };

  // ─── Elements ─────────────────────────────────────────────────
  let steps, priceBar, priceAmount, contactForm, successEl, submitBtn;

  // ─── Init ─────────────────────────────────────────────────────
  function init() {
    const wrap = document.getElementById('sc-calculator');
    if (!wrap) return;

    steps       = Array.from(wrap.querySelectorAll('.sc-step:not(.sc-form-step)'));
    priceBar    = document.getElementById('sc-price-bar');
    priceAmount = document.getElementById('sc-price-amount');
    contactForm = document.getElementById('sc-contact-form');
    successEl   = document.getElementById('sc-success');
    submitBtn   = document.getElementById('sc-submit-btn');

    bindOptions();
    bindNextButtons();
    bindEditButtons();
    bindSubmit();
    bindContactInputs();
  }

  // ─── گزینه‌ها: انتخاب ─────────────────────────────────────────
  function bindOptions() {
    steps.forEach(function (stepEl) {
      const type    = stepEl.dataset.stepType;
      const options = stepEl.querySelectorAll('.sc-option');

      options.forEach(function (opt) {
        opt.addEventListener('click', function () {
          const stepId   = stepEl.dataset.stepId;
          const optionId = parseInt(opt.dataset.optionId);

          if (type === 'radio') {
            // رادیو: یکی
            options.forEach(function (o) { o.classList.remove('sc-option--selected'); });
            opt.classList.add('sc-option--selected');
            state.selections[stepId] = [optionId];
          } else {
            // چک‌باکس: چندتایی
            if (!state.selections[stepId]) state.selections[stepId] = [];
            if (opt.classList.contains('sc-option--selected')) {
              opt.classList.remove('sc-option--selected');
              state.selections[stepId] = state.selections[stepId].filter(function (id) { return id !== optionId; });
            } else {
              opt.classList.add('sc-option--selected');
              state.selections[stepId].push(optionId);
            }
          }

          recalcPrice();
          updatePriceBar();
        });
      });
    });
  }

  // ─── دکمه بعدی ────────────────────────────────────────────────
  function bindNextButtons() {
    steps.forEach(function (stepEl, index) {
      const btn = stepEl.querySelector('.sc-btn--next');
      if (!btn) return;

      btn.addEventListener('click', function () {
        const stepId    = stepEl.dataset.stepId;
        const type      = stepEl.dataset.stepType;
        const selected  = state.selections[stepId] || [];

        // اعتبارسنجی
        if (selected.length === 0) {
          shakeStep(stepEl);
          return;
        }

        // این مرحله رو done کن
        markDone(stepEl, index);

        // مرحله بعد یا فرم
        const next = steps[index + 1];
        if (next) {
          openStep(next);
          scrollToEl(next);
        } else {
          openContactForm();
        }
      });
    });
  }

  // ─── دکمه ویرایش ──────────────────────────────────────────────
  function bindEditButtons() {
    steps.forEach(function (stepEl, index) {
      const btn = stepEl.querySelector('.sc-step__edit');
      if (!btn) return;

      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        reopenStep(stepEl, index);
      });

      // کلیک روی هدر وقتی done هست
      stepEl.querySelector('.sc-step__header').addEventListener('click', function () {
        if (stepEl.classList.contains('sc-step--done')) {
          reopenStep(stepEl, index);
        }
      });
    });
  }

  // ─── باز کردن مجدد مرحله ─────────────────────────────────────
  function reopenStep(stepEl, index) {
    // مراحل بعد رو reset کن
    for (let i = index + 1; i < steps.length; i++) {
      resetStep(steps[i]);
    }

    // فرم تماس رو مخفی کن
    contactForm.style.display = 'none';
    successEl.style.display   = 'none';

    // این مرحله رو active کن
    stepEl.classList.remove('sc-step--done');
    stepEl.classList.add('sc-step--active');
    stepEl.querySelector('.sc-step__edit').style.display    = 'none';
    stepEl.querySelector('.sc-step__summary').style.display = 'none';

    scrollToEl(stepEl);
  }

  // ─── reset مرحله ─────────────────────────────────────────────
  function resetStep(stepEl) {
    const stepId = stepEl.dataset.stepId;
    stepEl.classList.remove('sc-step--done', 'sc-step--active');
    stepEl.querySelector('.sc-step__edit').style.display    = 'none';
    stepEl.querySelector('.sc-step__summary').style.display = 'none';
    stepEl.querySelectorAll('.sc-option').forEach(function (o) {
      o.classList.remove('sc-option--selected');
    });
    delete state.selections[stepId];
    recalcPrice();
    updatePriceBar();
  }

  // ─── mark done ────────────────────────────────────────────────
  function markDone(stepEl, index) {
    stepEl.classList.remove('sc-step--active');
    stepEl.classList.add('sc-step--done');

    const stepId   = stepEl.dataset.stepId;
    const selected = state.selections[stepId] || [];

    // خلاصه انتخاب‌ها
    const labels = [];
    selected.forEach(function (id) {
      const opt = stepEl.querySelector('[data-option-id="' + id + '"]');
      if (opt) labels.push(opt.querySelector('.sc-option__label').textContent.trim());
    });

    const summary = stepEl.querySelector('.sc-step__summary');
    const editBtn = stepEl.querySelector('.sc-step__edit');
    summary.textContent    = labels.join('، ');
    summary.style.display  = 'block';
    editBtn.style.display  = 'flex';
  }

  // ─── open step ────────────────────────────────────────────────
  function openStep(stepEl) {
    stepEl.classList.remove('sc-step--done');
    stepEl.classList.add('sc-step--active');
    state.currentStep = steps.indexOf(stepEl);
  }

  // ─── فرم تماس ────────────────────────────────────────────────
  function openContactForm() {
    contactForm.style.display = 'block';
    contactForm.classList.add('sc-step--active');
    scrollToEl(contactForm);
  }

  // ─── اعتبارسنجی input‌ها ──────────────────────────────────────
  function bindContactInputs() {
    const nameInput  = document.getElementById('sc-name');
    const phoneInput = document.getElementById('sc-phone');
    if (!nameInput || !phoneInput) return;

    nameInput.addEventListener('input',  function () { clearError(nameInput); });
    phoneInput.addEventListener('input', function () { clearError(phoneInput); });
  }

  function clearError(input) {
    input.classList.remove('sc-field--error');
    const err = input.closest('.sc-field').querySelector('.sc-field__error');
    if (err) err.textContent = '';
  }

  function showError(input, msg) {
    input.classList.add('sc-field--error');
    const err = input.closest('.sc-field').querySelector('.sc-field__error');
    if (err) err.textContent = msg;
    input.focus();
  }

  // ─── ارسال فرم ────────────────────────────────────────────────
  function bindSubmit() {
    if (!submitBtn) return;

    submitBtn.addEventListener('click', function () {
      const nameInput  = document.getElementById('sc-name');
      const phoneInput = document.getElementById('sc-phone');
      const strings    = SC_Data.strings;

      // اعتبارسنجی
      if (!nameInput.value.trim()) {
        showError(nameInput, strings.required_name);
        return;
      }
      if (!phoneInput.value.trim()) {
        showError(phoneInput, strings.required_phone);
        return;
      }
      if (!/^(09)[0-9]{9}$/.test(phoneInput.value.trim())) {
        showError(phoneInput, strings.invalid_phone);
        return;
      }

      // جمع‌آوری آیدی‌های انتخاب‌شده
      const optionIds = [];
      Object.values(state.selections).forEach(function (ids) {
        ids.forEach(function (id) { optionIds.push(id); });
      });

      if (optionIds.length === 0) return;

      // ارسال
      submitBtn.disabled    = true;
      submitBtn.textContent = strings.submitting;

      const body = new FormData();
      body.append('action', 'sc_submit_lead');
      body.append('nonce',  SC_Data.nonce);
      body.append('name',   nameInput.value.trim());
      body.append('phone',  phoneInput.value.trim());
      optionIds.forEach(function (id) { body.append('option_ids[]', id); });

      fetch(SC_Data.ajax_url, { method: 'POST', body: body })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (res.success) {
            showSuccess(res.data.total_price, res.data.message);
          } else {
            submitBtn.disabled    = false;
            submitBtn.textContent = strings.submit;
            alert(res.data.message || strings.error);
          }
        })
        .catch(function () {
          submitBtn.disabled    = false;
          submitBtn.textContent = strings.submit;
        });
    });
  }

  // ─── نمایش موفق ───────────────────────────────────────────────
  function showSuccess(price, message) {
    contactForm.style.display = 'none';
    priceBar.classList.remove('sc-price-bar--visible');

    successEl.style.display = 'block';
    successEl.querySelector('h3').textContent = message;

    const priceEl = document.getElementById('sc-success-price');
    if (priceEl && price > 0) {
      priceEl.textContent = 'هزینه تقریبی پروژه شما: ' + formatPrice(price) + ' تومان';
    }

    scrollToEl(successEl);
  }

  // ─── محاسبه قیمت ─────────────────────────────────────────────
  function recalcPrice() {
    let total = 0;
    Object.values(state.selections).forEach(function (ids) {
      ids.forEach(function (id) {
        const opt = document.querySelector('[data-option-id="' + id + '"]');
        if (opt) total += parseInt(opt.dataset.price || 0, 10);
      });
    });
    state.totalPrice = total;
  }

  function updatePriceBar() {
    if (state.totalPrice > 0) {
      priceBar.classList.add('sc-price-bar--visible');
      const newText = formatPrice(state.totalPrice) + ' تومان';
      if (priceAmount.textContent !== newText) {
        priceAmount.textContent = newText;
        priceAmount.classList.add('sc-price-bar__amount--bump');
        setTimeout(function () { priceAmount.classList.remove('sc-price-bar__amount--bump'); }, 220);
      }
    } else {
      priceBar.classList.remove('sc-price-bar--visible');
    }
  }

  // ─── Helper: فرمت عدد فارسی ───────────────────────────────────
  function formatPrice(num) {
    return num.toLocaleString('fa-IR');
  }

  // ─── Helper: scroll smooth ────────────────────────────────────
  function scrollToEl(el) {
    setTimeout(function () {
      const top = el.getBoundingClientRect().top + window.scrollY - 20;
      window.scrollTo({ top: top, behavior: 'smooth' });
    }, 80);
  }

  // ─── Helper: تکان دادن مرحله برای خطا ────────────────────────
  function shakeStep(stepEl) {
    stepEl.style.animation = 'none';
    stepEl.offsetHeight; // reflow
    stepEl.style.animation = 'sc-shake .35s ease';
    setTimeout(function () { stepEl.style.animation = ''; }, 400);

    // اضافه کردن keyframe اگر وجود نداشته باشد
    if (!document.getElementById('sc-shake-kf')) {
      const style = document.createElement('style');
      style.id    = 'sc-shake-kf';
      style.textContent = '@keyframes sc-shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}';
      document.head.appendChild(style);
    }
  }

  // ─── Start ────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
