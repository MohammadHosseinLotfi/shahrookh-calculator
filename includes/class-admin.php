<?php
if ( ! defined( 'ABSPATH' ) ) exit;

class SC_Admin {

    public function __construct() {
        add_action( 'admin_menu',            [ $this, 'register_menu' ] );
        add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_assets' ] );
    }

    // ─── منو ──────────────────────────────────────────────────────
    public function register_menu() {
        $new_leads = SC_DB::count_new_leads();
        $badge     = $new_leads ? ' <span class="awaiting-mod">' . $new_leads . '</span>' : '';

        add_menu_page(
            'ماشین حساب شاهرخ',
            'ماشین حساب' . $badge,
            'manage_options',
            'sc-leads',
            [ $this, 'page_leads' ],
            'dashicons-calculator',
            30
        );

        add_submenu_page(
            'sc-leads',
            'درخواست‌ها',
            'درخواست‌ها' . $badge,
            'manage_options',
            'sc-leads',
            [ $this, 'page_leads' ]
        );

        add_submenu_page(
            'sc-leads',
            'مراحل و گزینه‌ها',
            'مراحل و گزینه‌ها',
            'manage_options',
            'sc-steps',
            [ $this, 'page_steps' ]
        );

        add_submenu_page(
            'sc-leads',
            'تنظیمات',
            'تنظیمات',
            'manage_options',
            'sc-settings',
            [ $this, 'page_settings' ]
        );
    }

    // ─── لود assets فقط در صفحات افزونه ─────────────────────────
    public function enqueue_assets( $hook ) {
        $plugin_pages = [
            'toplevel_page_sc-leads',
            'ماشین-حساب_page_sc-steps',
            'ماشین-حساب_page_sc-settings',
        ];

        // hook وردپرس برای زیرمنوها فارسی‌سازی می‌شه — fallback با strpos
        $is_plugin_page = in_array( $hook, $plugin_pages )
            || strpos( $hook, 'sc-leads' )    !== false
            || strpos( $hook, 'sc-steps' )    !== false
            || strpos( $hook, 'sc-settings' ) !== false;

        if ( ! $is_plugin_page ) return;

        wp_enqueue_style(
            'sc-admin',
            SC_URL . 'admin/admin.css',
            [],
            SC_VERSION
        );

        wp_enqueue_script(
            'sc-admin',
            SC_URL . 'admin/admin.js',
            [],
            SC_VERSION,
            true
        );

        // داده‌های JS
        $steps = SC_DB::get_steps();
        foreach ( $steps as $step ) {
            $step->options = SC_DB::get_options( $step->id );
        }

        wp_localize_script( 'sc-admin', 'SC_Admin', [
            'ajax_url'   => admin_url( 'admin-ajax.php' ),
            'nonce'      => wp_create_nonce( 'sc_admin_nonce' ),
            'steps'      => $steps,
            'settings'   => SC_DB::get_settings(),
            'strings'    => [
                'confirm_delete_step'   => 'آیا از حذف این مرحله مطمئن هستید؟ تمام گزینه‌های آن نیز حذف می‌شود.',
                'confirm_delete_option' => 'آیا از حذف این گزینه مطمئن هستید؟',
                'confirm_delete_leads'  => 'آیا از حذف تمام درخواست‌ها مطمئن هستید؟ این عمل قابل بازگشت نیست.',
                'saved'                 => 'ذخیره شد',
                'error'                 => 'خطایی رخ داد',
                'loading'               => 'در حال بارگذاری...',
            ],
        ] );
    }

    // ─── رندر صفحات ──────────────────────────────────────────────
    public function page_leads() {
        require_once SC_PATH . 'admin/views/page-leads.php';
    }

    public function page_steps() {
        require_once SC_PATH . 'admin/views/page-steps.php';
    }

    public function page_settings() {
        require_once SC_PATH . 'admin/views/page-settings.php';
    }
}