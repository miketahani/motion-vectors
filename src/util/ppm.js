// https://github.com/faahmed/ppm-view/blob/master/index.js
export function parse (_data) {
  const data = new Uint8Array(_data);

  var headers    = [];
  var headerSize = 0;

  var buf = "";
  for (let i=0; headers.length < 4; i++, headerSize++) {
    var ch = String.fromCharCode(data[i]);
    if (/\s/.test(ch)) {
      headers.push(buf);
      buf = "";
    } else {
      buf += ch;
    }
  }

  const width  = headers[1];
  const height = headers[2];
  const maxval = headers[3];

  if (!(maxval >= 0 && maxval <= 255)) throw "Bit depth of image must be no more than 8";

  var raster = data.slice(headerSize);

  //canvas requires alpha channel
  var lenWithAlpha = (raster.length / 3) + raster.length;
  var bytes = new Uint8ClampedArray(lenWithAlpha);

  var index = 0;
  for (let i=0; i < lenWithAlpha; i++) {
  	if (i%4 === 3) bytes[i] = 255;
    else bytes[i] = raster[index++];
  }

  return new ImageData(bytes, width, height);
};
