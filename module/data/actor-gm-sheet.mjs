import ProwlersParagonsActorBase from './base-actor.mjs';

export default class ProwlersParagonsGMSheet extends ProwlersParagonsActorBase {
  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();
    schema.adversity = new fields.NumberField({ default: 0, min: 0 });
    schema.character_ids = new fields.ArrayField(new fields.StringField({ required: true }));

    return schema;
  }
} 