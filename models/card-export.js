const { ModelSchema, SchemaTypes, DatabaseModel } = require('@app-core/mongoose');

const modelName = 'card_exports';

const schemaConfig = {
  _id: { type: SchemaTypes.ULID, required: true },
  slug: { type: SchemaTypes.String, required: true, index: true },
  type: { type: SchemaTypes.String, required: true, index: true },
  created: { type: SchemaTypes.Number, required: true, index: true },
};

const modelSchema = new ModelSchema(schemaConfig, { collection: modelName });

module.exports = DatabaseModel.model(modelName, modelSchema);
