/**
 * Shahrokh Calculator — Frontend Logic
 * Vanilla JS — بدون هیچ dependency خارجی
 * @version 2.0.0
 */
(function () {
  'use strict';

  /* ─────────────────────────────────────────────────────────────
     State
  ───────────────────────────────────────────────────────────── */
  const state = {
    currentStep : 0,
    selections  : {},   // { stepId: [ optionId, ... ] }
    totalPrice  : 0,
  };

  /* ─────────────────────────────────────────────────────────────
     DOM Refs
  ───────────────────────────────────────────────────────────── */
  let wrap, steps, priceBar, priceAmount, formStep, contactForm,
      successEl, submitBtn;

  /* ─────────────────────────────────────────────────────────────
     Init
  ───────────────────────────────────────────────────────────── */
  function init() {
    wrap = document.getElementById('sc-calculator');
    if (!wrap) return;

    steps       = Array.from(wrap.querySelectorAll('.sc-step:not(.sc-form-step)'));
    priceBar    = document.getElementById('sc-price-bar');
    priceAmount = document.getElementById('sc-price-amount');
    formStep    = wrap.querySelector('.sc-form-step');
    contactForm = document.getElementById('sc-contact-form');
    successEl   = document.getElementById('sc-success');
    submitBtn   = document.getElementById('sc-submit-btn');

    if (!steps.length) return; // no steps configured

    bindOptions();
    bindNextButtons();
    bindEditButtons();
    bindSubmit();
    bindContactInputs();

    // اولین مرحله را باز کن
    openStep(steps[0]);
  }

  /* ─────────────────────────────────────────────────────────────
     گزینه‌ها: کلیک
  ───────────────────────────────────────────────────────────── */
  function bindOptions() {
    steps.forEach(function (stepEl) {
      const type    = stepEl.dataset.stepType;
      const options = stepEl.querySelectorAll('.sc-option');

      options.forEach(function (opt) {
        opt.addEventListener('click', function () {
          const stepId   = stepEl.dataset.stepId;
          const optionId = parseInt(opt.dataset.optionId, 10);

          if (type === 'radio') {
            options.forEach(function (o) { o.classList.remove('sc-option--selected'); });
            opt.classList.add('sc-option--selected');
            state.selections[stepId] = [optionId];
          } else {
            if (!state.selections[stepId]) state.selections[stepId] = [];
            if (opt.classList.contains('sc-option--selected')) {
              opt.classList.remove('sc-option--selected');
              state.selections[stepId] = state.selections[stepId].filter(
                function (id) { return id !== optionId; }
              );
            } else {
              opt.classList.add('sc-option--selected');
              state.selections[stepId].push(optionId);
            }
          }

          recalcPrice();
          updatePriceBar();
        });

        // کیبورد: Enter / Space
        opt.setAttribute('role', 'button');
        opt.setAttribute('tabindex', '0');
        opt.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            opt.click();
          }
        });
      });
    });
  }

  /* ─────────────────────────────────────────────────────────────
     دکمه‌های «بعدی»
  ───────────────────────────────────────────────────────────── */
  function bindNextButtons() {
    steps.forEach(function (stepEl, index) {
      const btn = stepEl.querySelector('.sc-btn--next');
      if (!btn) return;

      btn.addEventListener('click', function () {
        const stepId   = stepEl.dataset.stepId;
        const selected = state.selections[stepId] || [];

        if (selected.length === 0) {
          shakeStep(stepEl);
          return;
        }

        markDone(stepEl);

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

  /* ─────────────────────────────────────────────────────────────
     دکمه‌های «ویرایش» + کلیک روی هدر
  ───────────────────────────────────────────────────────────── */
  function bindEditButtons() {
    steps.forEach(function (stepEl, index) {
      const editBtn = stepEl.querySelector('.sc-step__edit');
      const header  = stepEl.querySelector('.sc-step__header');

      if (editBtn) {
        editBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          reopenStep(stepEl, index);
        });
      }

      if (header) {
        header.addEventListener('click', function () {
          if (stepEl.classList.contains('sc-step--done')) {
            reopenStep(stepEl, index);
          }
        });
      }
    });
  }

  /* ─────────────────────────────────────────────────────────────
     reopenStep — بازگشت به مرحله قبلی
  ───────────────────────────────────────────────────────────── */
  function reopenStep(stepEl, index) {
    // مراحل بعدی را ریست کن
    for (var i = index + 1; i < steps.length; i++) {
      resetStep(steps[i]);
    }

    // فرم و موفقیت را مخفی کن
    hideContactForm();
    hideSuccess();

    // این مرحله را دوباره باز کن
    stepEl.classList.remove('sc-step--done');
    stepEl.classList.add('sc-step--active');
    state.currentStep = index;

    scrollToEl(stepEl);
  }

  /* ─────────────────────────────────────────────────────────────
     resetStep — پاک کردن انتخاب‌ها و state
  ───────────────────────────────────────────────────────────── */
  function resetStep(stepEl) {
    const stepId = stepEl.dataset.stepId;
    stepEl.classList.remove('sc-step--done', 'sc-step--active');

    stepEl.querySelectorAll('.sc-option').forEach(function (o) {
      o.classList.remove('sc-option--selected');
    });

    const summary = stepEl.querySelector('.sc-step__summary');
    if (summary) summary.textContent = '';

    delete state.selections[stepId];
    recalcPrice();
    updatePriceBar();
  }

  /* ─────────────────────────────────────────────────────────────
     markDone — علامت‌گذاری مرحله به عنوان تکمیل‌شده
  ───────────────────────────────────────────────────────────── */
  function markDone(stepEl) {
    stepEl.classList.remove('sc-step--active');
    stepEl.classList.add('sc-step--done');

    const stepId   = stepEl.dataset.stepId;
    const selected = state.selections[stepId] || [];

    // خلاصه انتخاب‌شده‌ها
    var labels = [];
    selected.forEach(function (id) {
      var opt = stepEl.querySelector('[data-option-id="' + id + '"]');
      if (opt) {
        var label = opt.querySelector('.sc-option__label');
        if (label) labels.push(label.textContent.trim());
      }
    });

    var summary = stepEl.querySelector('.sc-step__summary');
    if (summary) summary.textContent = labels.join('، ');
  }

  /* ─────────────────────────────────────────────────────────────
     openStep — باز کردن مرحله
  ───────────────────────────────────────────────────────────── */
  function openStep(stepEl) {
    stepEl.classList.remove('sc-step--done');
    stepEl.classList.add('sc-step--active');
    state.currentStep = steps.indexOf(stepEl);
  }

  /* ─────────────────────────────────────────────────────────────
     فرم تماس
  ───────────────────────────────────────────────────────────── */
  function openContactForm() {
    if (formStep) {
      formStep.classList.add('sc-form-step--visible');
      formStep.classList.add('sc-step--active');
    }
    scrollToEl(formStep || contactForm);
    updatePriceSummary();
  }

  function hideContactForm() {
    if (formStep) {
      formStep.classList.remove('sc-form-step--visible', 'sc-step--active');
    }
    // پاک کردن فرم
    if (contactForm) {
      contactForm.reset ? contactForm.reset() : null;
      contactForm.querySelectorAll('.sc-field__error').forEach(function (el) {
        el.textContent = '';
      });
      contactForm.querySelectorAll('.sc-input--error').forEach(function (el) {
        el.classList.remove('sc-input--error');
      });
    }
  }

  /* ─────────────────────────────────────────────────────────────
     خلاصه قیمت بالای فرم
  ───────────────────────────────────────────────────────────── */
  function updatePriceSummary() {
    var summaryEl = document.getElementById('sc-price-summary-value');
    if (summaryEl && state.totalPrice > 0) {
      summaryEl.textContent = formatPrice(state.totalPrice) + ' تومان';
    }
    var summaryWrap = document.getElementById('sc-price-summary');
    if (summaryWrap) {
      summaryWrap.style.display = state.totalPrice > 0 ? 'flex' : 'none';
    }
  }

  /* ─────────────────────────────────────────────────────────────
     اعتبارسنجی input‌ها — پاک شدن خطا هنگام تایپ
  ───────────────────────────────────────────────────────────── */
  function bindContactInputs() {
    var inputs = ['sc-name', 'sc-phone'];
    inputs.forEach(function (id) {
      var input = document.getElementById(id);
      if (input) {
        input.addEventListener('input', function () { clearFieldError(input); });
      }
    });
  }

  function clearFieldError(input) {
    input.classList.remove('sc-input--error');
    var field = input.closest('.sc-field');
    if (field) {
      var err = field.querySelector('.sc-field__error');
      if (err) err.textContent = '';
    }
  }

  function showFieldError(input, msg) {
    input.classList.add('sc-input--error');
    var field = input.closest('.sc-field');
    if (field) {
      var err = field.querySelector('.sc-field__error');
      if (err) err.textContent = msg;
    }
    input.focus();
  }

  /* ─────────────────────────────────────────────────────────────
     ارسال فرم
  ───────────────────────────────────────────────────────────── */
  function bindSubmit() {
    if (!submitBtn) return;

    submitBtn.addEventListener('click', function () {
      var nameInput  = document.getElementById('sc-name');
      var phoneInput = document.getElementById('sc-phone');

      if (!nameInput || !phoneInput) return;

      var strings = (typeof SC_Data !== 'undefined' && SC_Data.strings) ? SC_Data.strings : {};

      // اعتبارسنجی نام
      if (!nameInput.value.trim()) {
        showFieldError(nameInput, strings.required_name || 'نام الزامی است');
        return;
      }

      // اعتبارسنجی شماره موبایل ایرانی
      var phone = phoneInput.value.trim().replace(/\s/g, '');
      if (!phone) {
        showFieldError(phoneInput, strings.required_phone || 'شماره تماس الزامی است');
        return;
      }
      if (!/^(09)[0-9]{9}$/.test(phone)) {
        showFieldError(phoneInput, strings.invalid_phone || 'شماره موبایل معتبر نیست (مثال: 09121234567)');
        return;
      }

      // جمع‌آوری option IDs
      var optionIds = [];
      Object.values(state.selections).forEach(function (ids) {
        ids.forEach(function (id) { optionIds.push(id); });
      });

      if (!optionIds.length) {
        alert(strings.no_selection || 'لطفاً حداقل یک گزینه انتخاب کنید.');
        return;
      }

      // حالت loading
      setSubmitLoading(true);

      var body = new FormData();
      body.append('action', 'sc_submit_lead');
      body.append('nonce',  SC_Data.nonce);
      body.append('name',   nameInput.value.trim());
      body.append('phone',  phone);
      optionIds.forEach(function (id) { body.append('option_ids[]', id); });

      fetch(SC_Data.ajax_url, { method: 'POST', body: body })
        .then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.json();
        })
        .then(function (res) {
          if (res.success) {
            showSuccess(res.data.total_price, res.data.message);
          } else {
            setSubmitLoading(false);
            var msg = (res.data && res.data.message) ? res.data.message : (strings.error || 'خطایی رخ داد.');
            alert(msg);
          }
        })
        .catch(function (err) {
          setSubmitLoading(false);
          console.error('SC submit error:', err);
          alert(strings.network_error || 'خطا در ارتباط با سرور. دوباره تلاش کنید.');
        });
    });
  }

  function setSubmitLoading(loading) {
    if (!submitBtn) return;
    submitBtn.disabled = loading;
    if (loading) {
      submitBtn.classList.add('sc-btn--loading');
    } else {
      submitBtn.classList.remove('sc-btn--loading');
    }
  }

  /* ─────────────────────────────────────────────────────────────
     نمایش پیام موفقیت
  ───────────────────────────────────────────────────────────── */
  function showSuccess(price, message) {
    // مخفی کردن فرم
    if (formStep) {
      formStep.classList.remove('sc-form-step--visible', 'sc-step--active');
    }

    // مخفی کردن نوار قیمت
    if (priceBar) priceBar.classList.remove('sc-price-bar--visible');

    // نمایش موفقیت
    if (successEl) {
      successEl.classList.add('sc-success--visible');

      var msgEl = successEl.querySelector('h3');
      if (msgEl) msgEl.textContent = message || 'درخواست شما با موفقیت ثبت شد!';

      var priceEl = document.getElementById('sc-success-price');
      if (priceEl) {
        if (price && price > 0) {
          priceEl.textContent = 'هزینه تقریبی پروژه شما: ' + formatPrice(price) + ' تومان';
          priceEl.style.display = 'inline-block';
        } else {
          priceEl.style.display = 'none';
        }
      }

      scrollToEl(successEl);
    }
  }

  function hideSuccess() {
    if (successEl) {
      successEl.classList.remove('sc-success--visible');
    }
  }

  /* ─────────────────────────────────────────────────────────────
     محاسبه قیمت
  ───────────────────────────────────────────────────────────── */
  function recalcPrice() {
    var total = 0;
    Object.keys(state.selections).forEach(function (stepId) {
      var ids = state.selections[stepId];
      ids.forEach(function (id) {
        var opt = document.querySelector(
          '.sc-step[data-step-id="' + stepId + '"] [data-option-id="' + id + '"]'
        );
        if (opt) total += parseInt(opt.dataset.price || '0', 10);
      });
    });
    state.totalPrice = total;
  }

  /* ─────────────────────────────────────────────────────────────
     به‌روزرسانی نوار قیمت
  ───────────────────────────────────────────────────────────── */
  function updatePriceBar() {
    if (!priceBar || !priceAmount) return;

    if (state.totalPrice > 0) {
      priceBar.classList.add('sc-price-bar--visible');
      var newText = formatPrice(state.totalPrice) + ' تومان';
      if (priceAmount.textContent !== newText) {
        priceAmount.textContent = newText;
        priceAmount.classList.add('sc-price-bar__amount--bump');
        setTimeout(function () {
          priceAmount.classList.remove('sc-price-bar__amount--bump');
        }, 250);
      }
    } else {
      priceBar.classList.remove('sc-price-bar--visible');
    }
  }

  /* ─────────────────────────────────────────────────────────────
     Helpers
  ───────────────────────────────────────────────────────────── */

  // فرمت اعداد به فارسی با جداکننده هزارگان
  function formatPrice(num) {
    if (typeof num !== 'number') num = parseInt(num, 10) || 0;
    try {
      return num.toLocaleString('fa-IR');
    } catch (e) {
      return num.toLocaleString();
    }
  }

  // اسکرول نرم به المان
  function scrollToEl(el) {
    if (!el) return;
    setTimeout(function () {
      var top = el.getBoundingClientRect().top + window.pageYOffset - 24;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    }, 80);
  }

  // لرزش مرحله برای اعتبارسنجی
  function shakeStep(stepEl) {
    stepEl.classList.remove('sc-step--shake');
    // reflow force
    void stepEl.offsetWidth;
    stepEl.classList.add('sc-step--shake');
    stepEl.addEventListener('animationend', function handler() {
      stepEl.classList.remove('sc-step--shake');
      stepEl.removeEventListener('animationend', handler);
    });
  }

  /* ─────────────────────────────────────────────────────────────
     Bootstrap
  ───────────────────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
