void function(){
	'use strict'

	/*

	WebPerf.navigationTiming() method returns navigation timing data as
	PerformanceNavigationTiming interface
	(http://w3c-test.org/webperf/specs/NavigationTiming2/#sec-PerformanceNavigationTiming)


	We first try Navigation Timing 2 API
	(window.performance.getEntriesByType('navigation'))
	though no browser implemented it up to now.

	Then we try Navigation Timing API (window.performance.timing) and adapt it
	to Navigation Timing 2 compatible interface. Note we also use vendor
	prefixed implementation which may buggy, so to detect vendor implementation
	(webkit|ms|moz), you could check WebPerf.vendor attribute.

	At last we will fallback to the event listeners to capture the timing info.
	We will also add window.pPerformance to provide Navigation Timing
	compatible interface, and WebPerf.vendor attribute returns 'p' . Note, with
	the fallback implementation, the navigation attributes may return NaN if 
	the clock (rely on Date.now) is not monotonic.

	*/
	WebPerf.navigationTiming = tryNT2() || tryNT() || fallback()

	// try Navigation Timing 2 API,
	// see http://w3c-test.org/webperf/specs/NavigationTiming2/
	function tryNT2() {
		var perf = window.performance
		if (perf && typeof perf.getEntriesByType === 'function') {
			var f = function () {
				return perf.getEntriesByType('navigation')[0]
			}
			if (f()) return f
		}
	}

	// try Navigation Timing API,
	// see http://w3c-test.org/webperf/specs/NavigationTiming/
	function tryNT() {

		var perf
		if (perf = window.performance)
			WebPerf.vendor = ''
		else if (perf = window.webkitPerformance)
			WebPerf.vendor = 'webkit'
		else if (perf = window.msPerformance)
			WebPerf.vendor = 'ms'
		else if (perf = window.mozPerformance)
			WebPerf.vendor = 'moz'
		else return

		if (!perf.timing) {
			// user agent may provide the option of disabling the
			// window.performance.timing, and returns null value,
			// so our interface also returns nothing.
			return function () {}
		} else {
			WebPerf.t0 =
				perf.timing.navigationStart ||
				// IE9 bug: navigationStart is 0 when redirect,
				// so fallback to fetchStart
				perf.timing.fetchStart

			return function () {
				var t0 = WebPerf.t0, t = perf.timing, n = perf.navigation
				var entry = {
					name: 'document',
					entryType: 'navigation',
					startTime: 0,
					duration: t.loadEventEnd - t0
				}
				entry.redirectCount = n.redirectCount
				switch (n.type) {
					case n.TYPE_NAVIGATE:	entry.type = 'navigate';	break
					case n.TYPE_RELOAD:	entry.type = 'reload';	break
					case n.TYPE_BACK_FORWARD:	type = 'back_forward';	break
					default:	type = n.type
				}
				for (var k in t) {
					if (
						// ignore props on Object.prototype
						!entry[k] &&
						// only navigation attributes,
						// ignore others like toJSON on IE
						typeof t[k] === 'number' &&
						// ignore navigationStart attribute
						k !== 'navigationStart' &&
						// ignore attributes return 0 value
						t[k]
					) {
						entry[k] = t[k] - t0
					}
				}
				return entry
			}
		}
	}

	function fallback() {

		WebPerf.vendor = 'p'
		
		var dnow =	typeof Date.now === 'function' ?
			Date.now : function () { return new Date().getTime() }

		var t0 = WebPerf.t0, t1 = t0

		function now(timeStamp) {
			var t = dnow()
			// ensure monotonic, or returns NaN
			if (t >= t1) t1 = t
			else return [NaN, NaN]

			// timeStamp should never beyond now time
			if (timeStamp && timeStamp <= t) t = timeStamp
			return [t - t0, t]
		}

		var timing = {domLoading: t0}
		var timing2 = {domLoading: 0}

		//TODO: should we use setTimeout to capture *End time?
		if (window.addEventListener) {

			window.addEventListener('DOMContentLoaded', function(event){
				var t = now(event.timeStamp)
				timing2.domContentLoadedEventStart = t[0]
				timing.domContentLoadedEventStart = t[1]
			}, true)

			window.addEventListener('DOMContentLoaded', function(){
				var t = now()
				timing2.domContentLoadedEventEnd = t[0]
				timing.domContentLoadedEventEnd = t[1]
			}, false)

			window.addEventListener('load', function(event){
				var t = now(event.timeStamp)
				timing2.loadEventStart = t[0]
				timing.loadEventStart = t[1]
			}, true)

			window.addEventListener('load', function(){
				var t = now()
				timing2.loadEventEnd = t[0]
				timing.loadEventEnd = t[1]
			}, false)

			window.document.addEventListener('readystatechange', function(event){
				var t = now(event.timeStamp)
				var s = this.readyState, attr = 'dom' + s[0].toUpperCase() + s.slice(1)
				timing2[attr] = t[0]
				timing[attr] = t[1]
			}, true)

			//TODO: link negotiation, prerender switch, redirect count, type

		} else if (window.attachEvent) {

			//TODO: mimic domContentLoaded event

			window.attachEvent('onload', function(){
				var t = now()
				timing2.loadEventStart = t[0]
				timing.loadEventStart = t[1]
				//TODO: Does it work?
				window.attachEvent('onload', function(){
					var t = now()
					timing2.loadEventEnd = t[0]
					timing.loadEventEnd = t[1]
				})
			})

			window.document.attachEvent('onreadystatechange', function(){
				var t = now()
				var s = this.readyState, attr = 'dom' + s.charAt(0).toUpperCase() + s.slice(1)
				timing2[attr] = t[0]
				timing[attr] = t[1]
			})

		} else {

			//TODO: mimic domContentLoaded event

			var loadHandler = window.onload
			window.onload = function(evt){
				var t = now()
				timing2.loadEventStart = t[0]
				timing.loadEventStart = t[1]
				setTimeout(function(){
					t = now()
					timing2.loadEventEnd = t[0]
					timing.loadEventEnd = t[1]
				}, 1)
				if (typeof loadHandler === 'function') loadHandler.call(window, evt)
			}
		}

		window.pPerformance = {
			timing: timing, navigation: {}
		}

		return function() {
			return timing2
		}

	}

}()