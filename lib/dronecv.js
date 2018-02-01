const cv = require('opencv');

var drawing = require('pngjs-draw');
var PNG = drawing(require('pngjs').PNG);
var pica = require('pica');

var DroneCV = exports = module.exports = function(pngStream, options, faceCallback) {

    var lastPng;
    var lastPngTime;
    var pngDeltaTime;
    var faceInterval;
    var processingImage;
    var opts = options || {};

    if (typeof faceCallback !== 'function') throw new Error('missing callback, expected as second argument to dronecv');

    pngStream.on('data', function(pngBuffer) {
      var currentTime = Date.now();
      if (lastPngTime) {
        pngDeltaTime = currentTime - lastPngTime;
      }
      lastPngTime = currentTime;
      lastPng = pngBuffer;
        console.log("dit werkt");
    });

    var classifier = cv.FACE_CASCADE;
    var options = new(function() {

      return this;
    });

    this.start = function(interval) {
      if (faceInterval) stop();
      interval = /*interval*/ 150;
      faceInterval = setInterval(detectFaces, interval);
    };

    this.stop = function() {
      if (faceInterval) clearInterval(faceInterval);
      faceInterval = null;
    };

    var detectFaces = function() {
        if ((!processingImage) && lastPng) {
          processingImage = true;
          var png = new PNG();
          png.parse(lastPng),

            png.on('parsed', function() {
                lastPng = null;
                var imageData = this.data;
                var w = this.width;
                var h = this.height;
                cv.readImage(lastPng, function(err, im) {
                //cv.readImage(imageData, function(err, im) {
                  if (err) throw err;
                  if (im.width() < 1 || im.height() < 1) throw new Error('Image has no size');

                  im.detectObject(classifier, {}, function(err, faces) {
                    if (err) throw err;

                    for (var i = 0; i < faces.length; i++) {
                      var face = faces[i];
                      im.ellipse(face.x + face.width / 2, face.y + face.height / 2, face.width / 2, face.height / 2);
                      //im.rectangle([face.x, face.y], [face.width, face.height], {0,0,255}, 2);
                      imageData = im;
                    }
                  });
                  var outputImage = null;

                  if (opts.outputImage) {
                    outputImage = new PNG({
                      width: w,
                      height: h
                    });
                    outputImage.data = new Buffer(imageData);
                   }
                  var info = {
                    delatTime: pngDeltaTime,
                    timestamp: lastPngTime,
                    //rects: rects,
                    image: outputImage
                  };

                  faceCallback(info);

                  processingImage = false;
                });
              });
            }

          /*return {
            'stop': stop,
            'start': start
          };*/
        };
}
