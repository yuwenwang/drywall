/**
 * Created by wendywan on 2016/6/3.
 */
'use strict';

exports = module.exports = function(app, mongoose) {
    var customerSchema = new mongoose.Schema({
        name: { type: String, default: '' },
        //age: { type: String, default: '' },
        //gender: { type: String, default: '' },
        //email: { type: String, default: '' },
        phone: { type: String, default: '' }
        //class: { type: String, default: '' }
    });
    customerSchema.plugin(require('./plugins/pagedFind'));
    customerSchema.index({ phone: 1 });
    customerSchema.index({ name: 1 });
    customerSchema.set('autoIndex', (app.get('env') === 'development'));
    app.db.model('Customer', customerSchema);
};
