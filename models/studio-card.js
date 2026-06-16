const { ModelSchema, SchemaTypes, DatabaseModel } = require('@app-core/mongoose');

const modelName = 'studio_cards';

const schemaConfig = {
  _id: { type: SchemaTypes.ULID, required: true },
  creator_card_id: { type: SchemaTypes.String, required: true, index: true },
  slug: { type: SchemaTypes.String, required: true, unique: true, index: true },
  creator_reference: { type: SchemaTypes.String, required: true, index: true },
  editor_code: { type: SchemaTypes.String, required: true },
  template_key: { type: SchemaTypes.String, required: true, index: true },
  theme: { type: SchemaTypes.Mixed, required: true },
  layout: { type: SchemaTypes.Mixed, required: true },
  media: { type: SchemaTypes.Mixed, required: true },
  contact: { type: SchemaTypes.Mixed, required: true },
  created: { type: SchemaTypes.Number, required: true },
  updated: { type: SchemaTypes.Number, required: true },
  deleted: { type: SchemaTypes.Number, default: null, index: true },
};

const modelSchema = new ModelSchema(schemaConfig, { collection: modelName });

module.exports = DatabaseModel.model(modelName, modelSchema);
