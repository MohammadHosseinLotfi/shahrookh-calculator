<?php
if ( ! defined( 'ABSPATH' ) ) exit;

// آمار خلاصه
$new_count       = SC_DB::count_new_leads();
$all_leads_data  = SC_DB::get_leads( [ 'limit' => 1, 'offset' => 0 ] );
$total_count     = $all_leads_data['total'];
?>
<div id="sc-admin-wrap" class="sc-admin-wrap" dir="rtl">

  <!-- ─── Page Header ─── -->
  <div class="sc-admin-page-header">
    <div class="sc-admin-page-header__inner">
      <h1 class="sc-admin-page-title">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.78 19.78 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.78 19.78 0 0 1 1.61 3.18 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 5.99 5.98l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 17"/>
        </svg>
        درخواست‌های مشتریان
      </h1>
      <p class="sc-admin-page-desc">لیست درخواست‌های دریافت‌شده از ماشین حساب. روی هر ردیف کلیک کنید تا جزئیات را ببینید.</p>
    </div>
    <div class="sc-admin-page-header__actions">
      <button id="sca-reload-leads" class="sca-btn sca-btn--ghost" type="button" title="بارگذاری مجدد">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
        </svg>
        بارگذاری مجدد
      </button>
      <button id="sca-delete-all-leads" class="sca-btn sca-btn--danger" type="button">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
          <path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
        </svg>
        حذف همه
      </button>
    </div>
  </div>

  <div id="sca-toast-area" class="sca-toast-area" aria-live="polite"></div>

  <!-- ─── Stats Bar ─── -->
  <div class="sca-stats-bar">
    <div class="sca-stat-card">
      <div class="sca-stat-card__icon sca-stat-card__icon--blue">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      </div>
      <div class="sca-stat-card__body">
        <span class="sca-stat-card__label">کل درخواست‌ها</span>
        <span class="sca-stat-card__value" id="sca-leads-count">
          <?php echo number_format_i18n( $total_count ); ?>
        </span>
      </div>
    </div>

    <div class="sca-stat-card">
      <div class="sca-stat-card__icon sca-stat-card__icon--green">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      </div>
      <div class="sca-stat-card__body">
        <span class="sca-stat-card__label">جدید (منتظر تماس)</span>
        <span class="sca-stat-card__value sca-stat-card__value--accent">
          <?php echo number_format_i18n( $new_count ); ?>
        </span>
      </div>
    </div>

    <div class="sca-stat-card">
      <div class="sca-stat-card__icon sca-stat-card__icon--purple">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="1" x2="12" y2="23"/>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
      </div>
      <div class="sca-stat-card__body">
        <span class="sca-stat-card__label">مجموع قیمت (تومان)</span>
        <span class="sca-stat-card__value" id="sca-leads-total">—</span>
      </div>
    </div>
  </div>

  <!-- ─── Filter Tabs ─── -->
  <div class="sca-filters-wrap" id="sca-lead-filters">
    <button type="button"
            class="sca-filter-btn sca-filter-btn--active"
            data-status-filter="">
      همه
    </button>
    <button type="button"
            class="sca-filter-btn"
            data-status-filter="new">
      <span class="sca-dot sca-dot--new"></span>
      جدید
      <?php if ( $new_count ) : ?>
        <span class="sca-badge sca-badge--new sca-badge--sm"><?php echo number_format_i18n( $new_count ); ?></span>
      <?php endif; ?>
    </button>
    <button type="button"
            class="sca-filter-btn"
            data-status-filter="contacted">
      <span class="sca-dot sca-dot--contacted"></span>
      تماس گرفته شد
    </button>
    <button type="button"
            class="sca-filter-btn"
            data-status-filter="closed">
      <span class="sca-dot sca-dot--closed"></span>
      بسته شده
    </button>
  </div>

  <!-- ─── Leads Table ─── -->
  <div class="sca-card sca-card--table" id="sc-leads-app">
    <div class="sca-table-wrap">
      <table class="sca-table" id="sca-leads-table">
        <thead>
          <tr>
            <th>#</th>
            <th>نام</th>
            <th>موبایل</th>
            <th>قیمت تقریبی</th>
            <th>وضعیت</th>
            <th>تاریخ ثبت</th>
          </tr>
        </thead>
        <tbody id="sca-leads-body">
          <tr>
            <td colspan="6">
              <div class="sca-loader">
                <span class="sca-spinner"></span>
                <span>در حال بارگذاری...</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="sca-pagination-wrap">
      <div id="sca-lead-pagination" class="sca-pagination"></div>
    </div>
  </div>

  <!-- ─── Lead Detail Modal ─── -->
  <div id="sca-modal-overlay"
       class="sca-modal-overlay"
       role="dialog"
       aria-modal="true"
       aria-labelledby="sca-modal-title"
       style="display:none">
    <div class="sca-modal">
      <div class="sca-modal__head">
        <h3 id="sca-modal-title">جزئیات درخواست</h3>
        <button type="button" class="sca-modal__close" aria-label="بستن مودال">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="sca-modal__body" id="sca-modal-body">
        <!-- JS این بخش را پر می‌کند -->
      </div>
    </div>
  </div>

</div><!-- /#sc-admin-wrap -->