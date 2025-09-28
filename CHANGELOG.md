# CHANGELOG

## 1.7.0

- the sheet will now display the original unmodified value of an ability or talent that has been modified (like by an effect)

- the sheet will now highlight any ability or talent that has been modified (like by an effect)

- the inline description of a power on the play tab will now additionally display any pros and cons the power has

- added a verbose mode to calculating power costs that can be accessed through the console `game.actors.getName('Herald').calculateSpentPoints(verbose=true)`


## 1.6.0
- add toggle to display power description in play tab; clicking power description sends it to chat

- update item feature schema to allow negative cost

- add miscellaneous gear section to actor sheet

## 1.5.0
- fix minion description not persisting

- removed unused 'item' type of item

- add 'conditions' active effects to powers that can be applied to targets.

    - these can be added under the effects tab on powers
    - the 'opposedTrait' key will be replaced with the trait from an opposed roll
    - the 'rollModifier' key will apply a modifier to rolls (for penalties like Blind)

## 1.4.0

- Sheet portrait is now larger and respects aspect ratio

## 1.3.0

- Rerolling a roll will now update any rolls that opposed that roll with the new result

- add ui warning if you dismiss the trait selection dialog

- fix actor name not appearing on opposed rolls

- adds a notification if target fails to respond in an opposed roll

- added Psychic to power sources

## 1.2.0

- add rolled initiative game setting

- add traditional results game setting

- add sheet option to override Edge

- add game setting to reduce swinginess of rolls

- improve UI for default rank powers

## 1.1.0

- add UI notification to make the intent of temporary mode more clear

- add line in the readme about how pros and cons are implemented

- rework Powers UI a little to try to make how Pros and Cons are implemented more clear

- fix temporary outline for talents not appearing in temp. buffs mode

- foundry 13 compatability changes: refactor hooks, fix activeeffect creation. this version should work with both 12 and 13

- add Playwright and start adding test cases

- improve speed of package change

- fixed applying damage to minions


## 1.0.0

Initial release