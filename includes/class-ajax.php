<?php
if ( ! defined( 'ABSPATH' ) ) exit;

class SC_Ajax {

    public function __construct() {
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
            'sc_delete_all_leads',
            'sc_save_settings',
        ];

        foreach ( $admin_actions as $action ) {
            add_action( 'wp_ajax_' . $action, [ $this, $action ] );
        }

        // فرانت — هم لاگین هم مهمان
        add_action( 'wp_ajax_sc_submit_lead',        [ $this, 'sc_submit_lead' ] );
        add_action( 'wp_ajax_nopriv_sc_submit_lead', [ $this, 'sc_submit_lead' ] );
    }

    // ─── Helper ───────────────────────────────────────────────────
    private function verify_admin( $nonce_action = 'sc_admin_nonce' ) {
        if ( ! check_ajax_referer( $nonce_action, 'nonce', false ) ) {
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

    // ─── مراحل ───────────────────────────────────────────────────
    public function sc_save_step() {
        $this->verify_admin();
        $data = $_POST;
        if ( empty( $data['title'] ) ) {
            $this->fail( 'عنوان مرحله الزامی است' );
        }
        $id    = SC_DB::save_step( $data );
        $step  = SC_DB::get_step( $id );
        $this->ok( [ 'step' => $step ] );
    }

    public function sc_delete_step() {
        $this->verify_admin();
        $id = (int) ( $_POST['id'] ?? 0 );
        if ( ! $id ) $this->fail( 'شناسه نامعتبر' );
        SC_DB::delete_step( $id );
        $this->ok();
    }

    public function sc_reorder_steps() {
        $this->verify_admin();
        $ids = array_map( 'intval', $_POST['ids'] ?? [] );
        if ( empty( $ids ) ) $this->fail( 'داده‌ای ارسال نشد' );
        SC_DB::reorder_steps( $ids );
        $this->ok();
    }

    // ─── گزینه‌ها ─────────────────────────────────────────────────
    public function sc_save_option() {
        $this->verify_admin();
        $data = $_POST;
        if ( empty( $data['label'] ) || empty( $data['step_id'] ) ) {
            $this->fail( 'برچسب و مرحله الزامی است' );
        }
        $id     = SC_DB::save_option( $data );
        $option = SC_DB::get_options( (int) $data['step_id'] );
        $this->ok( [ 'option_id' => $id, 'options' => $option ] );
    }

    public function sc_delete_option() {
        $this->verify_admin();
        $id = (int) ( $_POST['id'] ?? 0 );
        if ( ! $id ) $this->fail( 'شناسه نامعتبر' );
        SC_DB::delete_option( $id );
        $this->ok();
    }

    public function sc_reorder_options() {
        $this->verify_admin();
        $ids = array_map( 'intval', $_POST['ids'] ?? [] );
        if ( empty( $ids ) ) $this->fail( 'داده‌ای ارسال نشد' );
        SC_DB::reorder_options( $ids );
        $this->ok();
    }

    // ─── لیدها ───────────────────────────────────────────────────
    public function sc_get_leads() {
        $this->verify_admin();
        $args = [
            'status' => sanitize_text_field( $_POST['status'] ?? '' ),
            'limit'  => (int) ( $_POST['limit']  ?? 20 ),
            'offset' => (int) ( $_POST['offset'] ?? 0 ),
        ];
        $result = SC_DB::get_leads( $args );
        $this->ok( $result );
    }

    public function sc_get_lead() {
        $this->verify_admin();
        $id   = (int) ( $_POST['id'] ?? 0 );
        $lead = SC_DB::get_lead( $id );
        if ( ! $lead ) $this->fail( 'درخواست یافت نشد', 404 );
        // parse selections JSON
        $lead->selections = json_decode( $lead->selections, true );
        $this->ok( [ 'lead' => $lead ] );
    }

    public function sc_update_lead() {
        $this->verify_admin();
        $id   = (int) ( $_POST['id'] ?? 0 );
        $data = $_POST;
        if ( ! $id ) $this->fail( 'شناسه نامعتبر' );
        SC_DB::update_lead( $id, $data );
        $new_count = SC_DB::count_new_leads();
        $this->ok( [ 'new_count' => $new_count ] );
    }

    public function sc_delete_all_leads() {
        $this->verify_admin();
        SC_DB::delete_all_leads();
        $this->ok();
    }

    // ─── تنظیمات ─────────────────────────────────────────────────
    public function sc_save_settings() {
        $this->verify_admin();
        $current  = SC_DB::get_settings();
        $new_data = [
            'primary_color'       => sanitize_hex_color( $_POST['primary_color']    ?? $current['primary_color'] ),
            'accent_color'        => sanitize_hex_color( $_POST['accent_color']     ?? $current['accent_color'] ),
            'calculator_title'    => sanitize_text_field( $_POST['calculator_title']    ?? $current['calculator_title'] ),
            'calculator_subtitle' => sanitize_text_field( $_POST['calculator_subtitle'] ?? $current['calculator_subtitle'] ),
            'submit_button_text'  => sanitize_text_field( $_POST['submit_button_text']  ?? $current['submit_button_text'] ),
            'success_message'     => sanitize_textarea_field( $_POST['success_message'] ?? $current['success_message'] ),
            'delete_on_uninstall' => ! empty( $_POST['delete_on_uninstall'] ),
        ];
        update_option( 'sc_settings', $new_data, false );
        $this->ok( [ 'message' => 'تنظیمات ذخیره شد' ] );
    }

    // ─── ثبت لید (فرانت) ─────────────────────────────────────────
    public function sc_submit_lead() {
        if ( ! check_ajax_referer( 'sc_frontend_nonce', 'nonce', false ) ) {
            $this->fail( 'خطای امنیتی', 403 );
        }

        $name  = sanitize_text_field( $_POST['name']  ?? '' );
        $phone = sanitize_text_field( $_POST['phone'] ?? '' );
        $ids   = array_map( 'intval', $_POST['option_ids'] ?? [] );

        if ( empty( $name ) )  $this->fail( 'نام الزامی است' );
        if ( empty( $phone ) ) $this->fail( 'شماره تماس الزامی است' );
        if ( empty( $ids ) )   $this->fail( 'هیچ گزینه‌ای انتخاب نشده' );

        // اعتبارسنجی شماره ایرانی
        if ( ! preg_match( '/^(09)[0-9]{9}$/', $phone ) ) {
            $this->fail( 'شماره موبایل معتبر نیست' );
        }

        // محاسبه قیمت سمت سرور
        $total_price = SC_DB::calculate_price( $ids );

        // ساخت خلاصه انتخاب‌ها برای ذخیره
        global $wpdb;
        $id_list    = implode( ',', $ids );
        $options    = $wpdb->get_results(
            "SELECT o.id, o.label, o.price, s.title as step_title
             FROM {$wpdb->prefix}sc_options o
             LEFT JOIN {$wpdb->prefix}sc_steps s ON s.id = o.step_id
             WHERE o.id IN ($id_list)"
        );

        $lead_id = SC_DB::save_lead( [
            'name'        => $name,
            'phone'       => $phone,
            'selections'  => $options,
            'total_price' => $total_price,
        ] );

        $settings = SC_DB::get_settings();
        $this->ok( [
            'message'     => $settings['success_message'],
            'total_price' => $total_price,
            'lead_id'     => $lead_id,
        ] );
    }
}