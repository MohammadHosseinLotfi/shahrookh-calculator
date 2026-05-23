<?php
/**
 * Plugin Name: ماشین حساب شاهرخ
 * Plugin URI:  https://shahrokhbusiness.ir
 * Description: ماشین حساب تعاملی برای محاسبه تقریبی هزینه طراحی سایت
 * Version:     1.0.0
 * Author:      Shahrokh
 * Text Domain: shahrokh-calculator
 * Domain Path: /languages
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// ثابت‌های افزونه
define( 'SC_VERSION',     '1.0.0' );
define( 'SC_DB_VERSION',  '1.0.0' );
define( 'SC_FILE',        __FILE__ );
define( 'SC_PATH',        plugin_dir_path( __FILE__ ) );
define( 'SC_URL',         plugin_dir_url( __FILE__ ) );
define( 'SC_BASENAME',    plugin_basename( __FILE__ ) );

// بارگذاری کلاس‌ها
require_once SC_PATH . 'includes/class-db.php';
require_once SC_PATH . 'includes/class-ajax.php';
require_once SC_PATH . 'includes/class-frontend.php';
require_once SC_PATH . 'includes/class-admin.php';

// Activation Hook
register_activation_hook( SC_FILE, [ 'SC_DB', 'install' ] );

// راه‌اندازی افزونه
add_action( 'plugins_loaded', 'sc_init' );

function sc_init() {
    // ادمین
    if ( is_admin() ) {
        new SC_Admin();
    }

    // AJAX (ادمین + فرانت)
    new SC_Ajax();

    // فرانت‌اند
    new SC_Frontend();
}

// لینک تنظیمات در لیست افزونه‌ها
add_filter( 'plugin_action_links_' . SC_BASENAME, 'sc_action_links' );

function sc_action_links( $links ) {
    $settings_link = '<a href="' . admin_url( 'admin.php?page=sc-settings' ) . '">تنظیمات</a>';
    array_unshift( $links, $settings_link );
    return $links;
}