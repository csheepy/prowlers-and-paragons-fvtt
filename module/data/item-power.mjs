import ProwlersParagonsItemBase from "./base-item.mjs";
import {ProwlersParagonsItem} from "../documents/item.mjs"

export default class ProwlersParagonsPower extends ProwlersParagonsItemBase {

  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    schema.rank = new fields.NumberField({ required: false, nullable: false, integer: true, initial: 1, min: 1});
    schema.rank_type = new fields.StringField({ choices: CONFIG.PROWLERS_AND_PARAGONS.power_rank_types});
    schema.connected_ability = new fields.StringField({ required: false, nullable: true }); // for baseline and default types
    schema.baseline_scaling_options = new fields.ObjectField(); // half_scaling, exact_override
    schema.source = new fields.StringField({ choices: CONFIG.PROWLERS_AND_PARAGONS.power_sources});
    schema.range = new fields.StringField({ choices: CONFIG.PROWLERS_AND_PARAGONS.power_ranges});
    schema.cost = new fields.NumberField({ required: true, nullable: false, integer: false, initial: 0, min: 0});
    schema.toggleable = new fields.BooleanField({initial: false})
    schema.toggleActive = new fields.BooleanField({initial: false})
    schema.shortDescription = new fields.StringField({ required: false });

    schema.hasCharges = new fields.BooleanField({initial: false})
    schema.charges = new fields.SchemaField({
      value: new fields.NumberField({ required: false, nullable: true, integer: true}),
      max: new fields.NumberField({ required: false, nullable: true, integer: true})
    });

    schema.temporary = new fields.BooleanField({initial: false})

    return schema;
  }
}