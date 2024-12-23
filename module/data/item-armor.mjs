import ProwlersParagonsItemBase from "./base-item.mjs";

export default class ProwlersParagonsArmor extends ProwlersParagonsItemBase {

  static defineSchema() {
    const fields = foundry.data.fields;
    const requiredInteger = { required: true, nullable: false, integer: true };
    const schema = super.defineSchema();

    schema.armor_bonus = new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 })

    return schema;
  }
}