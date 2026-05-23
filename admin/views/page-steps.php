<?php
if ( ! defined( 'ABSPATH' ) ) exit;
?>
<div id="sc-admin-wrap" class="sc-admin-wrap" dir="rtl">

  <div class="sc-admin-page-header">
    <div class="sc-admin-page-header__inner">
      <h1 class="sc-admin-page-title">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/>
          <line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="12" y2="14"/>
        </svg>
        مراحل و گزینه‌ها
      </h1>
      <p class="sc-admin-page-desc">مراحل ماشین حساب و گزینه‌های هر مرحله را مدیریت کنید. برای تغییر ترتیب، آیتم‌ها را بکشید و رها کنید.</p>
    </div>
    <div class="sc-admin-page-header__actions">
      <button id="sca-add-step" class="sca-btn sca-btn--primary" type="button">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        افزودن مرحله جدید
      </button>
    </div>
  </div>

  <div id="sca-toast-area" class="sca-toast-area" aria-live="polite"></div>

  <?php
  $steps = SC_DB::get_steps();
  foreach ( $steps as $step ) {
      $step->options = SC_DB::get_options( $step->id );
  }
  ?>

  <?php if ( empty( $steps ) ) : ?>
  <div class="sca-onboarding">
    <div class="sca-onboarding__icon">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
      </svg>
    </div>
    <h2>هنوز مرحله‌ای ایجاد نشده است</h2>
    <p>برای شروع روی دکمه «افزودن مرحله جدید» کلیک کنید.</p>
    <button id="sca-add-step-onboard" class="sca-btn sca-btn--primary sca-btn--lg" type="button">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      ایجاد اولین مرحله
    </button>
  </div>
  <?php endif; ?>

  <div class="sca-layout" <?php if ( empty( $steps ) ) echo 'style="display:none"'; ?>>

    <!-- ─── Sidebar: لیست مراحل ─── -->
    <aside class="sca-sidebar">
      <div class="sca-sidebar__head">
        <span class="sca-sidebar__title">مراحل</span>
        <span class="sca-badge" id="sca-steps-count"><?php echo count( $steps ); ?></span>
      </div>
      <div id="sca-steps-list" class="sca-steps-list">
        <?php foreach ( $steps as $index => $step ) :
          $opt_count = is_array( $step->options ) ? count( $step->options ) : 0;
        ?>
        <div class="sca-step-item<?php echo ( $index === 0 ) ? ' sca-step-item--active' : ''; ?><?php echo ! $step->is_active ? ' sca-step-item--inactive' : ''; ?>"
             data-step-item="<?php echo (int) $step->id; ?>"
             draggable="true">
          <span class="sca-step-item__drag" title="جابجایی برای تغییر ترتیب">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="9" cy="5" r="1.2" fill="currentColor"/><circle cx="9" cy="12" r="1.2" fill="currentColor"/>
              <circle cx="9" cy="19" r="1.2" fill="currentColor"/><circle cx="15" cy="5" r="1.2" fill="currentColor"/>
              <circle cx="15" cy="12" r="1.2" fill="currentColor"/><circle cx="15" cy="19" r="1.2" fill="currentColor"/>
            </svg>
          </span>
          <span class="sca-step-item__num"><?php echo $index + 1; ?></span>
          <span class="sca-step-item__meta">
            <span class="sca-step-item__title"><?php echo esc_html( $step->title ?: 'بدون عنوان' ); ?></span>
            <span class="sca-step-item__info">
              <?php echo $opt_count; ?> گزینه
              &middot;
              <?php echo $step->type === 'checkbox' ? 'چندانتخابی' : 'تکانتخابی'; ?>
              <?php if ( ! $step->is_active ) : ?>
                &middot; <span class="sca-badge sca-badge--warn">غیرفعال</span>
              <?php endif; ?>
            </span>
          </span>
          <button class="sca-step-item__del" type="button"
                  data-delete-step-short="<?php echo (int) $step->id; ?>"
                  aria-label="حذف مرحله">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
              <path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
            </svg>
          </button>
        </div>
        <?php endforeach; ?>
      </div>
    </aside>

    <!-- ─── Main Panel ─── -->
    <main class="sca-main">
      <div id="sca-step-panel" class="sca-step-panel sca-step-panel--visible">

        <?php if ( ! empty( $steps ) ) :
          $first = $steps[0];
        ?>

        <!-- فرم مرحله -->
        <div class="sca-card">
          <div class="sca-card__head">
            <h3 id="sca-panel-title">ویرایش مرحله</h3>
            <button class="sca-btn sca-btn--danger sca-btn--sm"
                    id="sca-delete-step"
                    data-step-id="<?php echo (int) $first->id; ?>"
                    type="button">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
              </svg>
              حذف مرحله
            </button>
          </div>
          <div class="sca-card__body">
            <form id="sca-step-form" class="sca-form" autocomplete="off">
              <input type="hidden" name="id" value="<?php echo (int) $first->id; ?>">

              <div class="sca-form__row sca-form__row--2">
                <div class="sca-form__group">
                  <label for="sca-step-title">عنوان مرحله <span class="sca-required">*</span></label>
                  <input type="text" id="sca-step-title" name="title"
                         value="<?php echo esc_attr( $first->title ); ?>"
                         placeholder="مثال: نوع سایت" required>
                </div>
                <div class="sca-form__group">
                  <label for="sca-step-type">نوع انتخاب</label>
                  <select id="sca-step-type" name="type">
                    <option value="radio"    <?php selected( $first->type, 'radio' ); ?>>تکانتخابی (رادیو)</option>
                    <option value="checkbox" <?php selected( $first->type, 'checkbox' ); ?>>چندانتخابی (چک‌باکس)</option>
                  </select>
                </div>
              </div>

              <div class="sca-form__group">
                <label for="sca-step-desc">توضیحات (اختیاری)</label>
                <textarea id="sca-step-desc" name="description" rows="2"
                          placeholder="راهنمای کوتاه برای کاربر..."><?php echo esc_textarea( $first->description ); ?></textarea>
              </div>

              <div class="sca-form__group sca-form__group--inline">
                <label class="sca-toggle">
                  <input type="checkbox" name="is_active" value="1"
                         <?php checked( $first->is_active, 1 ); ?>>
                  <span class="sca-toggle__slider"></span>
                </label>
                <span class="sca-toggle__label">مرحله فعال باشد</span>
              </div>

              <div class="sca-form__actions">
                <button type="submit" class="sca-btn sca-btn--primary sca-btn--save">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                    <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
                  </svg>
                  ذخیره مرحله
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- مدیریت گزینه‌ها -->
        <div class="sca-card" id="sca-options-card">
          <div class="sca-card__head">
            <h3>
              گزینه‌های این مرحله
              <span class="sca-badge" id="sca-options-count"><?php echo count( $first->options ); ?></span>
            </h3>
          </div>
          <div class="sca-card__body">

            <!-- لیست گزینه‌ها -->
            <div id="sca-options-list" class="sca-options-list">
              <?php if ( empty( $first->options ) ) : ?>
              <div class="sca-empty" id="sca-options-empty">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p>هنوز گزینه‌ای اضافه نشده است.</p>
              </div>
              <?php else : ?>
                <?php foreach ( $first->options as $opt_i => $opt ) : ?>
                <div class="sca-option-item<?php echo ! $opt->is_active ? ' sca-option-item--inactive' : ''; ?>"
                     data-option-item="<?php echo (int) $opt->id; ?>"
                     draggable="true">
                  <span class="sca-option-item__drag" title="جابجایی">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="9" cy="5" r="1.2" fill="currentColor"/><circle cx="9" cy="12" r="1.2" fill="currentColor"/>
                      <circle cx="9" cy="19" r="1.2" fill="currentColor"/><circle cx="15" cy="5" r="1.2" fill="currentColor"/>
                      <circle cx="15" cy="12" r="1.2" fill="currentColor"/><circle cx="15" cy="19" r="1.2" fill="currentColor"/>
                    </svg>
                  </span>
                  <span class="sca-option-item__num"><?php echo $opt_i + 1; ?></span>
                  <span class="sca-option-item__label"><?php echo esc_html( $opt->label ); ?></span>
                  <span class="sca-option-item__price">
                    <?php echo $opt->price > 0 ? number_format_i18n( $opt->price ) . ' تومان' : 'رایگان'; ?>
                  </span>
                  <?php if ( ! $opt->is_active ) : ?>
                    <span class="sca-badge sca-badge--warn sca-option-item__status">غیرفعال</span>
                  <?php endif; ?>
                  <div class="sca-option-item__actions">
                    <button class="sca-icon-btn sca-icon-btn--edit" type="button"
                            data-edit-option="<?php echo (int) $opt->id; ?>"
                            title="ویرایش گزینه" aria-label="ویرایش">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
                      </svg>
                    </button>
                    <button class="sca-icon-btn sca-icon-btn--delete" type="button"
                            data-delete-option="<?php echo (int) $opt->id; ?>"
                            title="حذف گزینه" aria-label="حذف">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                        <path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                      </svg>
                    </button>
                  </div>
                </div>
                <?php endforeach; ?>
              <?php endif; ?>
            </div>

            <!-- فرم گزینه -->
            <div class="sca-option-form-wrap">
              <div class="sca-option-form-wrap__head">
                <h4 id="sca-option-form-title">افزودن گزینه جدید</h4>
              </div>
              <form id="sca-option-form" class="sca-form sca-option-form" autocomplete="off">
                <input type="hidden" name="id" value="">
                <input type="hidden" name="step_id" value="<?php echo (int) $first->id; ?>">

                <div class="sca-form__row sca-form__row--3">
                  <div class="sca-form__group">
                    <label for="sca-opt-label">عنوان گزینه <span class="sca-required">*</span></label>
                    <input type="text" id="sca-opt-label" name="label"
                           placeholder="مثال: فروشگاهی" required>
                  </div>
                  <div class="sca-form__group">
                    <label for="sca-opt-price">قیمت (تومان)</label>
                    <input type="number" id="sca-opt-price" name="price"
                           placeholder="مثال: 5000000" min="0" step="100000">
                  </div>
                  <div class="sca-form__group sca-form__group--center">
                    <label class="sca-toggle" title="فعال بودن گزینه">
                      <input type="checkbox" name="is_active" value="1" checked>
                      <span class="sca-toggle__slider"></span>
                    </label>
                    <span class="sca-toggle__label">فعال</span>
                  </div>
                </div>

                <div class="sca-form__group">
                  <label for="sca-opt-icon">آیکون SVG (اختیاری)</label>
                  <textarea id="sca-opt-icon" name="icon_svg" rows="2"
                            placeholder='<svg viewBox="0 0 24 24" ...>...</svg>'></textarea>
                  <span class="sca-form__hint">کد SVG آیکون را وارد کنید. پیشنهاد: آیکون‌های Lucide یا Heroicons</span>
                </div>

                <div class="sca-form__actions">
                  <button type="submit" class="sca-btn sca-btn--secondary sca-btn--save" id="sca-option-save-btn">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    افزودن گزینه
                  </button>
                  <button type="button" class="sca-btn sca-btn--ghost" id="sca-cancel-option-edit"
                          style="display:none">انصراف</button>
                </div>
              </form>
            </div>

          </div><!-- /.sca-card__body -->
        </div><!-- /#sca-options-card -->

        <?php else : ?>
        <!-- حالت خالی: هنوز مرحله‌ای انتخاب نشده — JS این پنل را جایگزین می‌کند -->
        <div class="sca-empty-panel" id="sca-empty-panel">
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          <p>یک مرحله را از سمت راست انتخاب کنید یا مرحله جدید اضافه کنید.</p>
        </div>
        <?php endif; ?>

      </div><!-- /#sca-step-panel -->
    </main>

  </div><!-- /.sca-layout -->

</div><!-- /#sc-admin-wrap -->
