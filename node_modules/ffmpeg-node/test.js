var ffmpeg = require('./ffmpeg-node.js');

ffmpeg.mp4(
   './test.3gp',
   function (err, out, code) {
      console.log(err, out, code);
   }
);

