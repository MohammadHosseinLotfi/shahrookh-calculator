(function () {
  'use strict';

  if (typeof SC_Admin === 'undefined') return;

  const state = {
    steps: normalizeSteps(Array.isArray(SC_Admin.steps) ? SC_Admin.steps : []),
    settings: SC_Admin.settings || {},
    currentStepId: null,
    leads: [],
    leadStatus: '',
    currentPage: 1,
    perPage: 20,
    totalLeads: 0,
    editingOptionId: null,
    activeModal: null,
    isBusy: false,
  };

  const text = Object.assign({
    loading: 'در حال بارگذاری...',
    error: 'خطایی رخ داد.',
    confirm_delete_step: 'از حذف این مرحله مطمئن هستی؟',
    confirm_delete_option: 'از حذف این گزینه مطمئن هستی؟',
    confirm_delete_leads: 'همه درخواست‌ها حذف شوند؟',
    saving: 'در حال ذخیره...',
    deleting: 'در حال حذف...',
    sorting: 'در حال بروزرسانی ترتیب...',
  }, SC_Admin.strings || {});

  const icons = {
    drag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    empty: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 7h18"/><path d="M6 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2"/><path d="M8 11v6M12 11v6M16 11v6"/><path d="M5 7l1 13a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-13"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.78 19.78 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.78 19.78 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.89.34 1.76.65 2.6a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.48-1.22a2 2 0 0 1 2.11-.45c.84.31 1.71.53 2.6.65A2 2 0 0 1 22 16.92z"/></svg>',
    refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.13-3.36L23 10"/><path d="M20.49 15a9 9 0 0 1-14.13 3.36L1 14"/></svg>'
  };

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    if (!document.getElementById('sc-admin-wrap')) return;
    injectUtilityClasses();

    if (document.getElementById('sc-steps-app')) initStepsPage();
    if (document.getElementById('sc-leads-app')) initLeadsPage();
    if (document.getElementById('sc-settings-app')) initSettingsPage();
  }

  function initStepsPage() {
    bindStepsPageActions();
    renderStepsList();

    if (state.steps.length) {
      state.currentStepId = Number(state.steps[0].id);
      renderStepForm();
    } else {
      renderEmptyPanel();
    }
  }

  function bindStepsPageActions() {
    const addStepBtn = document.getElementById('sca-add-step');
    const panel = document.getElementById('sca-step-panel');

    if (addStepBtn) {
      addStepBtn.addEventListener('click', function () {
        state.currentStepId = null;
        state.editingOptionId = null;
        renderStepForm();
      });
    }

    if (!panel) return;

    panel.addEventListener('submit', function (e) {
      if (e.target.matches('#sca-step-form')) {
        e.preventDefault();
        saveStep(new FormData(e.target), e.target);
      }

      if (e.target.matches('#sca-option-form')) {
        e.preventDefault();
        saveOption(new FormData(e.target), e.target);
      }
    });

    panel.addEventListener('click', function (e) {
      const delOption = e.target.closest('[data-delete-option]');
      const editOption = e.target.closest('[data-edit-option]');
      const delStep = e.target.closest('#sca-delete-step');
      const cancelOption = e.target.closest('#sca-cancel-option-edit');

      if (delOption) deleteOption(Number(delOption.dataset.deleteOption), delOption);
      if (editOption) fillOptionForm(Number(editOption.dataset.editOption));
      if (delStep) deleteStep(Number(delStep.dataset.stepId), delStep);
      if (cancelOption) {
        state.editingOptionId = null;
        resetOptionForm();
      }
    });
  }

  function renderStepsList() {
    const list = document.getElementById('sca-steps-list');
    if (!list) return;

    if (!state.steps.length) {
      list.innerHTML = '<div class="sca-empty">' + icons.empty + '<div>هنوز مرحله‌ای ایجاد نشده است.</div></div>';
      return;
    }

    list.innerHTML = state.steps.map(function (step, index) {
      const active = Number(step.id) === Number(state.currentStepId);
      const inactive = Number(step.is_active) !== 1;
      const optionsCount = Array.isArray(step.options) ? step.options.length : 0;
      return '<div class="sca-step-item' + (active ? ' sca-step-item--active' : '') + (inactive ? ' sca-step-item--inactive' : '') + '" data-step-item="' + step.id + '" draggable="true">' +
        '<span class="sca-step-item__drag" title="جابجایی">' + icons.drag + '</span>' +
        '<span class="sca-step-item__num">' + (index + 1) + '</span>' +
        '<span class="sca-step-item__title">' + escapeHtml(step.title || 'بدون عنوان') + '<small class="sca-muted" style="display:block;margin-top:.2rem">' + optionsCount + ' گزینه</small></span>' +
        '<span class="sca-step-item__type">' + (step.type === 'checkbox' ? 'چندتایی' : 'تکی') + '</span>' +
        '<button class="sca-step-item__del" type="button" data-delete-step-short="' + step.id + '" aria-label="حذف مرحله">' + icons.trash + '</button>' +
      '</div>';
    }).join('');

    bindStepListInteractions();
    bindStepSorting();
  }

  function bindStepListInteractions() {
    const list = document.getElementById('sca-steps-list');
    if (!list) return;

    list.querySelectorAll('[data-step-item]').forEach(function (item) {
      item.addEventListener('click', function (e) {
        if (e.target.closest('[data-delete-step-short]')) return;
        openStepPanel(Number(item.dataset.stepItem));
      });
    });

    list.querySelectorAll('[data-delete-step-short]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        deleteStep(Number(btn.dataset.deleteStepShort), btn);
      });
    });
  }

  function bindStepSorting() {
    const list = document.getElementById('sca-steps-list');
    if (!list || list.dataset.sortBound === '1') return;
    list.dataset.sortBound = '1';

    let dragged = null;

    list.addEventListener('dragstart', function (e) {
      const item = e.target.closest('[data-step-item]');
      if (!item) return;
      dragged = item;
      item.classList.add('sca-dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', item.dataset.stepItem);
    });

    list.addEventListener('dragend', function () {
      if (dragged) dragged.classList.remove('sca-dragging');
      list.querySelectorAll('.sca-drop-target').forEach(function (el) { el.classList.remove('sca-drop-target'); });
      dragged = null;
    });

    list.addEventListener('dragover', function (e) {
      e.preventDefault();
      const target = e.target.closest('[data-step-item]');
      if (!dragged || !target || target === dragged) return;
      list.querySelectorAll('.sca-drop-target').forEach(function (el) { el.classList.remove('sca-drop-target'); });
      target.classList.add('sca-drop-target');

      const rect = target.getBoundingClientRect();
      const after = e.clientY > rect.top + rect.height / 2;
      if (after) {
        target.after(dragged);
      } else {
        target.before(dragged);
      }
    });

    list.addEventListener('drop', function (e) {
      e.preventDefault();
      const ids = Array.from(list.querySelectorAll('[data-step-item]')).map(function (el) {
        return Number(el.dataset.stepItem);
      });
      persistStepOrder(ids);
    });
  }

  function persistStepOrder(ids) {
    if (!Array.isArray(ids) || !ids.length) return;
    const previous = state.steps.slice();
    state.steps.sort(function (a, b) {
      return ids.indexOf(Number(a.id)) - ids.indexOf(Number(b.id));
    }).forEach(function (step, index) {
      step.sort_order = index + 1;
    });
    renderStepsList();

    ajax('sc_sort_steps', { ids: ids }, function () {
      toast('ترتیب مراحل ذخیره شد', 'success');
    }, function () {
      state.steps = previous;
      renderStepsList();
      toast('ذخیره ترتیب مراحل ناموفق بود', 'error');
    }, { silent: true });
  }

  function openStepPanel(stepId) {
    state.currentStepId = Number(stepId);
    state.editingOptionId = null;
    renderStepsList();
    renderStepForm();
  }

  function renderStepForm() {
    const panel = document.getElementById('sca-step-panel');
    if (!panel) return;

    const step = getCurrentStep();
    state.editingOptionId = null;

    panel.classList.add('sca-step-panel--visible');
    panel.innerHTML = '<div class="sca-card">' +
      '<div class="sca-card__head"><h3>' + (step ? 'ویرایش مرحله' : 'مرحله جدید') + '</h3>' +
      (step ? '<button class="sca-btn sca-btn--danger sca-btn--sm" id="sca-delete-step" data-step-id="' + step.id + '">حذف مرحله</button>' : '') + '</div>' +
      '<div class="sca-card__body">' +
        '<form id="sca-step-form" class="sca-form">' +
          '<input type="hidden" name="id" value="' + (step ? step.id : '') + '">' +
          '<div class="sca-field"><label>عنوان مرحله</label><input type="text" name="title" value="' + escapeAttr(step ? step.title : '') + '" required></div>' +
          '<div class="sca-field"><label>توضیح مرحله</label><textarea name="description" rows="3">' + escapeHtml(step ? step.description || '' : '') + '</textarea></div>' +
          '<div class="sca-form-row">' +
            '<div class="sca-field"><label>نوع انتخاب</label><select name="type"><option value="radio"' + (step && step.type === 'radio' ? ' selected' : '') + '>تکی</option><option value="checkbox"' + (step && step.type === 'checkbox' ? ' selected' : '') + '>چندتایی</option></select></div>' +
            '<div class="sca-field"><label>وضعیت</label><label class="sca-toggle"><input type="checkbox" name="is_active" ' + (!step || Number(step.is_active) === 1 ? 'checked' : '') + '><span class="sca-toggle__track"></span><span class="sca-toggle__label">فعال باشد</span></label></div>' +
          '</div>' +
          '<div><button class="sca-btn sca-btn--primary" type="submit" data-loading-text="' + text.saving + '">ذخیره مرحله</button></div>' +
        '</form>' +
      '</div>' +
    '</div>' +
    (step ? renderOptionsManager(step) : '');

    if (step) bindOptionSorting();
  }

  function renderOptionsManager(step) {
    const options = normalizeOptions(step.options || []);
    step.options = options;

    return '<div class="sca-card" style="margin-top:1rem">' +
      '<div class="sca-card__head"><h3>گزینه‌های این مرحله</h3><span class="sca-muted">با کشیدن و رها کردن مرتب کن</span></div>' +
      '<div class="sca-card__body">' +
        '<div class="sca-options-list" id="sca-options-list">' +
          (options.length ? options.map(function (opt, index) {
            return '<div class="sca-option-item' + (Number(opt.is_active) !== 1 ? ' sca-option-item--inactive' : '') + '" data-option-item="' + opt.id + '" draggable="true">' +
              '<span class="sca-step-item__drag" title="جابجایی">' + icons.drag + '</span>' +
              '<span class="sca-option-item__label"><strong style="font-weight:600">' + (index + 1) + '.</strong> ' + escapeHtml(opt.label || 'بدون عنوان') + (opt.icon_svg ? '<small class="sca-muted" style="display:block;margin-top:.2rem">دارای آیکون سفارشی</small>' : '') + '</span>' +
              '<span class="sca-option-item__price">' + formatPrice(opt.price) + ' تومان</span>' +
              '<div class="sca-option-item__actions">' +
                '<button type="button" class="sca-option-item__btn" data-edit-option="' + opt.id + '" aria-label="ویرایش گزینه">' + icons.edit + '</button>' +
                '<button type="button" class="sca-option-item__btn sca-option-item__btn--del" data-delete-option="' + opt.id + '" aria-label="حذف گزینه">' + icons.trash + '</button>' +
              '</div>' +
            '</div>';
          }).join('') : '<div class="sca-empty">' + icons.empty + '<div>هنوز گزینه‌ای ثبت نشده است.</div></div>') +
        '</div>' +
        '<form id="sca-option-form" class="sca-form" style="margin-top:1rem">' +
          '<input type="hidden" name="id" value="">' +
          '<input type="hidden" name="step_id" value="' + step.id + '">' +
          '<div class="sca-add-option-form">' +
            '<div class="sca-field"><label>عنوان گزینه</label><input type="text" name="label" required></div>' +
            '<div class="sca-field"><label>قیمت</label><input type="number" name="price" min="0" step="1" required></div>' +
            '<div class="sca-field"><label>فعال</label><label class="sca-toggle"><input type="checkbox" name="is_active" checked><span class="sca-toggle__track"></span></label></div>' +
            '<div class="sca-field"><label>&nbsp;</label><button class="sca-btn sca-btn--success" type="submit" id="sca-option-submit" data-loading-text="' + text.saving + '">افزودن</button></div>' +
          '</div>' +
          '<div class="sca-field" style="margin-top:.75rem"><label>SVG آیکون (اختیاری)</label><textarea name="icon_svg" rows="4" placeholder="<svg ...>...</svg>"></textarea></div>' +
          '<div id="sca-option-cancel-wrap" style="display:none;margin-top:.75rem"><button class="sca-btn sca-btn--ghost" type="button" id="sca-cancel-option-edit">انصراف از ویرایش</button></div>' +
        '</form>' +
      '</div>' +
    '</div>';
  }

  function bindOptionSorting() {
    const list = document.getElementById('sca-options-list');
    if (!list || list.dataset.sortBound === '1') return;
    list.dataset.sortBound = '1';

    let dragged = null;

    list.addEventListener('dragstart', function (e) {
      const item = e.target.closest('[data-option-item]');
      if (!item) return;
      dragged = item;
      item.classList.add('sca-dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', item.dataset.optionItem);
    });

    list.addEventListener('dragend', function () {
      if (dragged) dragged.classList.remove('sca-dragging');
      list.querySelectorAll('.sca-drop-target').forEach(function (el) { el.classList.remove('sca-drop-target'); });
      dragged = null;
    });

    list.addEventListener('dragover', function (e) {
      e.preventDefault();
      const target = e.target.closest('[data-option-item]');
      if (!dragged || !target || target === dragged) return;
      list.querySelectorAll('.sca-drop-target').forEach(function (el) { el.classList.remove('sca-drop-target'); });
      target.classList.add('sca-drop-target');
      const rect = target.getBoundingClientRect();
      if (e.clientY > rect.top + rect.height / 2) {
        target.after(dragged);
      } else {
        target.before(dragged);
      }
    });

    list.addEventListener('drop', function (e) {
      e.preventDefault();
      const ids = Array.from(list.querySelectorAll('[data-option-item]')).map(function (el) {
        return Number(el.dataset.optionItem);
      });
      persistOptionOrder(ids);
    });
  }

  function persistOptionOrder(ids) {
    const step = getCurrentStep();
    if (!step || !Array.isArray(ids) || !ids.length) return;

    const previous = normalizeOptions(step.options || []);
    step.options.sort(function (a, b) {
      return ids.indexOf(Number(a.id)) - ids.indexOf(Number(b.id));
    }).forEach(function (item, index) {
      item.sort_order = index + 1;
    });

    renderStepForm();

    ajax('sc_sort_options', { step_id: step.id, ids: ids }, function () {
      toast('ترتیب گزینه‌ها ذخیره شد', 'success');
    }, function () {
      step.options = previous;
      renderStepForm();
      toast('ذخیره ترتیب گزینه‌ها ناموفق بود', 'error');
    }, { silent: true });
  }

  function renderEmptyPanel() {
    const panel = document.getElementById('sca-step-panel');
    if (!panel) return;
    panel.classList.add('sca-step-panel--visible');
    panel.innerHTML = '<div class="sca-card"><div class="sca-card__body"><div class="sca-empty">' + icons.plus + '<div>برای شروع یک مرحله جدید بساز.</div></div></div></div>';
  }

  function fillOptionForm(optionId) {
    const step = getCurrentStep();
    if (!step || !Array.isArray(step.options)) return;
    const option = step.options.find(function (item) { return Number(item.id) === Number(optionId); });
    if (!option) return;

    state.editingOptionId = Number(option.id);
    const form = document.getElementById('sca-option-form');
    if (!form) return;

    form.querySelector('[name="id"]').value = option.id;
    form.querySelector('[name="label"]').value = option.label || '';
    form.querySelector('[name="price"]').value = option.price || 0;
    form.querySelector('[name="icon_svg"]').value = option.icon_svg || '';
    form.querySelector('[name="is_active"]').checked = Number(option.is_active) === 1;

    const submit = document.getElementById('sca-option-submit');
    const cancelWrap = document.getElementById('sca-option-cancel-wrap');
    if (submit) submit.textContent = 'ذخیره گزینه';
    if (cancelWrap) cancelWrap.style.display = 'block';
    const labelInput = form.querySelector('[name="label"]');
    if (labelInput) labelInput.focus();
  }

  function resetOptionForm() {
    const form = document.getElementById('sca-option-form');
    if (!form) return;
    form.reset();
    form.querySelector('[name="id"]').value = '';
    form.querySelector('[name="step_id"]').value = state.currentStepId || '';
    const submit = document.getElementById('sca-option-submit');
    const cancelWrap = document.getElementById('sca-option-cancel-wrap');
    const activeInput = form.querySelector('[name="is_active"]');
    if (submit) submit.textContent = 'افزودن';
    if (cancelWrap) cancelWrap.style.display = 'none';
    if (activeInput) activeInput.checked = true;
  }

  function saveStep(formData, form) {
    const submit = form ? form.querySelector('[type="submit"]') : null;
    setButtonLoading(submit, true);

    if (!formData.has('is_active')) formData.append('is_active', '0');
    else formData.set('is_active', '1');

    ajax('sc_save_step', formData, function (res) {
      const step = normalizeStep(res.step || {});
      const existingIndex = state.steps.findIndex(function (item) { return Number(item.id) === Number(step.id); });

      if (existingIndex > -1) {
        step.options = normalizeOptions(state.steps[existingIndex].options || []);
        state.steps[existingIndex] = step;
      } else {
        step.options = [];
        state.steps.push(step);
      }

      sortStepsInState();
      state.currentStepId = Number(step.id);
      renderStepsList();
      renderStepForm();
      toast('مرحله ذخیره شد', 'success');
    }, null, {
      onFinally: function () { setButtonLoading(submit, false); }
    });
  }

  function deleteStep(id, trigger) {
    if (!confirm(text.confirm_delete_step)) return;
    setButtonLoading(trigger, true, text.deleting);

    ajax('sc_delete_step', { id: id }, function () {
      state.steps = state.steps.filter(function (step) { return Number(step.id) !== Number(id); });
      if (Number(state.currentStepId) === Number(id)) {
        state.currentStepId = state.steps.length ? Number(state.steps[0].id) : null;
      }
      renderStepsList();
      state.currentStepId ? renderStepForm() : renderEmptyPanel();
      toast('مرحله حذف شد', 'success');
    }, null, {
      onFinally: function () { setButtonLoading(trigger, false); }
    });
  }

  function saveOption(formData, form) {
    const step = getCurrentStep();
    if (!step) return;

    if (!formData.has('is_active')) formData.append('is_active', '0');
    else formData.set('is_active', '1');

    const submit = form ? form.querySelector('[type="submit"]') : null;
    setButtonLoading(submit, true);

    ajax('sc_save_option', formData, function (res) {
      const current = getCurrentStep();
      if (!current) return;
      current.options = normalizeOptions(Array.isArray(res.options) ? res.options : current.options);
      renderStepForm();
      toast(state.editingOptionId ? 'گزینه بروزرسانی شد' : 'گزینه افزوده شد', 'success');
      state.editingOptionId = null;
    }, null, {
      onFinally: function () { setButtonLoading(submit, false); }
    });
  }

  function deleteOption(id, trigger) {
    if (!confirm(text.confirm_delete_option)) return;
    setButtonLoading(trigger, true, text.deleting);

    ajax('sc_delete_option', { id: id }, function () {
      const step = getCurrentStep();
      if (!step || !Array.isArray(step.options)) return;
      step.options = step.options.filter(function (opt) { return Number(opt.id) !== Number(id); });
      renderStepForm();
      toast('گزینه حذف شد', 'success');
    }, null, {
      onFinally: function () { setButtonLoading(trigger, false); }
    });
  }

  function getCurrentStep() {
    return state.steps.find(function (item) {
      return Number(item.id) === Number(state.currentStepId);
    }) || null;
  }

  function initLeadsPage() {
    bindLeadFilters();
    bindLeadActions();
    loadLeads();
  }

  function bindLeadFilters() {
    const wrap = document.getElementById('sca-lead-filters');
    if (!wrap) return;

    wrap.addEventListener('click', function (e) {
      const btn = e.target.closest('[data-status-filter]');
      if (!btn) return;
      state.leadStatus = btn.dataset.statusFilter;
      state.currentPage = 1;
      wrap.querySelectorAll('.sca-filter-btn').forEach(function (b) {
        b.classList.toggle('sca-filter-btn--active', b === btn);
      });
      loadLeads();
    });
  }

  function bindLeadActions() {
    const reloadBtn = document.getElementById('sca-reload-leads');
    const deleteAllBtn = document.getElementById('sca-delete-all-leads');

    if (reloadBtn) {
      reloadBtn.innerHTML = icons.refresh + '<span>بارگذاری مجدد</span>';
      reloadBtn.addEventListener('click', function () {
        loadLeads(reloadBtn);
      });
    }

    if (deleteAllBtn) {
      deleteAllBtn.addEventListener('click', function () {
        if (!confirm(text.confirm_delete_leads)) return;
        setButtonLoading(deleteAllBtn, true, text.deleting);
        ajax('sc_delete_all_leads', {}, function () {
          state.currentPage = 1;
          loadLeads();
          toast('همه درخواست‌ها حذف شدند', 'success');
        }, null, {
          onFinally: function () { setButtonLoading(deleteAllBtn, false); }
        });
      });
    }
  }

  function loadLeads(reloadBtn) {
    const body = document.getElementById('sca-leads-body');
    if (body) {
      body.innerHTML = '<tr><td colspan="6"><div class="sca-loader"><span class="sca-spinner"></span><span>' + escapeHtml(text.loading) + '</span></div></td></tr>';
    }
    if (reloadBtn) setButtonLoading(reloadBtn, true, text.loading);

    ajax('sc_get_leads', {
      status: state.leadStatus,
      limit: state.perPage,
      offset: (state.currentPage - 1) * state.perPage
    }, function (res) {
      state.leads = Array.isArray(res.items) ? res.items : [];
      state.totalLeads = Number(res.total || 0);
      renderLeadsTable();
      renderLeadPagination();
      renderLeadStats();
    }, null, {
      silent: true,
      onFinally: function () {
        if (reloadBtn) setButtonLoading(reloadBtn, false);
      }
    });
  }

  function renderLeadStats() {
    const totalEl = document.getElementById('sca-leads-total');
    const countEl = document.getElementById('sca-leads-count');

    if (totalEl) totalEl.textContent = formatPrice(sumLeadsTotal(state.leads));
    if (countEl) countEl.textContent = Number(state.totalLeads || 0).toLocaleString('fa-IR');
  }

  function renderLeadsTable() {
    const body = document.getElementById('sca-leads-body');
    if (!body) return;

    if (!state.leads.length) {
      body.innerHTML = '<tr><td colspan="6"><div class="sca-empty">' + icons.phone + '<div>درخواستی پیدا نشد.</div></div></td></tr>';
      return;
    }

    body.innerHTML = state.leads.map(function (lead) {
      return '<tr data-lead-row="' + lead.id + '" tabindex="0" role="button">' +
        '<td>#' + lead.id + '</td>' +
        '<td>' + escapeHtml(lead.name || '-') + '</td>' +
        '<td><span dir="ltr">' + escapeHtml(lead.phone || '-') + '</span></td>' +
        '<td>' + formatPrice(lead.total_price || 0) + ' تومان</td>' +
        '<td>' + renderLeadStatusBadge(lead.status) + '</td>' +
        '<td>' + escapeHtml(formatDate(lead.created_at)) + '</td>' +
      '</tr>';
    }).join('');

    body.querySelectorAll('[data-lead-row]').forEach(function (row) {
      row.addEventListener('click', function () {
        openLeadModal(Number(row.dataset.leadRow));
      });
      row.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openLeadModal(Number(row.dataset.leadRow));
        }
      });
    });
  }

  function renderLeadStatusBadge(status) {
    const labels = { new: 'جدید', contacted: 'تماس گرفته شد', closed: 'بسته شده' };
    return '<span class="sca-badge sca-badge--' + escapeAttr(status || 'new') + '">' + escapeHtml(labels[status] || labels.new) + '</span>';
  }

  function renderLeadPagination() {
    const wrap = document.getElementById('sca-lead-pagination');
    if (!wrap) return;
    const pages = Math.ceil(state.totalLeads / state.perPage);
    if (pages <= 1) {
      wrap.innerHTML = '';
      return;
    }

    let html = '';
    if (state.currentPage > 1) {
      html += '<button type="button" class="sca-page-btn" data-page="' + (state.currentPage - 1) + '">قبلی</button>';
    }
    for (let i = 1; i <= pages; i++) {
      html += '<button type="button" class="sca-page-btn' + (i === state.currentPage ? ' sca-page-btn--active' : '') + '" data-page="' + i + '">' + i + '</button>';
    }
    if (state.currentPage < pages) {
      html += '<button type="button" class="sca-page-btn" data-page="' + (state.currentPage + 1) + '">بعدی</button>';
    }

    wrap.innerHTML = html;
    wrap.querySelectorAll('[data-page]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.currentPage = Number(btn.dataset.page);
        loadLeads();
      });
    });
  }

  function openLeadModal(id) {
    ajax('sc_get_lead', { id: id }, function (res) {
      const lead = res.lead || {};
      closeModal();

      const overlay = document.createElement('div');
      overlay.className = 'sca-modal-overlay';
      overlay.innerHTML = '<div class="sca-modal" role="dialog" aria-modal="true" aria-labelledby="sca-modal-title">' +
        '<div class="sca-modal__head"><h3 id="sca-modal-title">جزئیات درخواست #' + escapeHtml(lead.id || id) + '</h3><button type="button" class="sca-modal__close" aria-label="بستن">' + icons.close + '</button></div>' +
        '<div class="sca-modal__body">' +
          '<div class="sca-lead-detail">' +
            '<div class="sca-lead-row"><div class="sca-lead-row__key">نام</div><div class="sca-lead-row__val">' + escapeHtml(lead.name || '-') + '</div></div>' +
            '<div class="sca-lead-row"><div class="sca-lead-row__key">موبایل</div><div class="sca-lead-row__val"><span dir="ltr">' + escapeHtml(lead.phone || '-') + '</span></div></div>' +
            '<div class="sca-lead-row"><div class="sca-lead-row__key">قیمت تقریبی</div><div class="sca-lead-row__val">' + formatPrice(lead.total_price || 0) + ' تومان</div></div>' +
            '<div class="sca-lead-row"><div class="sca-lead-row__key">تاریخ</div><div class="sca-lead-row__val">' + escapeHtml(formatDate(lead.created_at)) + '</div></div>' +
            '<div class="sca-field"><label for="sca-lead-status">وضعیت</label><select id="sca-lead-status"><option value="new"' + (lead.status === 'new' ? ' selected' : '') + '>جدید</option><option value="contacted"' + (lead.status === 'contacted' ? ' selected' : '') + '>تماس گرفته شد</option><option value="closed"' + (lead.status === 'closed' ? ' selected' : '') + '>بسته شده</option></select></div>' +
            '<div class="sca-field"><label for="sca-lead-notes">یادداشت ادمین</label><textarea id="sca-lead-notes" rows="4">' + escapeHtml(lead.admin_notes || '') + '</textarea></div>' +
            '<div class="sca-field"><label>انتخاب‌های کاربر</label><div class="sca-lead-selections">' + renderLeadSelections(lead.selections) + '</div></div>' +
            '<div><button type="button" class="sca-btn sca-btn--primary" id="sca-save-lead" data-id="' + lead.id + '" data-loading-text="' + text.saving + '">ذخیره تغییرات</button></div>' +
          '</div>' +
        '</div>' +
      '</div>';

      document.body.appendChild(overlay);
      document.body.style.overflow = 'hidden';
      state.activeModal = overlay;

      const focusTarget = overlay.querySelector('#sca-lead-status') || overlay.querySelector('.sca-modal__close');
      if (focusTarget) focusTarget.focus();

      overlay.addEventListener('click', function (e) {
        if (e.target === overlay || e.target.closest('.sca-modal__close')) closeModal();
      });

      const escHandler = function (e) {
        if (e.key === 'Escape') closeModal();
      };
      overlay._escHandler = escHandler;
      document.addEventListener('keydown', escHandler);

      const saveBtn = overlay.querySelector('#sca-save-lead');
      if (saveBtn) {
        saveBtn.addEventListener('click', function () {
          setButtonLoading(saveBtn, true);
          ajax('sc_update_lead', {
            id: lead.id,
            status: overlay.querySelector('#sca-lead-status').value,
            admin_notes: overlay.querySelector('#sca-lead-notes').value
          }, function () {
            closeModal();
            loadLeads();
            toast('درخواست بروزرسانی شد', 'success');
          }, null, {
            onFinally: function () { setButtonLoading(saveBtn, false); }
          });
        });
      }
    });
  }

  function renderLeadSelections(selections) {
    if (!Array.isArray(selections) || !selections.length) {
      return '<div class="sca-lead-sel-item">موردی ثبت نشده است.</div>';
    }

    return selections.map(function (item) {
      return '<div class="sca-lead-sel-item"><span class="sca-lead-sel-step">' + escapeHtml(item.step_title || 'مرحله') + ':</span> ' + escapeHtml(item.label || '-') + ' <strong style="font-weight:600">— ' + formatPrice(item.price || 0) + ' تومان</strong></div>';
    }).join('');
  }

  function closeModal() {
    const overlay = state.activeModal;
    if (!overlay) return;
    if (overlay._escHandler) document.removeEventListener('keydown', overlay._escHandler);
    overlay.remove();
    document.body.style.overflow = '';
    state.activeModal = null;
  }

  function initSettingsPage() {
    const form = document.getElementById('sca-settings-form');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const submit = form.querySelector('[type="submit"]');
      setButtonLoading(submit, true);
      ajax('sc_save_settings', new FormData(form), function (res) {
        state.settings = Object.assign({}, state.settings, res.settings || {});
        toast((res && res.message) || 'تنظیمات ذخیره شد', 'success');
      }, null, {
        onFinally: function () { setButtonLoading(submit, false); }
      });
    });
  }

  function ajax(action, data, onSuccess, onError, options) {
    options = options || {};
    const formData = data instanceof FormData ? data : new FormData();

    if (!(data instanceof FormData)) {
      Object.keys(data || {}).forEach(function (key) {
        const value = data[key];
        if (Array.isArray(value)) {
          value.forEach(function (item) { formData.append(key + '[]', item); });
        } else if (value !== undefined && value !== null) {
          formData.append(key, value);
        }
      });
    }

    formData.append('action', action);
    formData.append('nonce', SC_Admin.nonce);

    fetch(SC_Admin.ajax_url, {
      method: 'POST',
      body: formData,
      credentials: 'same-origin'
    })
      .then(function (res) {
        if (!res.ok) throw new Error('network');
        return res.json();
      })
      .then(function (res) {
        if (res && res.success) {
          if (typeof onSuccess === 'function') onSuccess(res.data || {});
          return;
        }
        const message = (res && res.data && res.data.message) ? res.data.message : text.error;
        throw new Error(message);
      })
      .catch(function (error) {
        if (!options.silent) toast(error.message || text.error, 'error');
        if (typeof onError === 'function') onError(error);
      })
      .finally(function () {
        if (typeof options.onFinally === 'function') options.onFinally();
      });
  }

  function setButtonLoading(btn, isLoading, loadingText) {
    if (!btn) return;
    if (isLoading) {
      if (!btn.dataset.originalHtml) btn.dataset.originalHtml = btn.innerHTML;
      btn.disabled = true;
      btn.classList.add('is-loading');
      btn.innerHTML = '<span class="sca-spinner sca-spinner--inline"></span><span>' + escapeHtml(loadingText || btn.dataset.loadingText || text.loading) + '</span>';
    } else {
      btn.disabled = false;
      btn.classList.remove('is-loading');
      if (btn.dataset.originalHtml) btn.innerHTML = btn.dataset.originalHtml;
    }
  }

  function toast(message, type) {
    const old = document.querySelector('.sca-toast');
    if (old) old.remove();
    const el = document.createElement('div');
    el.className = 'sca-toast sca-toast--' + (type || 'success');
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(function () { el.classList.add('sca-toast--show'); }, 10);
    setTimeout(function () {
      el.classList.remove('sca-toast--show');
      setTimeout(function () { el.remove(); }, 180);
    }, 2600);
  }

  function normalizeSteps(steps) {
    return (steps || []).map(normalizeStep).sort(function (a, b) {
      return Number(a.sort_order || 0) - Number(b.sort_order || 0);
    });
  }

  function normalizeStep(step) {
    return {
      id: Number(step.id || 0),
      title: step.title || '',
      description: step.description || '',
      type: step.type === 'checkbox' ? 'checkbox' : 'radio',
      is_active: Number(step.is_active) === 1 ? 1 : 0,
      sort_order: Number(step.sort_order || 0),
      options: normalizeOptions(step.options || [])
    };
  }

  function normalizeOptions(options) {
    return (options || []).map(function (option) {
      return {
        id: Number(option.id || 0),
        step_id: Number(option.step_id || 0),
        label: option.label || '',
        price: Number(option.price || 0),
        icon_svg: option.icon_svg || '',
        is_active: Number(option.is_active) === 1 ? 1 : 0,
        sort_order: Number(option.sort_order || 0)
      };
    }).sort(function (a, b) {
      return Number(a.sort_order || 0) - Number(b.sort_order || 0);
    });
  }

  function sortStepsInState() {
    state.steps.sort(function (a, b) {
      return Number(a.sort_order || 0) - Number(b.sort_order || 0);
    });
  }

  function sumLeadsTotal(items) {
    return (items || []).reduce(function (sum, item) {
      return sum + Number(item.total_price || 0);
    }, 0);
  }

  function formatPrice(value) {
    return Number(value || 0).toLocaleString('fa-IR');
  }

  function formatDate(value) {
    if (!value) return '-';
    return String(value);
  }

  function injectUtilityClasses() {
    if (document.getElementById('sca-admin-runtime-style')) return;
    const style = document.createElement('style');
    style.id = 'sca-admin-runtime-style';
    style.textContent = '' +
      '.sca-dragging{opacity:.55}.sca-drop-target{outline:2px dashed rgba(59,130,246,.35);outline-offset:4px}.sca-muted{color:#6b7280;font-size:12px}.sca-option-item--inactive,.sca-step-item--inactive{opacity:.65}.sca-spinner{display:inline-block;width:18px;height:18px;border:2px solid rgba(255,255,255,.25);border-top-color:currentColor;border-radius:999px;animation:sca-spin .7s linear infinite}.sca-spinner--inline{width:16px;height:16px;margin-inline-start:0;margin-inline-end:.45rem}.sca-loader{display:flex;align-items:center;justify-content:center;gap:.7rem;padding:1rem;color:#6b7280}.sca-toast{position:fixed;left:24px;bottom:24px;z-index:99999;background:#111827;color:#fff;padding:.85rem 1rem;border-radius:14px;box-shadow:0 10px 35px rgba(0,0,0,.18);opacity:0;transform:translateY(10px);transition:all .18s ease}.sca-toast--show{opacity:1;transform:translateY(0)}.sca-toast--error{background:#7f1d1d}.sca-toast--success{background:#0f766e}.sca-modal-overlay{position:fixed;inset:0;background:rgba(15,23,42,.48);display:flex;align-items:center;justify-content:center;padding:24px;z-index:99998}.sca-modal{width:min(760px,100%);max-height:88vh;overflow:auto;background:#fff;border-radius:18px;box-shadow:0 25px 60px rgba(15,23,42,.24)}.sca-modal__head{display:flex;align-items:center;justify-content:space-between;padding:1rem 1.2rem;border-bottom:1px solid #e5e7eb}.sca-modal__body{padding:1.2rem}.sca-modal__close{width:40px;height:40px;border:0;background:#f3f4f6;border-radius:12px;display:grid;place-items:center;cursor:pointer}.sca-modal__close svg,.sca-step-item__drag svg,.sca-step-item__del svg,.sca-option-item__btn svg,.sca-btn svg{width:18px;height:18px}.sca-lead-row{display:grid;grid-template-columns:140px 1fr;gap:.75rem;padding:.7rem 0;border-bottom:1px dashed #e5e7eb}.sca-lead-row__key{color:#6b7280}.sca-lead-row__val{font-weight:500}.sca-lead-selections{display:grid;gap:.55rem}.sca-lead-sel-item{padding:.85rem 1rem;background:#f8fafc;border:1px solid #e5e7eb;border-radius:14px}.sca-lead-sel-step{font-weight:700;color:#0f172a}.sca-page-btn{min-width:40px;height:40px;padding:0 .85rem;border:1px solid #dbe3ef;background:#fff;border-radius:12px;cursor:pointer}.sca-page-btn--active{background:#0f172a;color:#fff;border-color:#0f172a}.sca-badge{display:inline-flex;align-items:center;padding:.35rem .65rem;border-radius:999px;font-size:12px;font-weight:700}.sca-badge--new{background:#dbeafe;color:#1d4ed8}.sca-badge--contacted{background:#dcfce7;color:#15803d}.sca-badge--closed{background:#ede9fe;color:#6d28d9}@keyframes sca-spin{to{transform:rotate(360deg)}}';
    document.head.appendChild(style);
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function escapeAttr(str) {
    return escapeHtml(str);
  }
})();
