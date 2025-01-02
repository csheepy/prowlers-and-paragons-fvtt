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

    schema.biography = new fields.SchemaField({
      misc: new fields.StringField({ required: true, blank: true }),
      alias: new fields.StringField({ required: true, blank: true }),
      description: new fields.StringField({ required: true, blank: true }),
      motivation: new fields.StringField({ required: true, blank: true }),
      quote: new fields.StringField({ required: true, blank: true }),
      connections: new fields.StringField({ required: true, blank: true }),
      details: new fields.StringField({ required: true, blank: true }),
      origin: new fields.StringField({ required: true, blank: true })
    })

    return schema;
  }

  prepareDerivedData() {

    // max health
    const tmAvg = Math.ceil((this.abilities.toughness.value + this.abilities.might.value) / 2)
    const twAvg = Math.ceil((this.abilities.toughness.value + this.abilities.willpower.value) / 2)
    const newMaxHealth = Math.max(tmAvg, twAvg)

    if (newMaxHealth > this.health.max) {
      this.health.value += (newMaxHealth - this.health.max)
    } else {
      this.health.value = Math.min(this.health.value, newMaxHealth)
    }
    this.health.max = newMaxHealth


    // edge

    //danger sense substitutes for perception
    const dangerSense = this.parent.items.find(p => p.name === 'Danger Sense')
    const per = (dangerSense?.system.rank ?? 0) + this.abilities.perception.value
    this.edge.value = per + Math.max(this.abilities.agility.value, this.abilities.intellect.value)

    // lightning reflexes adds 6
    const lightningReflexes = this.parent.items.find(p => p.name === 'Lightning Reflexes')
    if (lightningReflexes) {
      this.edge.value += 6;
    }

    // super-speed substitutes its rank * 3
    const superSpeed = this.parent.items.find(p => p.name === 'Super Speed')
    if (superSpeed) {
      this.edge.value = Math.max(this.edge.value,superSpeed.system.rank * 3)
    }

  }

  getRollData() {
    const data = {};

    // Copy the ability scores to the top level, so that rolls can use
    // formulas like `@str.mod + 4`.
    if (this.abilities) {
      for (let [k, v] of Object.entries(this.abilities)) {
        data[k] = foundry.utils.deepClone(v);
      }
    }
    // data.lvl = this.attributes.level.value;

    return data
  }
}