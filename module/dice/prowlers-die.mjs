export class ProwlersDie extends Die {
    constructor(termData = {}) {
        termData.faces = 6;
        super(termData);
      }
    
      /** @inheritdoc */
      static DENOMINATION = "p";
    
      async evaluate() {
        this.modifiers = ['even']
    
        await super.evaluate();

        return this;
      }
    
      // count 6s as *twice as even*
      countEven(modifier) {
        if (game.settings.get('prowlers-and-paragons', 'reducedSwinginess')) {
          super.countEven(modifier);
        } else {
          for ( let r of this.results ) {
            r.success = ( (r.result % 2) === 0 );
            r.count = r.success ? 1 : 0;

            r.count = ((r.result % 6) === 0) ? 2 : r.count;
          }
        }
      }

}