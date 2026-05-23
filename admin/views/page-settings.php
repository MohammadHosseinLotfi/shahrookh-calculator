<?php
if ( ! defined( 'ABSPATH' ) ) exit;

$s = SC_DB::get_settings();
?>
<div id="sc-admin-wrap" class="sc-admin-wrap" dir="rtl">

  <!-- ─── Page Header ─── -->
  <div class="sc-admin-page-header">
    <div class="sc-admin-page-header__inner">
      <h1 class="sc-admin-page-title">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
          <path d="M22.54 6.08a15 15 0 0 1 0 11.84M1.46 6.08a15 15 0 0 0 0 11.84"/>
        </svg>
        تنظیمات ماشین حساب
      </h1>
      <p class="sc-admin-page-desc">رنگ‌بندی، متن‌ها و رفتار ماشین حساب را از اینجا شخصی‌سازی کنید.</p>
    </div>
  </div>

  <div id="sca-toast-area" class="sca-toast-area" aria-live="polite"></div>

  <!-- ─── Settings Form ─── -->
  <div id="sc-settings-app">
    <form id="sca-settings-form" class="sca-settings-form" autocomplete="off">

      <!-- بخش ۱: ظاهر و رنگ‌بندی -->
      <div class="sca-card sca-settings-section">
        <div class="sca-card__head">
          <h3>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <circle cx="13.5" cy="6.5" r="2.5"/><circle cx="19" cy="13" r="2.5"/>
              <circle cx="6" cy="14" r="2.5"/><circle cx="10" cy="20" r="2.5"/>
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
            </svg>
            ظاهر و رنگ‌بندی
          </h3>
          <p class="sca-card__desc">رنگ‌های اصلی ماشین حساب را انتخاب کنید. این رنگ‌ها بلافاصله روی فرانت‌اند اعمال می‌شوند.</p>
        </div>
        <div class="sca-card__body">

          <div class="sca-form__row sca-form__row--2">

            <!-- رنگ اصلی -->
            <div class="sca-form__group">
              <label for="sc-primary-color">رنگ اصلی (Primary)</label>
              <div class="sca-color-field">
                <input type="color"
                       id="sc-primary-color"
                       name="settings[primary_color]"
                       value="<?php echo esc_attr( $s['primary_color'] ?? '#1e40af' ); ?>">
                <input type="text"
                       class="sca-color-field__text"
                       id="sc-primary-color-text"
                       value="<?php echo esc_attr( $s['primary_color'] ?? '#1e40af' ); ?>"
                       placeholder="#1e40af"
                       maxlength="7"
                       aria-label="کد hex رنگ اصلی">
                <span class="sca-color-field__preview"
                      style="background:<?php echo esc_attr( $s['primary_color'] ?? '#1e40af' ); ?>"></span>
              </div>
              <span class="sca-form__hint">رنگ دکمه‌ها، step های فعال و هایلایت گزینه‌ها</span>
            </div>

            <!-- رنگ تأکیدی -->
            <div class="sca-form__group">
              <label for="sc-accent-color">رنگ تأکیدی (Accent)</label>
              <div class="sca-color-field">
                <input type="color"
                       id="sc-accent-color"
                       name="settings[accent_color]"
                       value="<?php echo esc_attr( $s['accent_color'] ?? '#16a34a' ); ?>">
                <input type="text"
                       class="sca-color-field__text"
                       id="sc-accent-color-text"
                       value="<?php echo esc_attr( $s['accent_color'] ?? '#16a34a' ); ?>"
                       placeholder="#16a34a"
                       maxlength="7"
                       aria-label="کد hex رنگ تأکیدی">
                <span class="sca-color-field__preview"
                      style="background:<?php echo esc_attr( $s['accent_color'] ?? '#16a34a' ); ?>"></span>
              </div>
              <span class="sca-form__hint">رنگ نشانگر قیمت، تیک گزینه انتخاب‌شده</span>
            </div>

          </div>

          <!-- پیش‌نمایش رنگ‌ها -->
          <div class="sca-color-preview-bar">
            <span class="sca-color-preview-bar__label">پیش‌نمایش:</span>
            <button type="button" class="sca-btn sca-btn--primary sca-btn--preview" id="sca-preview-primary-btn"
                    style="background:<?php echo esc_attr( $s['primary_color'] ?? '#1e40af' ); ?>">دکمه اصلی</button>
            <span class="sca-badge sca-badge--accent" id="sca-preview-accent-badge"
                  style="background:<?php echo esc_attr( $s['accent_color'] ?? '#16a34a' ); ?>">قیمت تقریبی</span>
            <span class="sca-color-preview-bar__hint">تغییرات پس از ذخیره اعمال می‌شوند</span>
          </div>

        </div>
      </div>

      <!-- بخش ۲: متن‌های ماشین حساب -->
      <div class="sca-card sca-settings-section">
        <div class="sca-card__head">
          <h3>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            متن‌های نمایشی
          </h3>
          <p class="sca-card__desc">عنوان‌ها و متن‌هایی که کاربر در ماشین حساب می‌بیند.</p>
        </div>
        <div class="sca-card__body">

          <div class="sca-form__row sca-form__row--2">

            <div class="sca-form__group">
              <label for="sc-calc-title">
                عنوان اصلی ماشین حساب
                <span class="sca-required">*</span>
              </label>
              <input type="text"
                     id="sc-calc-title"
                     name="settings[calculator_title]"
                     value="<?php echo esc_attr( $s['calculator_title'] ?? 'محاسبه هزینه طراحی سایت' ); ?>"
                     placeholder="محاسبه هزینه طراحی سایت"
                     required>
            </div>

            <div class="sca-form__group">
              <label for="sc-submit-btn-text">متن دکمه ارسال فرم</label>
              <input type="text"
                     id="sc-submit-btn-text"
                     name="settings[submit_button_text]"
                     value="<?php echo esc_attr( $s['submit_button_text'] ?? 'دریافت مشاوره رایگان' ); ?>"
                     placeholder="دریافت مشاوره رایگان">
            </div>

          </div>

          <div class="sca-form__group">
            <label for="sc-calc-subtitle">زیرعنوان (توضیحات)</label>
            <textarea id="sc-calc-subtitle"
                      name="settings[calculator_subtitle]"
                      rows="2"
                      placeholder="با انتخاب گزینه‌های مورد نظر، هزینه تقریبی پروژه خود را محاسبه کنید"><?php echo esc_textarea( $s['calculator_subtitle'] ?? '' ); ?></textarea>
          </div>

          <div class="sca-form__group">
            <label for="sc-success-msg">پیام موفقیت پس از ثبت درخواست</label>
            <textarea id="sc-success-msg"
                      name="settings[success_message]"
                      rows="2"
                      placeholder="درخواست شما با موفقیت ثبت شد. کارشناسان ما به زودی با شما تماس می‌گیرند."><?php echo esc_textarea( $s['success_message'] ?? '' ); ?></textarea>
            <span class="sca-form__hint">این متن پس از ثبت موفق فرم به کاربر نمایش داده می‌شود.</span>
          </div>

        </div>
      </div>

      <!-- بخش ۳: گزینه‌های پیشرفته -->
      <div class="sca-card sca-settings-section">
        <div class="sca-card__head">
          <h3>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            گزینه‌های پیشرفته
          </h3>
        </div>
        <div class="sca-card__body">

          <div class="sca-form__group sca-form__group--toggle-row">
            <label class="sca-toggle">
              <input type="hidden" name="settings[notify_admin]" value="0">
              <input type="checkbox"
                     name="settings[notify_admin]"
                     value="1"
                     <?php checked( ! empty( $s['notify_admin'] ) ); ?>>
              <span class="sca-toggle__slider"></span>
            </label>
            <div class="sca-toggle-row__meta">
              <span class="sca-toggle__label">ارسال ایمیل اطلاع‌رسانی به ادمین</span>
              <span class="sca-form__hint">هنگام ثبت هر درخواست جدید، به ایمیل ادمین سایت اطلاع‌رسانی شود.
                <code class="sca-inline-code"><?php echo esc_html( get_option( 'admin_email' ) ); ?></code>
              </span>
            </div>
          </div>

          <div class="sca-divider"></div>

          <div class="sca-form__group sca-form__group--toggle-row sca-form__group--danger">
            <label class="sca-toggle">
              <input type="hidden" name="settings[delete_on_uninstall]" value="0">
              <input type="checkbox"
                     name="settings[delete_on_uninstall]"
                     value="1"
                     <?php checked( ! empty( $s['delete_on_uninstall'] ) ); ?>>
              <span class="sca-toggle__slider sca-toggle__slider--danger"></span>
            </label>
            <div class="sca-toggle-row__meta">
              <span class="sca-toggle__label sca-toggle__label--danger">حذف داده‌ها هنگام حذف افزونه</span>
              <span class="sca-form__hint">در صورت فعال بودن، با حذف افزونه تمام مراحل، گزینه‌ها و درخواست‌های ثبت‌شده نیز پاک می‌شوند.</span>
            </div>
          </div>

        </div>
      </div>

      <!-- بخش ۴: shortcode راهنما -->
      <div class="sca-card sca-settings-section sca-settings-section--info">
        <div class="sca-card__head">
          <h3>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            نحوه استفاده
          </h3>
        </div>
        <div class="sca-card__body">
          <p class="sca-settings-info__text">برای نمایش ماشین حساب در هر صفحه یا نوشته‌ای، کد کوتاه زیر را قرار دهید:</p>
          <div class="sca-shortcode-box">
            <code id="sca-shortcode-code">[shahrokh_calculator]</code>
            <button type="button" class="sca-btn sca-btn--ghost sca-btn--xs" id="sca-copy-shortcode" title="کپی کد کوتاه">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 0 2 2v1"/>
              </svg>
              کپی
            </button>
          </div>
        </div>
      </div>

      <!-- دکمه ذخیره -->
      <div class="sca-settings-footer">
        <button type="submit" class="sca-btn sca-btn--primary sca-btn--lg sca-btn--save">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/>
            <polyline points="7 3 7 8 15 8"/>
          </svg>
          ذخیره تنظیمات
        </button>
        <span class="sca-settings-footer__hint">تغییرات پس از ذخیره بلافاصله روی سایت اعمال می‌شوند.</span>
      </div>

    </form>
  </div><!-- /#sc-settings-app -->

</div><!-- /#sc-admin-wrap -->

<script>
(function () {
  // ─── همگام‌سازی color picker با text input ───────────────────
  function syncColorInputs(colorId, textId) {
    var colorInput = document.getElementById(colorId);
    var textInput  = document.getElementById(textId);
    if (!colorInput || !textInput) return;

    // preview span
    var preview = colorInput.closest('.sca-color-field')
                ? colorInput.closest('.sca-color-field').querySelector('.sca-color-field__preview')
                : null;

    colorInput.addEventListener('input', function () {
      textInput.value = colorInput.value;
      if (preview) preview.style.background = colorInput.value;
      updateLivePreview(colorId, colorInput.value);
    });

    textInput.addEventListener('input', function () {
      var val = textInput.value.trim();
      if (/^#[0-9a-fA-F]{6}$/.test(val)) {
        colorInput.value = val;
        if (preview) preview.style.background = val;
        updateLivePreview(colorId, val);
      }
    });
  }

  function updateLivePreview(colorId, color) {
    if (colorId === 'sc-primary-color') {
      var btn = document.getElementById('sca-preview-primary-btn');
      if (btn) btn.style.background = color;
    } else if (colorId === 'sc-accent-color') {
      var badge = document.getElementById('sca-preview-accent-badge');
      if (badge) badge.style.background = color;
    }
  }

  syncColorInputs('sc-primary-color', 'sc-primary-color-text');
  syncColorInputs('sc-accent-color',  'sc-accent-color-text');

  // ─── کپی shortcode ───────────────────────────────────────────
  var copyBtn = document.getElementById('sca-copy-shortcode');
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      var code = document.getElementById('sca-shortcode-code');
      if (!code) return;
      navigator.clipboard.writeText(code.textContent).then(function () {
        copyBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> کپی شد';
        copyBtn.classList.add('sca-btn--success');
        setTimeout(function () {
          copyBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 0 2 2v1"/></svg> کپی';
          copyBtn.classList.remove('sca-btn--success');
        }, 2000);
      });
    });
  }
})();
</script>
