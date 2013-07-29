
var mongoose = require('mongoose')
var Schema = mongoose.Schema;

mongoose.connect('mongodb://localhost/example-hooks');

var schema = Schema({ name: String });
schema.post('save', function () {
  console.log('post save hook', arguments);
})

schema.pre('save', function (next) {
  console.log('pre save');
  next();
})

var M = mongoose.model('Hooks', schema);

var doc = new M({ name: 'hooooks' });
doc.save(function (err) {
  console.log('save callback');
  mongoose.disconnect();
})


////

Model.on('init', cb);
Model.on('remove', cb);
Model.on('update', cb);
  // Model.update() and doc.save()
Model.on('insert', cb);
Model.on('save', cb);

var promise = Model.save(doc, options, callback);

//

var schema = new Schema(..);
schema.pre('save', function (next, done) {

})
