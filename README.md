WebPerf
=======

WebPerf provides a unified API for web performance


Usage
-----

Insert 0/1/2.js to proper position of the document. For example, if you use PHP:

```html
<!doctype html>
<html>
<head>
<meta charset="utf-8">

<script><?php include 'WebPerf/dist/0.min.js' ?></script>

<title> ... </title>
<!-- stylesheets and other scripts -->

<script><?php include 'WebPerf/dist/1.min.js' ?></script>

</head>
<body>
... page content

<script><?php include 'WebPerf/dist/2.min.js' ?></script>
<script>
WebPerf.setLogger(function(){
	console.log(this.navigationTiming())
})
</script>

</body>
</html>
```

If you want to send data to server, you could use WebPerf.nt() method which returns a compact object to minimize the length of the request url.

```html
<script>
WebPerf.setLogger(function(){
	// use Google Analytics
	_gaq.push(['_setCustomVar', 1, 'nt', JSON.stringify(this.nt())])
	_gaq.push(['_trackPageview'])
})
</script>
```
