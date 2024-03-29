( function() {
	'use strict';

	var qrcodeColorBG         = '#ffffff';
	var qrcodeColorFG         = '#000000';
	var qrcodeCellSize        = 2;
	var qrcodeMargin          = 8;
	var qrcodeTypeNumber      = 0; // 0 = auto sizing; otherwise 1-40, cmp. https://kazuhikoarase.github.io/qrcode-generator/js/demo/
	var qrcodeErrorCorrection = 'L'; // L (7 %), M (15 %), Q (25 %), H (30 %).

	var svgImageSize = 4096; // Size of downloadable image in px

	var embedSnippetTemplate;

	// contentId passed by WordPress
	contentId = Array.isArray( contentId ) ? contentId[0] : '';

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
		titleContainer = document.createElement( 'div' );
		titleContainer.classList.add( 'h5p-sharing-title-container' );

		// Title
		title = document.createElement( 'div' );
		title.classList.add( 'h5p-sharing-title' );
		title.innerHTML = '<h2>' + l10n.title + '</h2>';
		titleContainer.appendChild( title );

		// Message
		message = document.createElement( 'div' );
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
		var container, containerTitle, containerContent, contentField, contentFieldText, buttonCopy;

		params.content = params.content || '';
		params.contentTitle = params.contentTitle || '';
		params.keepContent = params.keepContent || false;
		params.showButton = params.showButton || false;
		params.selector = params.selector || 'h5p-sharing-null';

		// Content container
		container = document.createElement( 'div' );
		container.classList.add( 'h5p-sharing-content-container' );
		container.classList.add( params.selector );

		// Title field
		containerTitle = document.createElement( 'div' );
		containerTitle.classList.add( 'h5p-sharing-content-container-title' );
		containerTitle.classList.add( params.selector );
		containerTitle.innerHTML = params.contentTitle;

		// Content container
		containerContent = document.createElement( 'div' );
		containerContent.classList.add( 'h5p-sharing-content-container-content' );
		containerContent.classList.add( params.selector );

		// Field with content
		contentField = document.createElement( 'div' );
		contentField.classList.add( 'h5p-sharing-content-field' );
		contentField.classList.add( params.selector );

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

		containerContent.appendChild( contentFieldText );

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
				var message = document.querySelector( '.h5p-sharing-message' );

				range.selectNode( contentField );
				window.getSelection().removeAllRanges();
				window.getSelection().addRange( range );
				document.execCommand( 'copy' );
				window.getSelection().removeAllRanges();

				message.classList.add( 'h5p-sharing-visible' );
				setTimeout( function() {
					message.classList.remove( 'h5p-sharing-visible' );
				}, 1500 );
			});

			// Button should not get focus
			buttonCopy.addEventListener( 'focus', function() {
				this.blur();
			});

			containerContent.appendChild( buttonCopy );
		}

		container.appendChild( containerTitle );
		container.appendChild( containerContent );

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
	 * Build embed snippet. Will contain :w/:h as placeholders for width/height.
	 * @param {object} h5pContentData H5P data from H5PIntegration.
	 * @return {string} Embed snippet.
	 */
	function buildEmbedSnippet( h5pContentData ) {
		var embedCode = h5pContentData.embedCode || '';
		var resizeCode = h5pContentData.resizeCode || '';

		return embedCode + resizeCode;
	}

	/**
	 * Wait until H5P iframe has been resized.
	 * @param {function} callback Callback when resized.
	 * @param {number} interval Time interval between check in ms >= 200.
	 * @param {number} repeat Number of checks > 0;
	 */
	function waitForH5PFrameResized( callback, interval, repeat ) {
		var iframe;
		var timer;

		if ( 'function' !== typeof callback ) {
			return;
		}
		if ( 'number' !== typeof interval ) {
			return;
		}
		if ( 'number' !== typeof repeat ) {
			return;
		}

		if ( 0 >= repeat ) {
			return; // Too many tries
		}

		// Don't go crazy ...
		interval = Math.max( 200, interval );

		if ( 1 >= getH5PIframeSize().height ) {

			// Try again in interval ms
			clearTimeout( timer );
			timer = setTimeout( function() {
				waitForH5PFrameResized( callback, interval, repeat - 1 );
			}, interval );

			return;
		}

		// Found initialized H5P iframe
		callback();
	}

	/**
	 * Get size of H5P iframe.
	 * @return {object} Size.
	 */
	function getH5PIframeSize() {
		var iframe = document.querySelector( '#h5p-iframe-' + contentId );
		var iframeDocument;
		var content;
		var width, height;

		if ( ! iframe ) {

			// General fallback and indicator of a problem
			return {
				width: 0,
				height: 0
			};
		}

		// Fallback for inaccessible iframe
		width = iframe.parentNode.offsetWidth || 0;
		height = iframe.parentNode.offsetHeight || 0;

		// Try to access iframe content
		try {
			iframeDocument = iframe.contentDocument ? iframe.contentDocument : iframe.contentWindow.document;
			content = iframeDocument.querySelector( '.h5p-content' );
			if ( content ) {
				width = content.clientWidth;
				height = content.clientHeight;
			}
		}	catch ( error ) {
		}

		return {
			width: width,
			height: height
		};
	}

	/**
	 * Set snippet iframe size.
	 */
	function setSnippetIframeSize() {
		var size = getH5PIframeSize();

		var snippetTextContainer = document.querySelector( '.h5p-sharing-content-field-text.embed-snippet' );
		if ( snippetTextContainer ) {
			snippetTextContainer.innerText = embedSnippetTemplate
				.replace( ':w', size.width )
				.replace( ':h', size.height );
		}
	}

	/**
	 * Handle image resizing.
	 */
	function handleResize( event ) {
		event.preventDefault();

		if ( this.classList.contains( 'h5p-sharing-expanded' ) ) {
			this.classList.remove( 'h5p-sharing-expanded' );
			this.alt = l10n.clickToEnlarge;
			this.title = l10n.clickToEnlarge;
		} else {
			this.classList.add( 'h5p-sharing-expanded' );
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
		inlineSVG = inlineSVG.replace( /width="[0-9]*px"/, 'width="' + svgImageSize + 'px"' );
		inlineSVG = inlineSVG.replace( /height="[0-9]*px"/, 'height="' + svgImageSize + 'px"' );

		codeSVG = document.createElement( 'div' );
		codeSVG.innerHTML = inlineSVG;

		// Apply custom colors
		codePath = codeSVG.querySelector( 'path' );
		codePath.setAttribute( 'fill', qrcodeColorFG );

		codeRect = codeSVG.querySelector( 'rect' );
		codeRect.setAttribute( 'fill', qrcodeColorBG );

		imageSVG = document.createElement( 'img' );
		imageSVG.src = 'data:image/svg+xml;base64,' + window.btoa( codeSVG.innerHTML );

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

		image = buildSVGImage( code.createSvgTag( qrcodeCellSize, qrcodeMargin, payload, payload ) );
		image.alt = l10n.clickToEnlarge;
		image.title = l10n.clickToEnlarge;

		image.addEventListener( 'click', handleResize );
		image.addEventListener( 'touchstart', handleResize );

		return image;
	}

  document.onreadystatechange = function() {
		var sharingBox, sharingBoxContainer;
		var title, message;

		var h5pContentData;
		var h5pContentWrapper;

		var embedAllowed;
		var embedLink    = l10n.embeddingNotAllowed;
		var embedQRCode  = l10n.embeddingNotAllowed;

		embedSnippetTemplate = l10n.embeddingNotAllowed;

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
				embedQRCode  = buildQRCodeImage( embedLink );
				embedSnippetTemplate = buildEmbedSnippet( h5pContentData );
			}

			// Sharing box container
			sharingBoxContainer = document.createElement( 'div' );
			sharingBoxContainer.classList.add( 'h5p-sharing-box-container' );
			sharingBoxContainer.appendChild( buildTitleContainer() );

			// Build container for embed link
			sharingBoxContainer.appendChild( buildContainer({
				content: embedLink,
				contentTitle: l10n.directLink,
				showButton: embedAllowed,
				selector: 'embed-link'
			}) );

			// Build container for qrcode
			sharingBoxContainer.appendChild( buildContainer({
				content: embedQRCode,
				contentTitle: l10n.qrcode,
				format: ( 'string' === typeof embedQRCode ) ? 'plain' : 'dom',
				showButton: false,
				selector: 'embed-qrcode'
			}) );

			// Build container for embed snippet
			sharingBoxContainer.appendChild( buildContainer({
				content: embedSnippetTemplate,
				contentTitle: l10n.embedSnippet,
				format: 'html',
				showButton: embedAllowed,
				selector: 'embed-snippet'
			}) );

			// Sharing box
			sharingBox = document.createElement( 'div' );
			sharingBox.classList.add( 'h5p-sharing-box' );
			sharingBox.appendChild( sharingBoxContainer );

			h5pContentWrapper.appendChild( sharingBox );

			// Will for H5P iframe to be inititalized before fetching size
			waitForH5PFrameResized( function() {
				setSnippetIframeSize();

				window.addEventListener( 'resize', function() {
					setSnippetIframeSize();
				});
			}, 200, 150 );
    }
  };
} () );
