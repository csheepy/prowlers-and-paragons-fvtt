import ProwlersParagonsDataModel from "./base-model.mjs";

export default class ProwlersParagonsMinion extends ProwlersParagonsDataModel {

  static defineSchema() {
    const fields = foundry.data.fields;
    const requiredInteger = { required: true, nullable: false, integer: true };
    const schema = {};

    schema.threat = new fields.NumberField({ ...requiredInteger, initial: 2, min: 0 });
    schema.count = new fields.NumberField({ ...requiredInteger, initial: 1, min: 0 }); // number of minions in a group

    schema.biography = new fields.StringField({ required: true, blank: true }); // equivalent to passing ({initial: ""}) for StringFields

    return schema;
  }

  /**
   * Migrate source data from some prior format into the format required by this model.
   * @param {object} source   The source data, which may be in an old format
   */
  static migrateData(source) {
    // 1.5.0: Migrate description to biography
    foundry.abstract.Document._addDataFieldMigration(source, "description", "biography");
    return super.migrateData(source);
  }

}