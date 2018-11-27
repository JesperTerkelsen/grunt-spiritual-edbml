/**
 * Wait for Spiritual to spiritualize.
 * @using {window.__karma__.start} oldstart
 */
(function setup(oldstart) {
	window.__karma__.start = function delay() {
		document.addEventListener('DOMContentLoaded', function() {
			setTimeout(oldstart);
		});
	};
})(window.__karma__.start);
