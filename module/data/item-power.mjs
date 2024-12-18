import ProwlersParagonsItemBase from "./base-item.mjs";

export default class ProwlersParagonsPower extends ProwlersParagonsItemBase {

  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    schema.rank = new fields.NumberField({ required: false, nullable: false, integer: true, initial: 0, min: 0});
    schema.rank_type = new fields.StringField({ choices: CONFIG.PROWLERS_AND_PARAGONS.power_rank_types});
    schema.source = new fields.StringField({ choices: CONFIG.PROWLERS_AND_PARAGONS.power_sources});
    schema.range = new fields.StringField({ choices: CONFIG.PROWLERS_AND_PARAGONS.power_ranges});
    schema.cost = new fields.NumberField({ required: true, nullable: false, integer: true, initial: 0, min: 0});
    // schema.modifiers = new fields.EmbeddedCollectionField() // pros and cons

    return schema;
  }
}