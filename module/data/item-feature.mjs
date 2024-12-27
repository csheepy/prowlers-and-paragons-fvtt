import ProwlersParagonsItemBase from "./base-item.mjs";

// Vehicle / HQ features
export default class ProwlersParagonsFeature extends ProwlersParagonsItemBase {

    static defineSchema() {
        const fields = foundry.data.fields;
        const schema = super.defineSchema();
    
        schema.cost = new fields.NumberField({ required: true, nullable: false, integer: true, initial: 1, min: 1});
        schema.for = new fields.StringField({ choices: ['vehicle','hq'] })  
        
        return schema
    }

    forVehicle() {
        return this.for === 'vehicle'
    }

    forHQ() {
        return this.for === 'hq'
    }
}