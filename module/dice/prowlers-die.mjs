export class ProwlersDie extends Die {
    constructor(termData = {}) {
        termData.faces = 6;
        super(termData);
      }
    
      /** @inheritdoc */
      static DENOMINATION = "p";
    
      async evaluate() {
        this.modifiers = ["even"];
    
        await super.evaluate();

        return this;
      }
    
      get total() {
        if (!this._evaluated) return null;

        let t = 0;

        this.results.forEach(({result}) =>  {
            if (result%2 === 0) {
                t++
            }
            if (result === 6) {
                t++
            }
          })

        return t;
      }

}