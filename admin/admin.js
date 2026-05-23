(function () {
  'use strict';

  if (typeof SC_Admin === 'undefined') return;

  const state = {
    steps: Array.isArray(SC_Admin.steps) ? SC_Admin.steps : [],
    settings: SC_Admin.settings || {},
    currentStepId: null,
    leads: [],
    leadStatus: '',
    currentPage: 1,
    perPage: 20,
    totalLeads: 0,
    editingOptionId: null,
  };

  const icons = {
    drag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    empty: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 7h18"/><path d="M6 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2"/><path d="M8 11v6M12 11v6M16 11v6"/><path d="M5 7l1 13a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-13"/></svg>'
  };

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    const wrap = document.getElementById('sc-admin-wrap');
    if (!wrap) return;

    if (document.getElementById('sc-steps-app')) initStepsPage();
    if (document.getElementById('sc-leads-app')) initLeadsPage();
    if (document.getElementById('sc-settings-app')) initSettingsPage();
  }

  function initStepsPage() {
    renderStepsList();
    bindStepsPageActions();

    if (state.steps.length) {
      openStepPanel(state.steps[0].id);
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
        renderStepForm();
      });
    }

    if (panel) {
      panel.addEventListener('submit', function (e) {
        if (e.target.matches('#sca-step-form')) {
          e.preventDefault();
          saveStep(new FormData(e.target));
        }

        if (e.target.matches('#sca-option-form')) {
          e.preventDefault();
          saveOption(new FormData(e.target));
        }
      });

      panel.addEventListener('click', function (e) {
        const delOption = e.target.closest('[data-delete-option]');
        const editOption = e.target.closest('[data-edit-option]');
        const delStep = e.target.closest('#sca-delete-step');
        const cancelOption = e.target.closest('#sca-cancel-option-edit');

        if (delOption) deleteOption(Number(delOption.dataset.deleteOption));
        if (editOption) fillOptionForm(Number(editOption.dataset.editOption));
        if (delStep) deleteStep(Number(delStep.dataset.stepId));
        if (cancelOption) {
          state.editingOptionId = null;
          resetOptionForm();
        }
      });
    }
  }

  function renderStepsList() {
    const list = document.getElementById('sca-steps-list');
    if (!list) return;

    if (!state.steps.length) {
      list.innerHTML = '<div class="sca-empty">' + icons.empty + '<div>هنوز مرحله‌ای ایجاد نشده است.</div></div>';
      return;
    }

    list.innerHTML = state.steps.map(function (step, index) {
      return '<div class="sca-step-item' + (step.id === state.currentStepId ? ' sca-step-item--active' : '') + (Number(step.is_active) !== 1 ? ' sca-step-item--inactive' : '') + '" data-step-item="' + step.id + '">' +
        '<span class="sca-step-item__drag">' + icons.drag + '</span>' +
        '<span class="sca-step-item__num">' + (index + 1) + '</span>' +
        '<span class="sca-step-item__title">' + escapeHtml(step.title || 'بدون عنوان') + '</span>' +
        '<span class="sca-step-item__type">' + (step.type === 'checkbox' ? 'چندتایی' : 'تکی') + '</span>' +
        '<button class="sca-step-item__del" type="button" data-delete-step-short="' + step.id + '">' + icons.trash + '</button>' +
      '</div>';
    }).join('');

    bindStepListInteractions();
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
        deleteStep(Number(btn.dataset.deleteStepShort));
      });
    });
  }

  function openStepPanel(stepId) {
    state.currentStepId = Number(stepId);
    renderStepsList();
    renderStepForm();
  }

  function renderStepForm() {
    const panel = document.getElementById('sca-step-panel');
    if (!panel) return;

    const step = state.steps.find(function (item) {
      return Number(item.id) === Number(state.currentStepId);
    }) || null;

    state.editingOptionId = null;

    panel.classList.add('sca-step-panel--visible');
    panel.innerHTML = '<div class="sca-card">' +
      '<div class="sca-card__head"><h3>' + (step ? 'ویرایش مرحله' : 'مرحله جدید') + '</h3>' + (step ? '<button class="sca-btn sca-btn--danger sca-btn--sm" id="sca-delete-step" data-step-id="' + step.id + '">حذف مرحله</button>' : '') + '</div>' +
      '<div class="sca-card__body">' +
        '<form id="sca-step-form" class="sca-form">' +
          '<input type="hidden" name="id" value="' + (step ? step.id : '') + '">' +
          '<div class="sca-field"><label>عنوان مرحله</label><input type="text" name="title" value="' + escapeAttr(step ? step.title : '') + '" required></div>' +
          '<div class="sca-field"><label>توضیح مرحله</label><textarea name="description">' + escapeHtml(step ? step.description || '' : '') + '</textarea></div>' +
          '<div class="sca-form-row">' +
            '<div class="sca-field"><label>نوع انتخاب</label><select name="type"><option value="radio"' + (step && step.type === 'radio' ? ' selected' : '') + '>تکی</option><option value="checkbox"' + (step && step.type === 'checkbox' ? ' selected' : '') + '>چندتایی</option></select></div>' +
            '<div class="sca-field"><label>وضعیت</label><label class="sca-toggle"><input type="checkbox" name="is_active" ' + (!step || Number(step.is_active) === 1 ? 'checked' : '') + '><span class="sca-toggle__track"></span><span class="sca-toggle__label">فعال باشد</span></label></div>' +
          '</div>' +
          '<div><button class="sca-btn sca-btn--primary" type="submit">ذخیره مرحله</button></div>' +
        '</form>' +
      '</div>' +
    '</div>' +
    (step ? renderOptionsManager(step) : '');
  }

  function renderOptionsManager(step) {
    const options = Array.isArray(step.options) ? step.options : [];

    return '<div class="sca-card" style="margin-top:1rem">' +
      '<div class="sca-card__head"><h3>گزینه‌های این مرحله</h3></div>' +
      '<div class="sca-card__body">' +
        '<div class="sca-options-list" id="sca-options-list">' +
          (options.length ? options.map(function (opt) {
            return '<div class="sca-option-item" data-option-item="' + opt.id + '">' +
              '<span class="sca-step-item__drag">' + icons.drag + '</span>' +
              '<span class="sca-option-item__label">' + escapeHtml(opt.label) + '</span>' +
              '<span class="sca-option-item__price">' + formatPrice(opt.price) + ' تومان</span>' +
              '<div class="sca-option-item__actions">' +
                '<button type="button" class="sca-option-item__btn" data-edit-option="' + opt.id + '">' + icons.edit + '</button>' +
                '<button type="button" class="sca-option-item__btn sca-option-item__btn--del" data-delete-option="' + opt.id + '">' + icons.trash + '</button>' +
              '</div>' +
            '</div>';
          }).join('') : '<div class="sca-empty">' + icons.empty + '<div>هنوز گزینه‌ای ثبت نشده است.</div></div>') +
        '</div>' +
        '<form id="sca-option-form" class="sca-form">' +
          '<input type="hidden" name="id" value="">' +
          '<input type="hidden" name="step_id" value="' + step.id + '">' +
          '<div class="sca-add-option-form">' +
            '<div class="sca-field"><label>عنوان گزینه</label><input type="text" name="label" required></div>' +
            '<div class="sca-field"><label>قیمت</label><input type="number" name="price" min="0" step="1" required></div>' +
            '<div class="sca-field"><label>فعال</label><label class="sca-toggle"><input type="checkbox" name="is_active" checked><span class="sca-toggle__track"></span></label></div>' +
            '<div class="sca-field"><label>&nbsp;</label><button class="sca-btn sca-btn--success" type="submit" id="sca-option-submit">افزودن</button></div>' +
          '</div>' +
          '<div class="sca-field" style="margin-top:.75rem"><label>SVG آیکون (اختیاری)</label><textarea name="icon_svg" placeholder="<svg ...>...</svg>"></textarea></div>' +
          '<div id="sca-option-cancel-wrap" style="display:none;margin-top:.75rem"><button class="sca-btn sca-btn--ghost" type="button" id="sca-cancel-option-edit">انصراف از ویرایش</button></div>' +
        '</form>' +
      '</div>' +
    '</div>';
  }

  function renderEmptyPanel() {
    const panel = document.getElementById('sca-step-panel');
    if (!panel) return;
    panel.classList.add('sca-step-panel--visible');
    panel.innerHTML = '<div class="sca-card"><div class="sca-card__body"><div class="sca-empty">' + icons.empty + '<div>برای شروع یک مرحله جدید بساز.</div></div></div></div>';
  }

  function fillOptionForm(optionId) {
    const step = getCurrentStep();
    if (!step || !Array.isArray(step.options)) return;
    const option = step.options.find(function (item) { return Number(item.id) === Number(optionId); });
    if (!option) return;

    state.editingOptionId = option.id;
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

  function saveStep(formData) {
    ajax('sc_save_step', formData, function (res) {
      const step = res.step;
      const existingIndex = state.steps.findIndex(function (item) { return Number(item.id) === Number(step.id); });

      if (existingIndex > -1) {
        step.options = state.steps[existingIndex].options || [];
        state.steps[existingIndex] = step;
      } else {
        step.options = [];
        state.steps.push(step);
      }

      state.currentStepId = Number(step.id);
      renderStepsList();
      renderStepForm();
      toast('مرحله ذخیره شد', 'success');
    });
  }

  function deleteStep(id) {
    if (!confirm(SC_Admin.strings.confirm_delete_step)) return;
    ajax('sc_delete_step', { id: id }, function () {
      state.steps = state.steps.filter(function (step) { return Number(step.id) !== Number(id); });
      if (Number(state.currentStepId) === Number(id)) {
        state.currentStepId = state.steps.length ? Number(state.steps[0].id) : null;
      }
      renderStepsList();
      state.currentStepId ? renderStepForm() : renderEmptyPanel();
      toast('مرحله حذف شد', 'success');
    });
  }

  function saveOption(formData) {
    ajax('sc_save_option', formData, function (res) {
      const step = getCurrentStep();
      if (!step) return;
      step.options = Array.isArray(res.options) ? res.options : [];
      renderStepForm();
      toast('گزینه ذخیره شد', 'success');
    });
  }

  function deleteOption(id) {
    if (!confirm(SC_Admin.strings.confirm_delete_option)) return;
    ajax('sc_delete_option', { id: id }, function () {
      const step = getCurrentStep();
      if (!step || !Array.isArray(step.options)) return;
      step.options = step.options.filter(function (opt) { return Number(opt.id) !== Number(id); });
      renderStepForm();
      toast('گزینه حذف شد', 'success');
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
    if (reloadBtn) reloadBtn.addEventListener('click', loadLeads);
    if (deleteAllBtn) {
      deleteAllBtn.addEventListener('click', function () {
        if (!confirm(SC_Admin.strings.confirm_delete_leads)) return;
        ajax('sc_delete_all_leads', {}, function () {
          state.currentPage = 1;
          loadLeads();
          toast('همه درخواست‌ها حذف شدند', 'success');
        });
      });
    }
  }

  function loadLeads() {
    const body = document.getElementById('sca-leads-body');
    if (body) {
      body.innerHTML = '<tr><td colspan="6"><div class="sca-loader"><span class="sca-spinner"></span><span>' + escapeHtml(SC_Admin.strings.loading) + '</span></div></td></tr>';
    }

    ajax('sc_get_leads', {
      status: state.leadStatus,
      limit: state.perPage,
      offset: (state.currentPage - 1) * state.perPage
    }, function (res) {
      state.leads = Array.isArray(res.items) ? res.items : [];
      state.totalLeads = Number(res.total || 0);
      renderLeadsTable();
      renderLeadPagination();
    });
  }

  function renderLeadsTable() {
    const body = document.getElementById('sca-leads-body');
    if (!body) return;

    if (!state.leads.length) {
      body.innerHTML = '<tr><td colspan="6"><div class="sca-empty">' + icons.empty + '<div>درخواستی پیدا نشد.</div></div></td></tr>';
      return;
    }

    body.innerHTML = state.leads.map(function (lead) {
      return '<tr data-lead-row="' + lead.id + '">' +
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
    });
  }

  function renderLeadStatusBadge(status) {
    const labels = { new: 'جدید', contacted: 'تماس گرفته شد', closed: 'بسته شده' };
    return '<span class="sca-badge sca-badge--' + escapeAttr(status || 'new') + '">' + (labels[status] || labels.new) + '</span>';
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
    for (let i = 1; i <= pages; i++) {
      html += '<button type="button" class="sca-page-btn' + (i === state.currentPage ? ' sca-page-btn--active' : '') + '" data-page="' + i + '">' + i + '</button>';
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
      const lead = res.lead;
      const overlay = document.createElement('div');
      overlay.className = 'sca-modal-overlay';
      overlay.innerHTML = '<div class="sca-modal" role="dialog" aria-modal="true">' +
        '<div class="sca-modal__head"><h3>جزئیات درخواست #' + lead.id + '</h3><button type="button" class="sca-modal__close">' + icons.close + '</button></div>' +
        '<div class="sca-modal__body">' +
          '<div class="sca-lead-detail">' +
            '<div class="sca-lead-row"><div class="sca-lead-row__key">نام</div><div class="sca-lead-row__val">' + escapeHtml(lead.name || '-') + '</div></div>' +
            '<div class="sca-lead-row"><div class="sca-lead-row__key">موبایل</div><div class="sca-lead-row__val"><span dir="ltr">' + escapeHtml(lead.phone || '-') + '</span></div></div>' +
            '<div class="sca-lead-row"><div class="sca-lead-row__key">قیمت تقریبی</div><div class="sca-lead-row__val">' + formatPrice(lead.total_price || 0) + ' تومان</div></div>' +
            '<div class="sca-lead-row"><div class="sca-lead-row__key">تاریخ</div><div class="sca-lead-row__val">' + escapeHtml(formatDate(lead.created_at)) + '</div></div>' +
            '<div class="sca-field"><label>وضعیت</label><select id="sca-lead-status"><option value="new"' + (lead.status === 'new' ? ' selected' : '') + '>جدید</option><option value="contacted"' + (lead.status === 'contacted' ? ' selected' : '') + '>تماس گرفته شد</option><option value="closed"' + (lead.status === 'closed' ? ' selected' : '') + '>بسته شده</option></select></div>' +
            '<div class="sca-field"><label>یادداشت ادمین</label><textarea id="sca-lead-notes">' + escapeHtml(lead.admin_notes || '') + '</textarea></div>' +
            '<div class="sca-field"><label>انتخاب‌های کاربر</label><div class="sca-lead-selections">' + renderLeadSelections(lead.selections) + '</div></div>' +
            '<div><button type="button" class="sca-btn sca-btn--primary" id="sca-save-lead" data-id="' + lead.id + '">ذخیره تغییرات</button></div>' +
          '</div>' +
        '</div>' +
      '</div>';

      document.body.appendChild(overlay);
      document.body.style.overflow = 'hidden';

      overlay.addEventListener('click', function (e) {
        if (e.target === overlay || e.target.closest('.sca-modal__close')) closeModal(overlay);
      });

      const saveBtn = overlay.querySelector('#sca-save-lead');
      if (saveBtn) {
        saveBtn.addEventListener('click', function () {
          ajax('sc_update_lead', {
            id: lead.id,
            status: overlay.querySelector('#sca-lead-status').value,
            admin_notes: overlay.querySelector('#sca-lead-notes').value
          }, function () {
            closeModal(overlay);
            loadLeads();
            toast('درخواست بروزرسانی شد', 'success');
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
      return '<div class="sca-lead-sel-item"><span class="sca-lead-sel-step">' + escapeHtml(item.step_title || 'مرحله') + ':</span>' + escapeHtml(item.label || '-') + ' — ' + formatPrice(item.price || 0) + ' تومان</div>';
    }).join('');
  }

  function closeModal(overlay) {
    if (!overlay) return;
    overlay.remove();
    document.body.style.overflow = '';
  }

  function initSettingsPage() {
    const form = document.getElementById('sca-settings-form');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      ajax('sc_save_settings', new FormData(form), function (res) {
        toast(res.message || 'تنظیمات ذخیره شد', 'success');
      });
    });
  }

  function ajax(action, data, onSuccess) {
    const formData = data instanceof FormData ? data : new FormData();
    if (!(data instanceof FormData)) {
      Object.keys(data || {}).forEach(function (key) {
        const value = data[key];
        if (Array.isArray(value)) {
          value.forEach(function (item) { formData.append(key + '[]', item); });
        } else {
          formData.append(key, value);
        }
      });
    }

    formData.append('action', action);
    formData.append('nonce', SC_Admin.nonce);

    fetch(SC_Admin.ajax_url, { method: 'POST', body: formData })
      .then(function (res) { return res.json(); })
      .then(function (res) {
        if (res && res.success) {
          onSuccess && onSuccess(res.data || {});
        } else {
          toast((res && res.data && res.data.message) ? res.data.message : SC_Admin.strings.error, 'error');
        }
      })
      .catch(function () {
        toast(SC_Admin.strings.error, 'error');
      });
  }

  function toast(message, type) {
    const old = document.querySelector('.sca-toast');
    if (old) old.remove();
    const el = document.createElement('div');
    el.className = 'sca-toast sca-toast--' + (type || 'success');
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(function () { el.remove(); }, 2600);
  }

  function formatPrice(value) {
    return Number(value || 0).toLocaleString('fa-IR');
  }

  function formatDate(value) {
    return value || '-';
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
