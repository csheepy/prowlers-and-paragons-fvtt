import ProwlersParagonsItemBase from "./base-item.mjs";

export default class ProwlersParagonsPerk extends ProwlersParagonsItemBase {

  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    schema.cost = new fields.NumberField({ required: true, nullable: false, integer: true, initial: 0 });

    return schema;
  }
}