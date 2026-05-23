<?php
if ( ! defined( 'ABSPATH' ) ) exit;

class SC_DB {

    // ─── نصب جداول ───────────────────────────────────────────────
    public static function install() {
        global $wpdb;
        $charset = $wpdb->get_charset_collate();
        require_once ABSPATH . 'wp-admin/includes/upgrade.php';

        // جدول مراحل
        $wpdb->query( "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}sc_steps (
            id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
            title       VARCHAR(255) NOT NULL DEFAULT '',
            description TEXT,
            type        ENUM('radio','checkbox') NOT NULL DEFAULT 'radio',
            step_order  SMALLINT UNSIGNED NOT NULL DEFAULT 0,
            is_active   TINYINT(1) NOT NULL DEFAULT 1,
            PRIMARY KEY (id)
        ) $charset;" );

        // جدول گزینه‌ها
        $wpdb->query( "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}sc_options (
            id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
            step_id      INT UNSIGNED NOT NULL,
            label        VARCHAR(255) NOT NULL DEFAULT '',
            price        BIGINT UNSIGNED NOT NULL DEFAULT 0,
            icon_svg     TEXT,
            option_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
            is_active    TINYINT(1) NOT NULL DEFAULT 1,
            PRIMARY KEY (id),
            KEY step_id (step_id)
        ) $charset;" );

        // جدول لیدها
        $wpdb->query( "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}sc_leads (
            id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
            name        VARCHAR(100) NOT NULL DEFAULT '',
            phone       VARCHAR(20)  NOT NULL DEFAULT '',
            selections  LONGTEXT,
            total_price BIGINT UNSIGNED NOT NULL DEFAULT 0,
            status      ENUM('new','contacted','closed') NOT NULL DEFAULT 'new',
            admin_notes TEXT,
            created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY status (status),
            KEY created_at (created_at)
        ) $charset;" );

        update_option( 'sc_db_version', SC_DB_VERSION );

        // تنظیمات پیش‌فرض اگر وجود نداشته باشد
        if ( ! get_option( 'sc_settings' ) ) {
            update_option( 'sc_settings', self::default_settings(), false );
        }
    }

    // ─── تنظیمات پیش‌فرض ─────────────────────────────────────────
    public static function default_settings() {
        return [
            'primary_color'       => '#1e40af',
            'accent_color'        => '#16a34a',
            'calculator_title'    => 'محاسبه هزینه طراحی سایت',
            'calculator_subtitle' => 'با انتخاب گزینه‌های مورد نظر، هزینه تقریبی پروژه خود را محاسبه کنید',
            'submit_button_text'  => 'دریافت مشاوره رایگان',
            'success_message'     => 'درخواست شما با موفقیت ثبت شد. کارشناسان ما به زودی با شما تماس می‌گیرند.',
            'delete_on_uninstall' => true,
        ];
    }

    // ─── خواندن تنظیمات ──────────────────────────────────────────
    public static function get_settings() {
        $saved    = get_option( 'sc_settings', [] );
        $defaults = self::default_settings();
        return wp_parse_args( $saved, $defaults );
    }

    // ─── مراحل ───────────────────────────────────────────────────
    public static function get_steps( $active_only = false ) {
        global $wpdb;
        $where = $active_only ? 'WHERE is_active = 1' : '';
        return $wpdb->get_results(
            "SELECT * FROM {$wpdb->prefix}sc_steps $where ORDER BY step_order ASC, id ASC"
        );
    }

    public static function get_step( $id ) {
        global $wpdb;
        return $wpdb->get_row( $wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}sc_steps WHERE id = %d", $id
        ) );
    }

    public static function save_step( $data ) {
        global $wpdb;
        $fields = [
            'title'       => sanitize_text_field( $data['title'] ?? '' ),
            'description' => sanitize_textarea_field( $data['description'] ?? '' ),
            'type'        => in_array( $data['type'] ?? '', ['radio','checkbox'] ) ? $data['type'] : 'radio',
            'is_active'   => isset( $data['is_active'] ) ? 1 : 0,
        ];

        if ( ! empty( $data['id'] ) ) {
            $wpdb->update( "{$wpdb->prefix}sc_steps", $fields, [ 'id' => (int) $data['id'] ] );
            return (int) $data['id'];
        } else {
            $max = (int) $wpdb->get_var( "SELECT MAX(step_order) FROM {$wpdb->prefix}sc_steps" );
            $fields['step_order'] = $max + 1;
            $wpdb->insert( "{$wpdb->prefix}sc_steps", $fields );
            return $wpdb->insert_id;
        }
    }

    public static function delete_step( $id ) {
        global $wpdb;
        $id = (int) $id;
        $wpdb->delete( "{$wpdb->prefix}sc_options", [ 'step_id' => $id ] );
        return $wpdb->delete( "{$wpdb->prefix}sc_steps", [ 'id' => $id ] );
    }

    public static function reorder_steps( $ordered_ids ) {
        global $wpdb;
        foreach ( $ordered_ids as $order => $id ) {
            $wpdb->update(
                "{$wpdb->prefix}sc_steps",
                [ 'step_order' => (int) $order ],
                [ 'id'         => (int) $id ]
            );
        }
    }

    // ─── گزینه‌ها ─────────────────────────────────────────────────
    public static function get_options( $step_id, $active_only = false ) {
        global $wpdb;
        $where = $active_only ? 'AND is_active = 1' : '';
        return $wpdb->get_results( $wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}sc_options WHERE step_id = %d $where ORDER BY option_order ASC, id ASC",
            (int) $step_id
        ) );
    }

    public static function save_option( $data ) {
        global $wpdb;
        $fields = [
            'step_id'  => (int) ( $data['step_id'] ?? 0 ),
            'label'    => sanitize_text_field( $data['label'] ?? '' ),
            'price'    => absint( $data['price'] ?? 0 ),
            'icon_svg' => wp_kses( $data['icon_svg'] ?? '', [ 'svg' => ['xmlns'=>[],'viewBox'=>[],'fill'=>[],'width'=>[],'height'=>[]], 'path' => ['d'=>[],'fill'=>[],'stroke'=>[]], 'circle'=>['cx'=>[],'cy'=>[],'r'=>[]], 'rect'=>['x'=>[],'y'=>[],'width'=>[],'height'=>[]] ] ),
            'is_active'=> isset( $data['is_active'] ) ? 1 : 0,
        ];

        if ( ! empty( $data['id'] ) ) {
            $wpdb->update( "{$wpdb->prefix}sc_options", $fields, [ 'id' => (int) $data['id'] ] );
            return (int) $data['id'];
        } else {
            $max = (int) $wpdb->get_var( $wpdb->prepare(
                "SELECT MAX(option_order) FROM {$wpdb->prefix}sc_options WHERE step_id = %d",
                $fields['step_id']
            ) );
            $fields['option_order'] = $max + 1;
            $wpdb->insert( "{$wpdb->prefix}sc_options", $fields );
            return $wpdb->insert_id;
        }
    }

    public static function delete_option( $id ) {
        global $wpdb;
        return $wpdb->delete( "{$wpdb->prefix}sc_options", [ 'id' => (int) $id ] );
    }

    public static function reorder_options( $ordered_ids ) {
        global $wpdb;
        foreach ( $ordered_ids as $order => $id ) {
            $wpdb->update(
                "{$wpdb->prefix}sc_options",
                [ 'option_order' => (int) $order ],
                [ 'id'           => (int) $id ]
            );
        }
    }

    // ─── لیدها ───────────────────────────────────────────────────
    public static function save_lead( $data ) {
        global $wpdb;
        $wpdb->insert( "{$wpdb->prefix}sc_leads", [
            'name'        => sanitize_text_field( $data['name'] ?? '' ),
            'phone'       => sanitize_text_field( $data['phone'] ?? '' ),
            'selections'  => wp_json_encode( $data['selections'] ?? [] ),
            'total_price' => absint( $data['total_price'] ?? 0 ),
            'status'      => 'new',
            'created_at'  => current_time( 'mysql' ),
        ] );
        return $wpdb->insert_id;
    }

    public static function get_leads( $args = [] ) {
        global $wpdb;
        $status  = $args['status'] ?? '';
        $limit   = (int) ( $args['limit'] ?? 20 );
        $offset  = (int) ( $args['offset'] ?? 0 );
        $where   = $status ? $wpdb->prepare( "WHERE status = %s", $status ) : '';
        $results = $wpdb->get_results(
            "SELECT * FROM {$wpdb->prefix}sc_leads $where ORDER BY created_at DESC LIMIT $limit OFFSET $offset"
        );
        $total = (int) $wpdb->get_var(
            "SELECT COUNT(*) FROM {$wpdb->prefix}sc_leads $where"
        );
        return [ 'items' => $results, 'total' => $total ];
    }

    public static function get_lead( $id ) {
        global $wpdb;
        return $wpdb->get_row( $wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}sc_leads WHERE id = %d", $id
        ) );
    }

    public static function update_lead( $id, $data ) {
        global $wpdb;
        $allowed = [ 'status', 'admin_notes' ];
        $fields  = [];
        foreach ( $allowed as $key ) {
            if ( isset( $data[ $key ] ) ) {
                $fields[ $key ] = sanitize_textarea_field( $data[ $key ] );
            }
        }
        if ( isset( $fields['status'] ) && ! in_array( $fields['status'], ['new','contacted','closed'] ) ) {
            unset( $fields['status'] );
        }
        if ( empty( $fields ) ) return false;
        return $wpdb->update( "{$wpdb->prefix}sc_leads", $fields, [ 'id' => (int) $id ] );
    }

    public static function count_new_leads() {
        global $wpdb;
        return (int) $wpdb->get_var(
            "SELECT COUNT(*) FROM {$wpdb->prefix}sc_leads WHERE status = 'new'"
        );
    }

    public static function delete_all_leads() {
        global $wpdb;
        return $wpdb->query( "TRUNCATE TABLE {$wpdb->prefix}sc_leads" );
    }

    // ─── محاسبه قیمت سمت سرور ────────────────────────────────────
    public static function calculate_price( $option_ids ) {
        if ( empty( $option_ids ) ) return 0;
        global $wpdb;
        $ids         = implode( ',', array_map( 'intval', $option_ids ) );
        $total       = $wpdb->get_var(
            "SELECT SUM(price) FROM {$wpdb->prefix}sc_options WHERE id IN ($ids) AND is_active = 1"
        );
        return (int) $total;
    }
}
