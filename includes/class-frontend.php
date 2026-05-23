<?php
if ( ! defined( 'ABSPATH' ) ) exit;

class SC_Frontend {

    public function __construct() {
        add_shortcode( 'shahrokh_calculator', [ $this, 'render' ] );
        add_action( 'wp_enqueue_scripts', [ $this, 'enqueue_assets' ] );
        add_action( 'wp_head', [ $this, 'inject_css_vars' ] );
    }

    // ─── inject رنگ‌ها از تنظیمات ────────────────────────────────
    public function inject_css_vars() {
        global $post;
        if ( ! is_a( $post, 'WP_Post' ) || ! has_shortcode( $post->post_content, 'shahrokh_calculator' ) ) return;

        $s = SC_DB::get_settings();
        $p = sanitize_hex_color( $s['primary_color'] );
        $a = sanitize_hex_color( $s['accent_color'] );

        echo "<style>:root{--sc-primary:{$p};--sc-accent:{$a};}</style>\n";
    }

    // ─── enqueue فقط صفحه‌ای که shortcode دارد ───────────────────
    public function enqueue_assets() {
        global $post;
        if ( ! is_a( $post, 'WP_Post' ) || ! has_shortcode( $post->post_content, 'shahrokh_calculator' ) ) return;

        wp_enqueue_style(
            'sc-calculator',
            SC_URL . 'assets/calculator.css',
            [],
            SC_VERSION
        );

        wp_enqueue_script(
            'sc-calculator',
            SC_URL . 'assets/calculator.js',
            [],
            SC_VERSION,
            true
        );

        // مراحل و گزینه‌های فعال
        $steps = SC_DB::get_steps( true );
        foreach ( $steps as $step ) {
            $step->options = SC_DB::get_options( $step->id, true );
        }

        wp_localize_script( 'sc-calculator', 'SC_Data', [
            'ajax_url' => admin_url( 'admin-ajax.php' ),
            'nonce'    => wp_create_nonce( 'sc_frontend_nonce' ),
            'steps'    => $steps,
            'strings'  => [
                'required_name'    => 'لطفاً نام خود را وارد کنید',
                'required_phone'   => 'لطفاً شماره موبایل را وارد کنید',
                'invalid_phone'    => 'شماره موبایل معتبر نیست',
                'select_option'    => 'لطفاً یک گزینه انتخاب کنید',
                'submitting'       => 'در حال ارسال...',
                'toman'            => 'تومان',
                'price_label'      => 'هزینه تقریبی پروژه شما',
                'free'             => 'رایگان',
                'edit'             => 'ویرایش',
                'next'             => 'مرحله بعد',
                'submit'           => SC_DB::get_settings()['submit_button_text'],
            ],
        ] );
    }

    // ─── رندر shortcode ───────────────────────────────────────────
    public function render( $atts ) {
        $steps = SC_DB::get_steps( true );
        foreach ( $steps as $step ) {
            $step->options = SC_DB::get_options( $step->id, true );
        }

        if ( empty( $steps ) ) {
            return '<p class="sc-no-steps">ماشین حساب هنوز پیکربندی نشده است.</p>';
        }

        $settings = SC_DB::get_settings();

        ob_start();
        ?>
        <div class="sc-wrap" id="sc-calculator" dir="rtl">

            <!-- هدر -->
            <div class="sc-header">
                <h2 class="sc-title"><?php echo esc_html( $settings['calculator_title'] ); ?></h2>
                <p class="sc-subtitle"><?php echo esc_html( $settings['calculator_subtitle'] ); ?></p>
            </div>

            <!-- مراحل -->
            <div class="sc-steps" id="sc-steps-container">
                <?php foreach ( $steps as $index => $step ) : ?>
                <div class="sc-step<?php echo $index === 0 ? ' sc-step--active' : ''; ?>"
                     data-step-id="<?php echo esc_attr( $step->id ); ?>"
                     data-step-index="<?php echo $index; ?>"
                     data-step-type="<?php echo esc_attr( $step->type ); ?>">

                    <!-- هدر مرحله -->
                    <div class="sc-step__header">
                        <div class="sc-step__number"><?php echo $index + 1; ?></div>
                        <div class="sc-step__meta">
                            <span class="sc-step__title"><?php echo esc_html( $step->title ); ?></span>
                            <span class="sc-step__summary" style="display:none"></span>
                        </div>
                        <button class="sc-step__edit" style="display:none" aria-label="ویرایش این مرحله">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            ویرایش
                        </button>
                    </div>

                    <!-- محتوای مرحله -->
                    <div class="sc-step__body">
                        <?php if ( $step->description ) : ?>
                        <p class="sc-step__desc"><?php echo esc_html( $step->description ); ?></p>
                        <?php endif; ?>

                        <div class="sc-options sc-options--<?php echo esc_attr( $step->type ); ?>">
                            <?php foreach ( $step->options as $opt ) : ?>
                            <label class="sc-option" data-option-id="<?php echo esc_attr( $opt->id ); ?>" data-price="<?php echo esc_attr( $opt->price ); ?>">
                                <input type="<?php echo esc_attr( $step->type ); ?>"
                                       name="sc_step_<?php echo esc_attr( $step->id ); ?>"
                                       value="<?php echo esc_attr( $opt->id ); ?>">
                                <?php if ( $opt->icon_svg ) : ?>
                                <span class="sc-option__icon"><?php echo $opt->icon_svg; ?></span>
                                <?php endif; ?>
                                <span class="sc-option__label"><?php echo esc_html( $opt->label ); ?></span>
                                <?php if ( $opt->price > 0 ) : ?>
                                <span class="sc-option__price">+ <?php echo number_format( $opt->price ); ?> تومان</span>
                                <?php endif; ?>
                                <span class="sc-option__check">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                                </span>
                            </label>
                            <?php endforeach; ?>
                        </div>

                        <div class="sc-step__actions">
                            <button class="sc-btn sc-btn--next" data-step-index="<?php echo $index; ?>">
                                <?php echo $index < count( $steps ) - 1 ? 'مرحله بعد' : 'ادامه'; ?>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
                            </button>
                        </div>
                    </div>
                </div>
                <?php endforeach; ?>

                <!-- فرم نهایی -->
                <div class="sc-step sc-form-step" id="sc-contact-form" style="display:none">
                    <div class="sc-step__header">
                        <div class="sc-step__number"><?php echo count( $steps ) + 1; ?></div>
                        <div class="sc-step__meta">
                            <span class="sc-step__title">اطلاعات تماس</span>
                        </div>
                    </div>
                    <div class="sc-step__body">
                        <p class="sc-step__desc">برای دریافت مشاوره رایگان، اطلاعات خود را وارد کنید</p>
                        <div class="sc-form">
                            <div class="sc-field">
                                <label for="sc-name">نام و نام خانوادگی <span>*</span></label>
                                <input type="text" id="sc-name" name="name" placeholder="مثال: علی رضایی" autocomplete="name">
                                <span class="sc-field__error"></span>
                            </div>
                            <div class="sc-field">
                                <label for="sc-phone">شماره موبایل <span>*</span></label>
                                <input type="tel" id="sc-phone" name="phone" placeholder="09xxxxxxxxx" autocomplete="tel" dir="ltr">
                                <span class="sc-field__error"></span>
                            </div>
                        </div>
                        <div class="sc-step__actions">
                            <button class="sc-btn sc-btn--submit" id="sc-submit-btn">
                                <?php echo esc_html( $settings['submit_button_text'] ); ?>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- پیام موفق -->
                <div class="sc-success" id="sc-success" style="display:none">
                    <div class="sc-success__icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 15.01 9 12.01"/></svg>
                    </div>
                    <h3><?php echo esc_html( $settings['success_message'] ); ?></h3>
                    <p class="sc-success__price" id="sc-success-price"></p>
                </div>
            </div>

            <!-- نوار قیمت پایین صفحه -->
            <div class="sc-price-bar" id="sc-price-bar">
                <div class="sc-price-bar__inner">
                    <div class="sc-price-bar__label">هزینه تقریبی پروژه شما</div>
                    <div class="sc-price-bar__amount" id="sc-price-amount">۰ تومان</div>
                </div>
            </div>

        </div>
        <?php
        return ob_get_clean();
    }
}