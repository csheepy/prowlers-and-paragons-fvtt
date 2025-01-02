import ProwlersParagonsActorBase from "./base-actor.mjs";

export default class ProwlersParagonsCharacter extends ProwlersParagonsActorBase {

  static defineSchema() {
    const fields = foundry.data.fields;
    const requiredInteger = { required: true, nullable: false, integer: true };
    const schema = super.defineSchema();

    // schema.attributes = new fields.SchemaField({
    //   level: new fields.SchemaField({
    //     value: new fields.NumberField({ ...requiredInteger, initial: 1 })
    //   }),
    // });

    // Iterate over ability names and create a new SchemaField for each.
    schema.abilities = new fields.SchemaField(Object.keys(CONFIG.PROWLERS_AND_PARAGONS.abilities).reduce((obj, ability) => {
      obj[ability] = new fields.SchemaField({
        value: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
      });
      return obj;
    }, {}));

    // Iterate over talent names and create a new SchemaField for each.
    schema.talents = new fields.SchemaField(Object.keys(CONFIG.PROWLERS_AND_PARAGONS.talents).reduce((obj, talent) => {
      obj[talent] = new fields.SchemaField({
        value: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
      });
      return obj;
    }, {}));

    schema.package_applied = new fields.StringField({ required: true, blank: true })

    schema.resolve = new fields.SchemaField({
      value: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
      starting: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
    });
    return schema;
  }

  prepareDerivedData() {
    const tmAvg = (this.abilities.toughness.value + this.abilities.might.value) / 2
    const twAvg = (this.abilities.toughness.value + this.abilities.willpower.value) / 2
    const newMaxHealth = Math.max(tmAvg, twAvg)

    if (newMaxHealth > this.health.max) {
      this.health.value += (newMaxHealth - this.health.max)
    } else {
      this.health.value = Math.min(this.health.value, newMaxHealth)
    }
    this.health.max = newMaxHealth
  }

  getRollData() {
    const data = {};

    // Copy the ability scores to the top level, so that rolls can use
    // formulas like `@str.mod + 4`.
    if (this.abilities) {
      for (let [k,v] of Object.entries(this.abilities)) {
        data[k] = foundry.utils.deepClone(v);
      }
    }
    // data.lvl = this.attributes.level.value;

    return data
  }
}