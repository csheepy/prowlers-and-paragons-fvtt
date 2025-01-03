import ProwlersParagonsDataModel from "./base-model.mjs";

export default class ProwlersParagonsMinion extends ProwlersParagonsDataModel {

  static defineSchema() {
    const fields = foundry.data.fields;
    const requiredInteger = { required: true, nullable: false, integer: true };
    const schema = {};

    schema.threat = new fields.NumberField({ ...requiredInteger, initial: 2, min: 0 });
    schema.count = new fields.NumberField({ ...requiredInteger, initial: 1, min: 0 }); // number of minions in a group

    schema.description = new fields.StringField({ required: true, blank: true }); // equivalent to passing ({initial: ""}) for StringFields

    return schema;
  }

}