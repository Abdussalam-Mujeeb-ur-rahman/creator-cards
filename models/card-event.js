const { ModelSchema, SchemaTypes, DatabaseModel } = require('@app-core/mongoose');

const modelName = 'card_events';

const schemaConfig = {
  _id: { type: SchemaTypes.ULID, required: true },
  slug: { type: SchemaTypes.String, required: true, index: true },
  event_type: { type: SchemaTypes.String, required: true, index: true },
  link_title: { type: SchemaTypes.String },
  link_url: { type: SchemaTypes.String },
  meta: { type: SchemaTypes.Mixed, default: {} },
  created: { type: SchemaTypes.Number, required: true, index: true },
};

const modelSchema = new ModelSchema(schemaConfig, { collection: modelName });

module.exports = DatabaseModel.model(modelName, modelSchema);
