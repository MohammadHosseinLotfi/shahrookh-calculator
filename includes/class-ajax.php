<?php
/**
 * Shahrokh Calculator – AJAX Handler
 * File: includes/class-ajax.php
 *
 * تمام اکشن‌های admin-ajax.php اینجا ثبت و اجرا می‌شوند.
 * نام‌گذاری اکشن‌ها دقیقاً با admin.js هماهنگ است.
 */

if ( ! defined( 'ABSPATH' ) ) exit;

class SC_Ajax {

    public function __construct() {

        // ─── اکشن‌های ادمین (فقط لاگین) ─────────────────────────
        $admin_actions = [
            'sc_save_step',
            'sc_delete_step',
            'sc_reorder_steps',
            'sc_save_option',
            'sc_delete_option',
            'sc_reorder_options',
            'sc_get_leads',
            'sc_get_lead',
            'sc_update_lead',
            'sc_delete_lead',
            'sc_delete_all_leads',
            'sc_save_settings',
        ];

        foreach ( $admin_actions as $action ) {
            add_action( 'wp_ajax_' . $action, [ $this, $action ] );
        }

        // ─── اکشن فرانت (لاگین + مهمان) ──────────────────────────
        add_action( 'wp_ajax_sc_submit_lead',        [ $this, 'sc_submit_lead' ] );
        add_action( 'wp_ajax_nopriv_sc_submit_lead', [ $this, 'sc_submit_lead' ] );
    }

    // ══════════════════════════════════════════════════════════════
    // Helper – بررسی امنیت و دسترسی ادمین
    // ══════════════════════════════════════════════════════════════

    private function verify_admin() {
        if ( ! check_ajax_referer( 'sc_admin_nonce', 'nonce', false ) ) {
            wp_send_json_error( [ 'message' => 'خطای امنیتی' ], 403 );
        }
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_send_json_error( [ 'message' => 'دسترسی غیرمجاز' ], 403 );
        }
    }

    private function ok( $data = [] ) {
        wp_send_json_success( $data );
    }

    private function fail( $message, $code = 400 ) {
        wp_send_json_error( [ 'message' => $message ], $code );
    }

    // ══════════════════════════════════════════════════════════════
    // مراحل (Steps)
    // ══════════════════════════════════════════════════════════════

    /**
     * ذخیره مرحله (ایجاد یا ویرایش)
     * ورودی: id?, title, description?, type, is_active
     */
    public function sc_save_step() {
        $this->verify_admin();

        $data = [
            'id'          => isset( $_POST['id'] ) ? absint( $_POST['id'] ) : 0,
            'title'       => sanitize_text_field( wp_unslash( $_POST['title'] ?? '' ) ),
            'description' => sanitize_textarea_field( wp_unslash( $_POST['description'] ?? '' ) ),
            'type'        => sanitize_text_field( $_POST['type'] ?? 'radio' ),
            'is_active'   => isset( $_POST['is_active'] ) ? (int) $_POST['is_active'] : 1,
        ];

        if ( empty( $data['title'] ) ) {
            $this->fail( 'عنوان مرحله الزامی است.' );
        }

        $id   = SC_DB::save_step( $data );
        $step = SC_DB::get_step( $id );

        // گزینه‌های مرحله را هم برمی‌گردانیم
        $step->options = SC_DB::get_options( $id );

        $this->ok( [ 'step' => $step ] );
    }

    /**
     * حذف مرحله + تمام گزینه‌هایش
     * ورودی: id
     */
    public function sc_delete_step() {
        $this->verify_admin();

        $id = absint( $_POST['id'] ?? 0 );
        if ( ! $id ) {
            $this->fail( 'شناسه نامعتبر است.' );
        }

        SC_DB::delete_step( $id );

        $this->ok( [ 'deleted_id' => $id ] );
    }

    /**
     * تغییر ترتیب مراحل (drag & drop)
     * ورودی: ids[] – آرایه شناسه‌ها به ترتیب جدید
     */
    public function sc_reorder_steps() {
        $this->verify_admin();

        $ids = isset( $_POST['ids'] ) && is_array( $_POST['ids'] )
            ? array_map( 'absint', $_POST['ids'] )
            : [];

        if ( empty( $ids ) ) {
            $this->fail( 'داده‌ای برای مرتب‌سازی ارسال نشده.' );
        }

        SC_DB::reorder_steps( $ids );

        $this->ok();
    }

    // ══════════════════════════════════════════════════════════════
    // گزینه‌ها (Options)
    // ══════════════════════════════════════════════════════════════

    /**
     * ذخیره گزینه (ایجاد یا ویرایش)
     * ورودی: id?, step_id, label, price?, icon_svg?, is_active
     */
    public function sc_save_option() {
        $this->verify_admin();

        $data = [
            'id'       => isset( $_POST['id'] ) ? absint( $_POST['id'] ) : 0,
            'step_id'  => absint( $_POST['step_id'] ?? 0 ),
            'label'    => sanitize_text_field( wp_unslash( $_POST['label'] ?? '' ) ),
            'price'    => absint( $_POST['price'] ?? 0 ),
            'icon_svg' => wp_kses(
                wp_unslash( $_POST['icon_svg'] ?? '' ),
                [
                    'svg'    => [ 'xmlns' => [], 'viewBox' => [], 'fill' => [], 'width' => [], 'height' => [], 'stroke' => [], 'stroke-width' => [], 'class' => [] ],
                    'path'   => [ 'd' => [], 'fill' => [], 'stroke' => [], 'stroke-width' => [] ],
                    'circle' => [ 'cx' => [], 'cy' => [], 'r' => [], 'fill' => [] ],
                    'rect'   => [ 'x' => [], 'y' => [], 'width' => [], 'height' => [], 'rx' => [] ],
                    'line'   => [ 'x1' => [], 'y1' => [], 'x2' => [], 'y2' => [] ],
                    'polyline' => [ 'points' => [] ],
                    'polygon'  => [ 'points' => [] ],
                ]
            ),
            'is_active' => isset( $_POST['is_active'] ) ? (int) $_POST['is_active'] : 1,
        ];

        if ( empty( $data['label'] ) ) {
            $this->fail( 'عنوان گزینه الزامی است.' );
        }
        if ( ! $data['step_id'] ) {
            $this->fail( 'مرحله مشخص نشده است.' );
        }

        $option_id = SC_DB::save_option( $data );

        // لیست کامل گزینه‌های این مرحله را برمی‌گردانیم
        $options = SC_DB::get_options( $data['step_id'] );

        $this->ok( [
            'option_id' => $option_id,
            'options'   => $options,
        ] );
    }

    /**
     * حذف گزینه
     * ورودی: id
     */
    public function sc_delete_option() {
        $this->verify_admin();

        $id = absint( $_POST['id'] ?? 0 );
        if ( ! $id ) {
            $this->fail( 'شناسه نامعتبر است.' );
        }

        SC_DB::delete_option( $id );

        $this->ok( [ 'deleted_id' => $id ] );
    }

    /**
     * تغییر ترتیب گزینه‌ها (drag & drop)
     * ورودی: ids[] – آرایه شناسه‌ها به ترتیب جدید
     */
    public function sc_reorder_options() {
        $this->verify_admin();

        $ids = isset( $_POST['ids'] ) && is_array( $_POST['ids'] )
            ? array_map( 'absint', $_POST['ids'] )
            : [];

        if ( empty( $ids ) ) {
            $this->fail( 'داده‌ای برای مرتب‌سازی ارسال نشده.' );
        }

        SC_DB::reorder_options( $ids );

        $this->ok();
    }

    // ══════════════════════════════════════════════════════════════
    // درخواست‌ها / لیدها (Leads)
    // ══════════════════════════════════════════════════════════════

    /**
     * دریافت لیست درخواست‌ها با صفحه‌بندی و فیلتر
     * ورودی: status?, limit?, offset?
     */
    public function sc_get_leads() {
        $this->verify_admin();

        $status = sanitize_text_field( $_POST['status'] ?? '' );
        $limit  = min( 100, max( 5, absint( $_POST['limit']  ?? 20 ) ) );
        $offset = max( 0, absint( $_POST['offset'] ?? 0 ) );

        // فقط مقادیر مجاز
        $allowed_statuses = [ 'new', 'contacted', 'closed' ];
        if ( $status && ! in_array( $status, $allowed_statuses, true ) ) {
            $status = '';
        }

        $result = SC_DB::get_leads( [
            'status' => $status,
            'limit'  => $limit,
            'offset' => $offset,
        ] );

        $this->ok( $result );
    }

    /**
     * دریافت جزئیات یک درخواست + دکد انتخاب‌های JSON
     * ورودی: id
     */
    public function sc_get_lead() {
        $this->verify_admin();

        $id   = absint( $_POST['id'] ?? 0 );
        $lead = SC_DB::get_lead( $id );

        if ( ! $lead ) {
            $this->fail( 'درخواست یافت نشد.', 404 );
        }

        // دکد کردن انتخاب‌های JSON
        if ( ! empty( $lead->selections ) && is_string( $lead->selections ) ) {
            $decoded = json_decode( $lead->selections, true );
            $lead->selections = is_array( $decoded ) ? $decoded : [];
        } else {
            $lead->selections = [];
        }

        $this->ok( [ 'lead' => $lead ] );
    }

    /**
     * بروزرسانی وضعیت و یادداشت ادمین برای یک درخواست
     * ورودی: id, status?, admin_notes?
     */
    public function sc_update_lead() {
        $this->verify_admin();

        $id = absint( $_POST['id'] ?? 0 );
        if ( ! $id ) {
            $this->fail( 'شناسه نامعتبر است.' );
        }

        $data = [];

        if ( isset( $_POST['status'] ) ) {
            $status = sanitize_text_field( $_POST['status'] );
            if ( ! in_array( $status, [ 'new', 'contacted', 'closed' ], true ) ) {
                $this->fail( 'وضعیت نامعتبر است.' );
            }
            $data['status'] = $status;
        }

        if ( isset( $_POST['admin_notes'] ) ) {
            $data['admin_notes'] = sanitize_textarea_field( wp_unslash( $_POST['admin_notes'] ) );
        }

        if ( empty( $data ) ) {
            $this->fail( 'داده‌ای برای بروزرسانی ارسال نشده.' );
        }

        SC_DB::update_lead( $id, $data );

        $lead = SC_DB::get_lead( $id );
        $this->ok( [ 'lead' => $lead ] );
    }

    /**
     * حذف یک درخواست
     * ورودی: id
     */
    public function sc_delete_lead() {
        $this->verify_admin();

        $id = absint( $_POST['id'] ?? 0 );
        if ( ! $id ) {
            $this->fail( 'شناسه نامعتبر است.' );
        }

        SC_DB::delete_lead( $id );

        $this->ok( [ 'deleted_id' => $id ] );
    }

    /**
     * حذف همه درخواست‌ها
     * ورودی: confirm = "yes" (تأیید اجباری)
     */
    public function sc_delete_all_leads() {
        $this->verify_admin();

        $confirm = sanitize_text_field( $_POST['confirm'] ?? '' );
        if ( $confirm !== 'yes' ) {
            $this->fail( 'تأیید حذف ارسال نشده است.' );
        }

        SC_DB::delete_all_leads();

        $this->ok( [ 'message' => 'همه درخواست‌ها حذف شدند.' ] );
    }

    // ══════════════════════════════════════════════════════════════
    // تنظیمات (Settings)
    // ══════════════════════════════════════════════════════════════

    /**
     * ذخیره تنظیمات افزونه
     * ورودی: primary_color, accent_color, calculator_title, calculator_subtitle,
     *        submit_button_text, success_message, delete_on_uninstall
     */
    public function sc_save_settings() {
        $this->verify_admin();

        if ( empty( $_POST['settings'] ) || ! is_array( $_POST['settings'] ) ) {
            $this->fail( 'داده تنظیمات ارسال نشده.' );
        }

        $raw = wp_unslash( $_POST['settings'] );

        $sanitized = [];

        // رنگ اصلی
        if ( isset( $raw['primary_color'] ) ) {
            $sanitized['primary_color'] = sanitize_hex_color( $raw['primary_color'] ) ?: '#1e40af';
        }

        // رنگ تأکیدی
        if ( isset( $raw['accent_color'] ) ) {
            $sanitized['accent_color'] = sanitize_hex_color( $raw['accent_color'] ) ?: '#16a34a';
        }

        // فیلدهای متنی ساده
        $text_fields = [ 'calculator_title', 'submit_button_text' ];
        foreach ( $text_fields as $field ) {
            if ( isset( $raw[ $field ] ) ) {
                $sanitized[ $field ] = sanitize_text_field( $raw[ $field ] );
            }
        }

        // فیلدهای textarea
        $textarea_fields = [ 'calculator_subtitle', 'success_message' ];
        foreach ( $textarea_fields as $field ) {
            if ( isset( $raw[ $field ] ) ) {
                $sanitized[ $field ] = sanitize_textarea_field( $raw[ $field ] );
            }
        }

        // بولین
        if ( isset( $raw['delete_on_uninstall'] ) ) {
            $sanitized['delete_on_uninstall'] = (bool) $raw['delete_on_uninstall'];
        }

        if ( empty( $sanitized ) ) {
            $this->fail( 'هیچ داده معتبری دریافت نشد.' );
        }

        // ادغام با تنظیمات فعلی
        $current = SC_DB::get_settings();
        $merged  = array_merge( $current, $sanitized );
        update_option( 'sc_settings', $merged, false );

        $this->ok( [ 'settings' => $merged ] );
    }

    // ══════════════════════════════════════════════════════════════
    // فرانت‌اند – ثبت درخواست (بدون نیاز به لاگین)
    // ══════════════════════════════════════════════════════════════

    /**
     * ثبت درخواست از سمت کاربر
     * ورودی: nonce (sc_frontend_nonce), name, phone, selections[], total_price
     */
    public function sc_submit_lead() {
        if ( ! check_ajax_referer( 'sc_frontend_nonce', 'nonce', false ) ) {
            $this->fail( 'خطای امنیتی.', 403 );
        }

        $name  = sanitize_text_field( wp_unslash( $_POST['name']  ?? '' ) );
        $phone = sanitize_text_field( wp_unslash( $_POST['phone'] ?? '' ) );

        if ( empty( $name ) ) {
            $this->fail( 'نام الزامی است.' );
        }
        if ( empty( $phone ) ) {
            $this->fail( 'شماره تماس الزامی است.' );
        }

        // اعتبارسنجی شماره موبایل ایرانی
        $clean_phone = preg_replace( '/\D/', '', $phone );
        // تبدیل ۰۹ به 09 (اعداد فارسی)
        $clean_phone = strtr( $clean_phone, '۰۱۲۳۴۵۶۷۸۹', '0123456789' );

        if ( ! preg_match( '/^(09|9)[0-9]{9}$/', $clean_phone ) ) {
            $this->fail( 'شماره موبایل معتبر نیست.' );
        }

        // پردازش انتخاب‌ها
        $raw_selections = $_POST['selections'] ?? [];
        $selections     = [];
        $total_price    = 0;

        if ( is_array( $raw_selections ) ) {
            foreach ( $raw_selections as $step_id => $option_ids ) {
                $step_id    = absint( $step_id );
                $option_ids = is_array( $option_ids )
                    ? array_map( 'absint', $option_ids )
                    : [ absint( $option_ids ) ];
                $option_ids = array_filter( $option_ids );

                if ( ! $step_id || empty( $option_ids ) ) continue;

                // دریافت عناوین و قیمت‌ها از دیتابیس (اعتماد نمی‌کنیم به قیمت فرانت)
                $step = SC_DB::get_step( $step_id );
                if ( ! $step ) continue;

                $step_label   = $step->title;
                $option_items = [];

                foreach ( $option_ids as $oid ) {
                    $opts = SC_DB::get_options( $step_id );
                    foreach ( $opts as $opt ) {
                        if ( (int) $opt->id === $oid ) {
                            $option_items[] = [
                                'id'    => $oid,
                                'label' => $opt->label,
                                'price' => (int) $opt->price,
                            ];
                            $total_price += (int) $opt->price;
                            break;
                        }
                    }
                }

                if ( ! empty( $option_items ) ) {
                    $selections[] = [
                        'step_id'    => $step_id,
                        'step_label' => $step_label,
                        'options'    => $option_items,
                    ];
                }
            }
        }

        $lead_id = SC_DB::save_lead( [
            'name'        => $name,
            'phone'       => $clean_phone,
            'selections'  => $selections,
            'total_price' => $total_price,
        ] );

        if ( ! $lead_id ) {
            $this->fail( 'خطا در ثبت درخواست. لطفاً دوباره تلاش کنید.' );
        }

        // اطلاع‌رسانی ایمیل به ادمین (اختیاری)
        $settings = SC_DB::get_settings();
        if ( ! empty( $settings['notify_admin'] ) ) {
            $this->notify_admin_email( $lead_id, $name, $clean_phone, $total_price );
        }

        $success_msg = ! empty( $settings['success_message'] )
            ? $settings['success_message']
            : 'درخواست شما با موفقیت ثبت شد. کارشناسان ما به زودی با شما تماس می‌گیرند.';

        $this->ok( [
            'lead_id' => $lead_id,
            'message' => $success_msg,
        ] );
    }

    // ──────────────────────────────────────────────────────────────
    // ارسال ایمیل اطلاع‌رسانی به ادمین
    // ──────────────────────────────────────────────────────────────

    private function notify_admin_email( $lead_id, $name, $phone, $total_price ) {
        $to      = get_option( 'admin_email' );
        $subject = sprintf( '[%s] درخواست جدید از %s', get_bloginfo( 'name' ), $name );
        $message = sprintf(
            "درخواست جدیدی در ماشین حساب ثبت شد:\n\nنام: %s\nتلفن: %s\nمبلغ تقریبی: %s تومان\n\nمشاهده در ادمین: %s",
            $name,
            $phone,
            number_format( $total_price ),
            admin_url( 'admin.php?page=sc-leads' )
        );

        wp_mail( $to, $subject, $message );
    }
}
