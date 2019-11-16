( function() {
	'use strict';

	// Prepare localization
	l10n = JSON.parse( l10n, function( key, value ) {
		return value || '';
	});

  document.onreadystatechange = function() {
		var embedCode, embedLink, embedAllowed;
		var sharingBox, sharingBoxContainer;
		var titleContainer, title, message;
		var embedLinkContainer, embedLinkField, buttonCopy;

		var h5pContentData;
		var h5pContentWrapper;

    if ( 'interactive' === document.readyState ) {
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
				embedCode = h5pContentData.embedCode;
				embedLink = RegExp( 'src="(.+id=[0-9]+)"', 'g' ).exec( embedCode );
				embedLink = ( 1 > embedLink.length ) ?
					'' :
					'<a href="' + embedLink[1] + '" target="_blank">' + embedLink[1] + '</a>';
			} else {
				embedLink = l10n.embeddingNotAllowed;
			}

			// Sharing box
			sharingBox = document.createElement( 'div' );
			sharingBox.classList.add( 'h5p-sharing-box' );

			// Sharing box container
			sharingBoxContainer = document.createElement( 'div' );
			sharingBoxContainer.classList.add( 'h5p-sharing-box-container' );
			sharingBox.appendChild( sharingBoxContainer );

			// Title container
			titleContainer = document.createElement('div');
			titleContainer.classList.add( 'h5p-sharing-title-container' );
			sharingBoxContainer.appendChild( titleContainer );

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

			// Embed link container
			embedLinkContainer = document.createElement('div');
			embedLinkContainer.classList.add( 'h5p-sharing-embed-link-container' );
			sharingBoxContainer.appendChild( embedLinkContainer );

			// Field with embed link
			embedLinkField = document.createElement( 'div' );
			embedLinkField.classList.add( 'h5p-sharing-embed-link-field' );
			embedLinkField.innerHTML = ( '' !== embedLink ) ? embedLink : l10n.embedLinkUnretrievable;
			embedLinkContainer.appendChild( embedLinkField );

			// Copy button
			if ( '' !== embedLink && embedAllowed ) {
				buttonCopy = document.createElement( 'button' );
				buttonCopy.classList.add( 'button' );
				buttonCopy.classList.add( 'h5p-sharing-button-copy' );
				buttonCopy.setAttribute( 'type', 'button' );
				buttonCopy.innerHTML = l10n.copy;

				buttonCopy.addEventListener( 'click', function() {
					var embedLinkField = document.querySelector( '.h5p-sharing-embed-link-field' );
					var range = document.createRange();
					range.selectNode( embedLinkField );
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

				embedLinkContainer.appendChild( buttonCopy );
			}

			h5pContentWrapper.appendChild( sharingBox );
    }
  };
} () );
