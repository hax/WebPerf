void function(){
	'use strict'

	//TODO: beacon

	if (window.addEventListener) {
		window.addEventListener('load', log, false)
	} else if (window.attachEvent) {
		window.attachEvent('onload', log)
	} else {
		var loadHandler = window.onload
		window.onload = function(evt){
			log() // loadHandler may throws, so call log first
			if (typeof loadHandler === 'function') loadHandler.call(window, evt)
		}
	}

	WebPerf.nt = function() {
		return compact(WebPerf.navigationTiming())
	}

	WebPerf.setLogger = function(logger) {
		this._logger = logger
	}

	function log() {
		setTimeout(function(){
			if (typeof WebPerf._logger === 'function') WebPerf._logger()
		}, 1)
	}

	var ignores = /^(name|entryType|startTime|duration|navigationStart)$/
	function compact(t) {
		//console.log(JSON.stringify(t))
		var o = {T0: WebPerf.t0}
		if (WebPerf.vendor) o.V = WebPerf.vendor
		for (var k in t) {
			if (ignores.test(k)) continue
			if (!o[k]) {
				var v = t[k]
				switch (typeof v) {
					case 'string': v = v.charAt(0)
					case 'number': 
						o[abbr(k)] = v
				}
			}
		}
		//console.log(JSON.stringify(o))
		return o
	}

	WebPerf.abbr = abbr
	function abbr(name) {
		var x
		if (name.slice(-5) === 'Start') x = 0
		else if (name.slice(-3) === 'End') x = 1
		else x = ''

		switch (name.split(/[A-Z]/, 1)[0]) {
			case 'dom': return name.charAt(3) + x
			case 'connect': return 'O' + x
			case 'response': return 'P' + x
			case 'request': return 'Q' + x
			case 'secure': return 'S' + x
			case 'link': return 'N' + x
			case 'ms': return 'P' // msFirstPaint
			default: return name.charAt(0).toUpperCase() + x
		}
	}

}()
