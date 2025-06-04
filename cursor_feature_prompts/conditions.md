Finish implementing the conditions feature that I've started.

We want to be able to add 'condition' active effects to Powers, which can be applied to targets using the Add Condition button in roll results.
We need to add the Conditions category of Active Effects for Powers in module\helpers\effects.mjs
We need powers, when they roll, to clone their condition active effects into a 'conditions' key in the options passed to the roll. 
When the apply conditions button hook is called, copy the conditions from the message's roll to the selected or targeted actor. Make the duration in rounds equal to half the net sucesses of the roll.