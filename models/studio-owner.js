const { ModelSchema, SchemaTypes, DatabaseModel } = require('@app-core/mongoose');

const modelName = 'studio_owners';

const schemaConfig = {
  _id: { type: SchemaTypes.ULID, required: true },
  creator_reference: { type: SchemaTypes.String, required: true, unique: true, index: true },
  editor_code: { type: SchemaTypes.String, required: true },
  created: { type: SchemaTypes.Number, required: true },
  updated: { type: SchemaTypes.Number, required: true },
  deleted: { type: SchemaTypes.Number, default: null, index: true },
};

const modelSchema = new ModelSchema(schemaConfig, { collection: modelName });

module.exports = DatabaseModel.model(modelName, modelSchema);
