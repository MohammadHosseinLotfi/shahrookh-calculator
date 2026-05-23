<?php
/**
 * Uninstall Shahrokh Calculator
 * این فایل فقط از طریق وردپرس اجرا می‌شود
 */

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
    exit;
}

// بررسی تنظیم حذف داده‌ها
$settings = get_option( 'sc_settings', [] );
$delete_on_uninstall = isset( $settings['delete_on_uninstall'] ) ? (bool) $settings['delete_on_uninstall'] : true;

if ( ! $delete_on_uninstall ) {
    return;
}

global $wpdb;

// حذف جداول
$wpdb->query( "DROP TABLE IF EXISTS {$wpdb->prefix}sc_leads" );
$wpdb->query( "DROP TABLE IF EXISTS {$wpdb->prefix}sc_options" );
$wpdb->query( "DROP TABLE IF EXISTS {$wpdb->prefix}sc_steps" );

// حذف تنظیمات از wp_options
delete_option( 'sc_settings' );
delete_option( 'sc_db_version' );