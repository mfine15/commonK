var page = require('webpage').create();
page.viewportSize = { width: 640, height: 480 };
page.clipRect = {
	top: 51.625,
	left: 765,
	width: 494.984375,
	height: 544,
};

page.open('http://localhost:3000', function () {
  setInterval(function() {
    page.render('/dev/stdout', { format: "png" });
  }, 25);
});

