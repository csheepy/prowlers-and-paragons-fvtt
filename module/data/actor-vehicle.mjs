import ProwlersParagonsActorBase from "./base-actor.mjs";

export default class ProwlersParagonsVehicle extends ProwlersParagonsActorBase {

    static defineSchema() {
        const fields = foundry.data.fields;
        const requiredInteger = { required: true, nullable: false, integer: true };
        const schema = super.defineSchema();

        schema.body = new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 });

        schema.speed = new fields.SchemaField({
            land: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
            air: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
            sea: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
        });

        schema.control = new fields.SchemaField({
            land: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
            air: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
            sea: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
        });

        schema.weapons = new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 });

        return schema
    }

    //   prepareDerivedData() {
    //     this.xp = this.cr * this.cr * 100;
    //   }
}