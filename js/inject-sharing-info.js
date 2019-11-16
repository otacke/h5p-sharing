( function() {
	'use strict';

	// Prepare localization
	l10n = JSON.parse( l10n, function( key, value ) {
		return value || '';
	});

	/**
   * Retrieve true string from HTML encoded string.
   * @param {string} input Input string.
   * @return {string} Output string.
   */
  function htmlDecode( input ) {
    var dparser = new DOMParser().parseFromString(input, 'text/html');
    return dparser.documentElement.textContent;
  }

	/**
	 * Build container for title row.
	 * @param {string} title Title.
	 * @param {string} message Message for copied.
	 * @return {HTMLElement} Title container.
	 */
  function buildTitleContainer( title, message ) {
		var titleContainer;

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
	 * @param {boolean} [params.keepContent=false] Content to display.
	 * @param {boolean} [params.showButton=false] True, if button shall be shown.
	 * @param {string} [params.selector='h5p-sharing-null'] Selector.
	 * @return {HTMLElement} Container.
	 */
	function buildContainer( params ) {
		params.content = params.content || '';
		params.keepContent = params.keepContent || false;
		params.showButton = params.showButton || false;
		params.selector = params.selector || 'h5p-sharing-null';

		var container, contentField, buttonCopy;

		// Embed link container
		container = document.createElement('div');
		container.classList.add( 'h5p-sharing-content-container' );
		container.classList.add( params.selector );

		// Field with embed link
		contentField = document.createElement( 'div' );
		contentField.classList.add( 'h5p-sharing-content-field' );
		contentField.classList.add( params.selector );

		if ( params.keepContent ) {
			contentField.innerHTML = ( '' !== params.content ) ? params.content : l10n.embedLinkUnretrievable;
		} else {
			contentField.appendChild( document.createTextNode( ( '' !== params.content ) ? params.content : l10n.embedLinkUnretrievable ) );
		}

		container.appendChild( contentField );

		// Copy button
		if ( '' !== params.content && params.showButton ) {
			buttonCopy = document.createElement( 'button' );
			buttonCopy.classList.add( 'button' );
			buttonCopy.classList.add( 'h5p-sharing-button-copy' );
			buttonCopy.setAttribute( 'type', 'button' );
			buttonCopy.innerHTML = l10n.copy;

			buttonCopy.addEventListener( 'click', function() {
				var contentField = document.querySelector( '.h5p-sharing-content-field.' + params.selector );
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

			return container;
		}
	}

  document.onreadystatechange = function() {
		var sharingBox, sharingBoxContainer;
		var title, message;

		var embedCode, resizeCode, embedAllowed;
		var embedLink    = l10n.embeddingNotAllowed;
		var embedSnippet =  l10n.embeddingNotAllowed;

		var iframe;
		var width = '';
		var height = '';

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
				// TODO: Put in separate functions
				embedCode = h5pContentData.embedCode || '';
				resizeCode = h5pContentData.resizeCode || '';

				embedLink = RegExp( 'src="(.+id=[0-9]+)"', 'g' ).exec( embedCode );
				embedLink = ( 1 > embedLink.length ) ?
					'' :
					'<a href="' + embedLink[1] + '" target="_blank">' + embedLink[1] + '</a>';

				embedSnippet = embedCode + resizeCode;
				iframe = document.querySelector( '#h5p-iframe-' + contentId );
				if ( iframe ) {
					width = iframe.parentNode.offsetWidth || '';
					height = iframe.parentNode.offsetHeight || '';
				}

				embedSnippet = embedSnippet
					.replace( ':w', width )
					.replace( ':h', height );
			}

			// Sharing box container
			sharingBoxContainer = document.createElement( 'div' );
			sharingBoxContainer.classList.add( 'h5p-sharing-box-container' );
			sharingBoxContainer.appendChild( buildTitleContainer( title, message ) );

			sharingBoxContainer.appendChild( buildContainer( {
				content: embedLink,
				keepContent: true,
				showButton: embedAllowed,
				selector: 'embed-link'
			} ) );

			sharingBoxContainer.appendChild( buildContainer({
				content: embedSnippet,
				keepContent: false,
				showButton: embedAllowed,
				selector: 'embed-snippet'
			} ) );

			// Sharing box
			sharingBox = document.createElement( 'div' );
			sharingBox.classList.add( 'h5p-sharing-box' );
			sharingBox.appendChild( sharingBoxContainer );

			h5pContentWrapper.appendChild( sharingBox );
    }
  };
} () );
