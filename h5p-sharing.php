<?php

/**
 * Plugin Name: H5P-Sharing
 * Text Domain: H5PSHARING
 * Domain Path: /languages
 * Description: Add some sharing functionality to the H5P plugin
 * Version: 0.2.2
 * Author: octofuchs
 * Author URI: https://octofuchs.de
 * License: MIT
 * License URI: http://opensource.org/licenses/MIT
 */

namespace H5PSHARING;

// as suggested by the WordPress community
defined( 'ABSPATH' ) or die( 'No script kiddies please!' );

if ( ! defined( 'H5PSHARING_VERSION' ) ) {
	define( 'H5PSHARING_VERSION', '0.2.2' );
}

// Includes
require_once( __DIR__ . '/class-admin.php' );

/**
 * Activate the plugin.
 */
function on_activation() {
}

/**
 * Deactivate the plugin.
 */
function on_deactivation() {
}

/**
 * Uninstall the plugin.
 */
function on_uninstall() {
}

/**
 * Update the plugin.
 */
function update() {
	if ( H5PSHARING_VERSION === get_option( 'H5PSHARING_version' ) ) {
		return;
	}

	/*
	 * Do updates based on return value of get_option( 'H5PSHARING_version' ) and
	 * use update_option( 'H5PSHARING_version', '<VERSION>' ) to set new version.
	 */

	update_option( 'H5PSHARING_version', H5PSHARING_VERSION );
}

/**
 * Load the text domain for internationalization.
 */
function H5PSHARING_load_plugin_textdomain() {
	load_plugin_textdomain( 'H5PSHARING', false, basename( dirname( __FILE__ ) ) . '/languages/' );
}

/**
 * Register custom style for admin area.
 */
function H5PSHARING_add_admin_styles() {
	wp_register_style( 'H5PSHARING', plugins_url( '/styles/h5p-sharing-admin.css', __FILE__ ), array(), H5PSHARING_VERSION );
	wp_enqueue_style( 'H5PSHARING' );
}

// Start setup
register_activation_hook( __FILE__, 'H5PSHARING\on_activation' );
register_deactivation_hook( __FILE__, 'H5PSHARING\on_deactivation' );
register_uninstall_hook( __FILE__, 'H5PSHARING\on_uninstall' );

add_action( 'plugins_loaded', 'H5PSHARING\H5PSHARING_load_plugin_textdomain' );
add_action( 'plugins_loaded', 'H5PSHARING\update' );

// Custom style for admin area
add_action( 'admin_enqueue_scripts', 'H5PSHARING\H5PSHARING_add_admin_styles' );

/**
 * Launch.
 */
function start_admin() {
	new Admin;
}

if ( is_admin() ) {
	add_action( 'admin_enqueue_scripts', 'H5PSHARING\start_admin' );
}
