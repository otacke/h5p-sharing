<?php

namespace H5PSHARING;

/**
 * Admin
 *
 * @package H5PSHARING
 * @since 0.1
 */
class Admin {

	public function __construct() {

		// Identify what action the H5P plugin is up to
		$uri = parse_url( $_SERVER['REQUEST_URI'] );

		$path        = explode( '/', $uri['path'] ); // array_pop needs reference
		$destination = array_pop( $path );

		if ( 'admin.php' !== $destination ) {
			return; // Not relevant
		}

		parse_str( $uri['query'], $queries );

		if ( 'h5p' === $queries['page'] && isset( $queries['task'] ) && 'show' === $queries['task'] ) {
			// View content type $queries['id'] as admin
			$this->inject_sharing_info( $queries['id'] );
		}
	}

	/**
	 * Inject data tables
	 */
	private function inject_sharing_info( $content_id ) {

		// Set up localization
		$l10n                           = array();
		$l10n['clickToEnlarge']         = __( 'Click to enlarge', 'H5PSHARING' );
		$l10n['clickToShrink']          = __( 'Click to shrink', 'H5PSHARING' );
		$l10n['copied']                 = __( 'Copied!', 'H5PSHARING' );
		$l10n['copy']                   = __( 'Copy', 'H5PSHARING' );
		$l10n['directLink']             = __( 'Direct link', 'H5PSHARING' );
		$l10n['embeddingNotAllowed']    = __( 'Embedding / linking to this content has been disabled in the settings.', 'H5PSHARING' );
		$l10n['embedLinkUnretrievable'] = __( 'The link to the content can\'t be retrieved.', 'H5PSHARING' );
		$l10n['embedSnippet']           = __( 'HTML embed code snippet', 'H5PSHARING' );
		$l10n['qrcode']                 = __( 'QR Code', 'H5PSHARING' );
		$l10n['title']                  = __( 'H5P Sharing', 'H5PSHARING' );

		// Include scripts and styles
		wp_enqueue_script( 'QRCode', plugins_url( '/js/qrcode.js', __FILE__ ), array(), H5PSHARING_VERSION );
		wp_enqueue_script( 'InjectSharingInfo', plugins_url( '/js/inject-sharing-info.js', __FILE__ ), array(), H5PSHARING_VERSION );

		// Pass variables to JavaScript
		wp_localize_script( 'InjectSharingInfo', 'contentId', $content_id );
		wp_localize_script( 'InjectSharingInfo', 'l10n', json_encode( $l10n ) );
	}

	/**
	 * Initialize class variables/constants
	 */
	static function init() {
	}
}
Admin::init();
