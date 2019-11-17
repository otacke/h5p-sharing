( function() {
	'use strict';

	var qrcodeColorBG         = '#ffffff';
	var qrcodeColorFG         = '#000000';
	var qrcodeCellSize        = 2;
	var qrcodeMargin          = 8;
	var qrcodeTypeNumber      = 0; // 0 = auto sizing; otherwise 1-40, cmp. https://kazuhikoarase.github.io/qrcode-generator/js/demo/
	var qrcodeErrorCorrection = 'L'; // L (7 %), M (15 %), Q (25 %), H (30 %).

	var svgImageSize = 4096; // Size of downloadable image in px

	// Prepare localization
	l10n = JSON.parse( l10n, function( key, value ) {
		return value || '';
	});

	/**
	 * Build container for title row.
	 * @param {string} title Title.
	 * @param {string} message Message for copied.
	 * @return {HTMLElement} Title container.
	 */
  function buildTitleContainer() {
		var titleContainer;
		var title, message;

		// Title container
		titleContainer = document.createElement('div');
		titleContainer.classList.add( 'h5p-sharing-title-container' );

		// Title
		title = document.createElement('div');
		title.classList.add( 'h5p-sharing-title' );
		title.innerHTML = '<h2>' + l10n.title + '</h2>'
		titleContainer.appendChild( title );

		// Message
		message = document.createElement('div');
		message.classList.add( 'h5p-sharing-message' );
		message.innerHTML = l10n.copied;
		titleContainer.appendChild( message );

		return titleContainer;
	}

	/**
	 * Build container row.
	 * @param {object} params Params.
	 * @param {string} [params.content=''] Content to display.
	 * @param {string} [params.contentTitle=''] Content title.
	 * @param {boolean} [params.keepContent=false] Content to display.
	 * @param {boolean} [params.showButton=false] True, if button shall be shown.
	 * @param {string} [params.selector='h5p-sharing-null'] Selector.
	 * @return {HTMLElement} Container.
	 */
	function buildContainer( params ) {
		var container, contentField, contentFieldTitle, contentFieldText, buttonCopy;

		params.content = params.content || '';
		params.contentTitle = params.contentTitle || '';
		params.keepContent = params.keepContent || false;
		params.showButton = params.showButton || false;
		params.selector = params.selector || 'h5p-sharing-null';

		// Content container
		container = document.createElement('div');
		container.classList.add( 'h5p-sharing-content-container' );
		container.classList.add( params.selector );

		// Field with content
		contentField = document.createElement( 'div' );
		contentField.classList.add( 'h5p-sharing-content-field' );
		contentField.classList.add( params.selector );

		// Title field
		contentFieldTitle = document.createElement( 'div' );
		contentFieldTitle.classList.add( 'h5p-sharing-content-field-title' );
		contentFieldTitle.classList.add( params.selector );
		contentFieldTitle.innerHTML = params.contentTitle;

		// Text field
		contentFieldText = document.createElement( 'div' );
		contentFieldText.classList.add( 'h5p-sharing-content-field-text' );
		contentFieldText.classList.add( params.selector );

		if ( 'html' === params.format ) {
			contentFieldText.appendChild( document.createTextNode( ( '' !== params.content ) ? params.content : l10n.embedLinkUnretrievable ) );
		} else if ( 'dom' === params.format ) {
			contentFieldText.appendChild( params.content );
		} else {
			contentFieldText.innerHTML = ( '' !== params.content ) ? params.content : l10n.embedLinkUnretrievable;
		}

		contentField.appendChild( contentFieldTitle );
		contentField.appendChild( contentFieldText );

		container.appendChild( contentField );

		// Copy button
		if ( '' !== params.content && params.showButton ) {
			buttonCopy = document.createElement( 'button' );
			buttonCopy.classList.add( 'button' );
			buttonCopy.classList.add( 'h5p-sharing-button-copy' );
			buttonCopy.classList.add( params.selector );
			buttonCopy.setAttribute( 'type', 'button' );
			buttonCopy.innerHTML = l10n.copy;

			buttonCopy.addEventListener( 'click', function() {
				var contentField = document.querySelector( '.h5p-sharing-content-field-text.' + params.selector );
				var range = document.createRange();
				range.selectNode( contentField );
				window.getSelection().removeAllRanges();
				window.getSelection().addRange( range );
				document.execCommand( 'copy' );
				window.getSelection().removeAllRanges();

				var message = document.querySelector( '.h5p-sharing-message' );
				message.classList.add( 'h5p-sharing-visible' );
				setTimeout( function() {
					message.classList.remove( 'h5p-sharing-visible' );
				}, 1500 );
			});

			// Button should not get focus
			buttonCopy.addEventListener( 'focus', function() {
				this.blur();
			});

			container.appendChild( buttonCopy );
		}

		return container;
	}

	/**
	 * Build embed link.
	 * @param {object} h5pContentData H5P data from H5PIntegration.
	 * @return {string} Embed link.
	 */
	function buildEmbedLink( h5pContentData ) {
		var embedCode = h5pContentData.embedCode || '';
		var embedLink = RegExp( 'src="(.+id=[0-9]+)"', 'g' ).exec( embedCode );
		embedLink = ( 1 > embedLink.length ) ?
			'' :
			'<a href="' + embedLink[1] + '" target="_blank">' + embedLink[1] + '</a>';

		return embedLink;
	}

	/**
	 * Build embed snippet.
	 * @param {object} h5pContentData H5P data from H5PIntegration.
	 * @return {string} Embed snippet.
	 */
	function buildEmbedSnippet( h5pContentData ) {
		var width = '';
		var height = '';
		var embedCode = h5pContentData.embedCode || '';
		var resizeCode = h5pContentData.resizeCode || '';

		var embedSnippet = embedCode + resizeCode;

		var iframe = document.querySelector( '#h5p-iframe-' + contentId );
		if ( iframe ) {
			width = iframe.parentNode.offsetWidth || '';
			height = iframe.parentNode.offsetHeight || '';
		}

		embedSnippet = embedSnippet
			.replace( ':w', width )
			.replace( ':h', height );

		return embedSnippet;
	}

	/**
	 * Handle image resizing.
	 */
	function handleResize() {
		if ( this.classList.contains('expanded') ) {
			this.classList.remove('expanded');
			this.alt = l10n.clickToEnlarge;
			this.title = l10n.clickToEnlarge;
		} else {
			this.classList.add('expanded');
			this.alt = l10n.clickToShrink;
			this.title = l10n.clickToShrink;
		}
	}

	/**
	 * Create SVG image and use img tag to make it downloadable.
	 * @param {string} inlineSVG Inline SVG.
	 * @return {HTMLElement} SVG image.
	 */
	function buildSVGImage( inlineSVG ) {
		var codeSVG, codePath, codeRect, imageSVG;

		// Set size for downloadable image
		inlineSVG = inlineSVG.replace(/width="[0-9]*px"/, 'width="' + svgImageSize + 'px"');
		inlineSVG = inlineSVG.replace(/height="[0-9]*px"/, 'height="' + svgImageSize + 'px"');

		codeSVG = document.createElement( 'div' );
		codeSVG.innerHTML = inlineSVG;

		// Apply custom colors
		codePath = codeSVG.querySelector('path');
		codePath.setAttribute('fill', qrcodeColorFG);

		codeRect = codeSVG.querySelector('rect');
		codeRect.setAttribute('fill', qrcodeColorBG);

		imageSVG = document.createElement('img');
		imageSVG.src = 'data:image/svg+xml;base64,' + window.btoa(codeSVG.innerHTML);

		return imageSVG;
	};

	/**
	 * Build QRCode Image.
	 * @param {string} payload Payload.
	 * @return {HTMLElement} Image.
	 */
	function buildQRCodeImage( payload ) {
		var image;
		var code = qrcode( qrcodeTypeNumber, qrcodeErrorCorrection );
		code.addData( payload );
		code.make();

		image = buildSVGImage( code.createSvgTag( qrcodeCellSize, qrcodeMargin, payload, payload) );
		image.alt = l10n.clickToEnlarge;
		image.title = l10n.clickToEnlarge;

		image.addEventListener( 'click', handleResize );
		image.addEventListener( 'touchstart', handleResize );

		return image;
	}

  document.onreadystatechange = function() {
		var sharingBox, sharingBoxContainer;
		var title, message;

		var embedAllowed;
		var embedLink    = l10n.embeddingNotAllowed;
		var embedSnippet =  l10n.embeddingNotAllowed;

		var h5pContentData;
		var h5pContentWrapper;

    if ( 'complete' === document.readyState ) {
			// Detect if content embedding is allowed
			h5pContentData = ( H5PIntegration && H5PIntegration.contents && H5PIntegration.contents['cid-' + contentId]) ?
				H5PIntegration.contents['cid-' + contentId] :
				false;

			// Detect H5P content wrapper
			h5pContentWrapper = document.querySelector( '.h5p-content-wrap' );

			if ( ! h5pContentData || ! h5pContentWrapper ) {
				return;
			}

			// Check with H5P if embedding is allowed for content
			embedAllowed = ( h5pContentData.displayOptions ) ?
				h5pContentData.displayOptions.embed || false :
				false;

			if ( embedAllowed ) {
				embedLink    = buildEmbedLink( h5pContentData );
				embedSnippet = buildEmbedSnippet( h5pContentData );
			}

			// Sharing box container
			sharingBoxContainer = document.createElement( 'div' );
			sharingBoxContainer.classList.add( 'h5p-sharing-box-container' );
			sharingBoxContainer.appendChild( buildTitleContainer() );

			// Build container for embed link
			sharingBoxContainer.appendChild( buildContainer( {
				content: embedLink,
				contentTitle: l10n.directLink,
				showButton: embedAllowed,
				selector: 'embed-link'
			} ) );

			// Build container for embed snippet
			sharingBoxContainer.appendChild( buildContainer({
				content: embedSnippet,
				contentTitle: l10n.embedSnippet,
				format: 'html',
				showButton: embedAllowed,
				selector: 'embed-snippet'
			} ) );

			// Build container for qrcode
			sharingBoxContainer.appendChild( buildContainer({
				content: buildQRCodeImage( embedLink ),
				contentTitle: l10n.qrcode,
				format: 'dom',
				showButton: false,
				selector: 'embed-qrcode'
			} ) );

			// Sharing box
			sharingBox = document.createElement( 'div' );
			sharingBox.classList.add( 'h5p-sharing-box' );
			sharingBox.appendChild( sharingBoxContainer );

			h5pContentWrapper.appendChild( sharingBox );
    }
  };
} () );
