import ProwlersParagonsItemBase from "./base-item.mjs";
import {ProwlersParagonsItem} from "../documents/item.mjs"

export default class ProwlersParagonsPower extends ProwlersParagonsItemBase {

  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    schema.rank = new fields.NumberField({ required: false, nullable: false, integer: true, initial: 0, min: 0});
    schema.rank_type = new fields.StringField({ choices: CONFIG.PROWLERS_AND_PARAGONS.power_rank_types});
    schema.connected_ability = new fields.StringField({ required: false, nullable: true }); // for baseline and default types
    schema.baseline_scaling_options = new fields.ObjectField(); // half_scaling, exact_override
    schema.source = new fields.StringField({ choices: CONFIG.PROWLERS_AND_PARAGONS.power_sources});
    schema.range = new fields.StringField({ choices: CONFIG.PROWLERS_AND_PARAGONS.power_ranges});
    schema.cost = new fields.NumberField({ required: true, nullable: false, integer: true, initial: 0, min: 0});

    return schema;
  }
}