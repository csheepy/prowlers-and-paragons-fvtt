import ProwlersParagonsItemBase from "./base-item.mjs";

export default class ProwlersParagonsProCon extends ProwlersParagonsItemBase {

  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    schema.cost_per_rank = new fields.NumberField({ required: true, nullable: false, integer: true, initial: 0 });
    schema.cost_flat = new fields.NumberField({ required: true, nullable: false, integer: true, initial: 0 });
    schema.kind = new fields.StringField({ choices: ['pro','con'] })

    return schema;
  }
}