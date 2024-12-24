import ProwlersParagonsItemBase from "./base-item.mjs";

export default class ProwlersParagonsWeapon extends ProwlersParagonsItemBase {

  static defineSchema() {
    const fields = foundry.data.fields;
    const requiredInteger = { required: true, nullable: false, integer: true };
    const schema = super.defineSchema();

    schema.weapon_bonus = new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 })
    schema.ranged = new fields.BooleanField({initial: false})

    return schema;
  }
}