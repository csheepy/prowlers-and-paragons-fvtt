# Prowlers and Paragons Ultimate Edition foundry system

This is an unofficial Foundry VTT system for running games in [Prowlers and Paragons Ultimate Edition](https://mobiusworldspublishing.com/products/prowlers-paragons-ultimate-edition/). The authors are not affiliated with LakeSide Games or Mobius Worlds Publishing. Prowlers and Paragons and Prowlers and Paragons Ultimate Edition are trademarks of LakeSide Games, Inc.

## Features

Right click dice results in chat for reroll / explosions

Automatic opposed rolls are triggered if you roll with a target selected.

Powers like Density can be set to Toggleable and they'll turn on and off any associated Active Effects you add (like might and toughness upgrades)

A temporary buffs mode for the sheet to make short-term flexible powers increasing Abilities/Talents easier

Pros and Cons should be created as items and dropped onto Powers

### Conditions

If you want a power to apply an effect to an enemy, you can go to the effects tab of the power and add a condition. Normal Active Effect keys like system.abilities.might.value will work here, and there is a special rollModifier key that can be used to add bonuses or penalties. 

There is another special ActiveEffect key 'opposedTrait' that will be replaced by the trait that opposed your roll (for example, if someone rolled Agility defending against Drain, it can automatically drain their Agility).

Targeting powers with this is partially implemented - the value will be overriden no matter what the ActiveEffect's mode is set to.

If you need to set up conditions for multiple powers, like adding a blind effect to a blind power plus some flexible powers like omni-power, create a condition item with the condition you want and drop it onto the power's sheet.

![image](https://github.com/user-attachments/assets/cfbb14ee-36e9-4c84-b57e-9e11ef38576c)

## Thanks

https://github.com/asacolips-projects/boilerplate/ this was a great starting point

The development community on the Foundry VTT discord

My game group for playtesting this

![image](https://github.com/user-attachments/assets/cb19dd34-2aeb-49a3-ad47-e58cb83176c0)
