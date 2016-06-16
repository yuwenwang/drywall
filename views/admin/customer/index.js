'use strict';
var xlsx = require('xlsx');
var fs = require('fs');
var multer  = require('multer');
var upload = multer({ dest: 'D:\\temp\\uploads' });


exports.find = function(req, res, next){
  req.query.name = req.query.name ? req.query.name : '';
  req.query.phone = req.query.phone ? req.query.phone : '';
  req.query.limit = req.query.limit ? parseInt(req.query.limit, null) : 20;
  req.query.page = req.query.page ? parseInt(req.query.page, null) : 1;
  req.query.sort = req.query.sort ? req.query.sort : '_id';

  var filters = {};
  if (req.query.name) {
    filters.name = new RegExp('^.*?'+ req.query.name +'.*$', 'i');
  }
  if (req.query.phone) {
    filters.phone = new RegExp('^.*?'+ req.query.phone +'.*$', 'i');
  }

  req.app.db.models.Customer.pagedFind({
    filters: filters,
    keys: 'name phone',
    limit: req.query.limit,
    page: req.query.page,
    sort: req.query.sort
  }, function(err, results) {
    if (err) {
      return next(err);
    }

    if (req.xhr) {
      res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
      results.filters = req.query;
      res.send(results);
    }
    else {
      results.filters = req.query;
      res.render('admin/customer/index', { data: { results: escape(JSON.stringify(results)) }, _csrfToken: req.csrfToken()});
    }
  });
};

exports.read = function(req, res, next){
  req.app.db.models.Customer.findById(req.params.id).exec(function(err, customer) {
    if (err) {
      return next(err);
    }

    if (req.xhr) {
      res.send(customer);
    }
    else {
      res.render('admin/customer/details', { data: { record: escape(JSON.stringify(customer)) } });
    }
  });
};

exports.create = function(req, res, next){
  var workflow = req.app.utility.workflow(req, res);

  workflow.on('validate', function() {
    if (!req.user.roles.admin.isMemberOf('root')) {
      workflow.outcome.errors.push('You may not create customer.');
      return workflow.emit('response');
    }

    if (!req.body.name) {
      workflow.outcome.errors.push('A name is required.');
      return workflow.emit('response');
    }

    if (!req.body.phone) {
      workflow.outcome.errors.push('A phone is required.');
      return workflow.emit('response');
    }

    workflow.emit('duplicateCustomerCheck');
  });

  workflow.on('duplicateCustomerCheck', function() {
    req.app.db.models.Customer.findOne({phone:req.body.phone}).exec(function(err, customer) {
      if (err) {
        return workflow.emit('exception', err);
      }

      if (customer) {
        workflow.outcome.errors.push('客户信息已存在.');
        return workflow.emit('response');
      }

      workflow.emit('createCustomer');
    });
  });

  workflow.on('createCustomer', function() {
    var fieldsToSet = {
      name: req.body.name,
      phone: req.body.phone
    };

    req.app.db.models.Customer.create(fieldsToSet, function(err, customer) {
      if (err) {
        return workflow.emit('exception', err);
      }

      workflow.outcome.record = customer;
      return workflow.emit('response');
    });
  });

  workflow.emit('validate');
};

exports.update = function(req, res, next){
  var workflow = req.app.utility.workflow(req, res);

  workflow.on('validate', function() {
    if (!req.user.roles.admin.isMemberOf('root')) {
      workflow.outcome.errors.push('You may not update categories.');
      return workflow.emit('response');
    }

    if (!req.body.name) {
      workflow.outcome.errfor.name = 'required';
      return workflow.emit('response');
    }

    if (!req.body.phone) {
      workflow.outcome.errfor.phone = 'required';
      return workflow.emit('response');
    }

    workflow.emit('patchCustomer');
  });

  workflow.on('patchCustomer', function() {
    var fieldsToSet = {
      name: req.body.name,
      phone: req.body.phone
    };
    var options = { new: true };
    req.app.db.models.Customer.findByIdAndUpdate(req.params.id, fieldsToSet, options, function(err, customer) {
      if (err) {
        return workflow.emit('exception', err);
      }

      workflow.outcome.customer = customer;
      return workflow.emit('response');
    });
  });

  workflow.emit('validate');
};

exports.delete = function(req, res, next){
  var workflow = req.app.utility.workflow(req, res);

  workflow.on('validate', function() {
    if (!req.user.roles.admin.isMemberOf('root')) {
      workflow.outcome.errors.push('You may not delete categories.');
      return workflow.emit('response');
    }

    workflow.emit('deleteCustomer');
  });

  workflow.on('deleteCustomer', function(err) {
    req.app.db.models.Customer.findByIdAndRemove(req.params.id, function(err, customer) {
      if (err) {
        return workflow.emit('exception', err);
      }
      workflow.emit('response');
    });
  });

  workflow.emit('validate');
};

exports.upload = function(req, res, next){
  res.send("上传成功");
}
