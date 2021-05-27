var mongoose = require("mongoose");
/**
 * Loader that loads the type into the mongoose infrastructure
 * require('./dbref').loadType(mongoose)
 * mongoose.Schema.Types.DBRef
 *
 * @param {Mongoose} the active Mongoose instance for installation
 * @result {Object} the type that is loaded
 * @api public
 */
 exports.loadType = function (mongoose) {
    // The types that are used for schema and models
    var SchemaType = mongoose.SchemaType;
    var SchemaTypes = mongoose.Schema.Types;
    var CastError = SchemaType.CastError;
  
    // The native type used for storage
    var mongo = mongoose.mongo;
    var majorV = parseInt(mongoose.version.split('.')[0])
    var dbref = ((majorV && majorV >=4) ? mongo.DBRef : mongo.BSONPure.DBRef);
  
    // Constructor for schema type
    function DBRef (value, options) {
      SchemaType.call(this, value, options);
    };
  
    // Direct inheritence from schema type
    DBRef.prototype.__proto__ = mongoose.SchemaType.prototype;
  
    // Testing method to evaluate whether check needed
    DBRef.prototype.checkRequired = function (value) {
      return !!value && value instanceof dbref;
    };
  
    // Casting function using raw or processed refs
    DBRef.prototype.cast = function (value) {
      var oid = SchemaTypes.ObjectId;
      if (value === null) return value;
      if (value instanceof dbref) return value;
      if (typeof value !== 'object') throw new CastError('db reference', value);
      return new dbref(value["$ref"], oid.prototype.cast(value["$id"]), value["$db"]);
    };
  
    // Perform the installation
    mongoose.Schema.Types.DBRef = DBRef;
    mongoose.Types.DBRef = dbref;
  
    // Return the type
    return DBRef;
  }