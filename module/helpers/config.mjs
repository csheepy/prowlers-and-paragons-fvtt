export const PROWLERS_AND_PARAGONS = {};

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
PROWLERS_AND_PARAGONS.abilities = {
  agility: 'PROWLERS_AND_PARAGONS.Ability.Agi.long',
  intellect: 'PROWLERS_AND_PARAGONS.Ability.Int.long',
  might: 'PROWLERS_AND_PARAGONS.Ability.Mgt.long',
  perception: 'PROWLERS_AND_PARAGONS.Ability.Per.long',
  toughness: 'PROWLERS_AND_PARAGONS.Ability.Tgh.long',
  willpower: 'PROWLERS_AND_PARAGONS.Ability.Wil.long',
};

PROWLERS_AND_PARAGONS.packages = {
  civilian: 'PROWLERS_AND_PARAGONS.Packages.civilian',
  hero: 'PROWLERS_AND_PARAGONS.Packages.hero',
  superhero: 'PROWLERS_AND_PARAGONS.Packages.superhero',
  clear: 'PROWLERS_AND_PARAGONS.Packages.clear'
}
PROWLERS_AND_PARAGONS.power_rank_types = {
  power: 'PROWLERS_AND_PARAGONS.Item.Power.power_rank_type.power',
  baseline: 'PROWLERS_AND_PARAGONS.Item.Power.power_rank_type.baseline',
  default: 'PROWLERS_AND_PARAGONS.Item.Power.power_rank_type.default',
  special: 'PROWLERS_AND_PARAGONS.Item.Power.power_rank_type.special'
}

PROWLERS_AND_PARAGONS.roll_difficulties = {
  easy: "PROWLERS_AND_PARAGONS.Roll.Difficulties.Easy",
  average: "PROWLERS_AND_PARAGONS.Roll.Difficulties.Average",
  hard: "PROWLERS_AND_PARAGONS.Roll.Difficulties.Hard",
  daunting: "PROWLERS_AND_PARAGONS.Roll.Difficulties.Daunting",
  brutal: "PROWLERS_AND_PARAGONS.Roll.Difficulties.Brutal",
  inhuman: "PROWLERS_AND_PARAGONS.Roll.Difficulties.Inhuman",
  superhuman: "PROWLERS_AND_PARAGONS.Roll.Difficulties.Superhuman",
  legendary: "PROWLERS_AND_PARAGONS.Roll.Difficulties.Legendary",
  godlike: "PROWLERS_AND_PARAGONS.Roll.Difficulties.Godlike"
}
PROWLERS_AND_PARAGONS.roll_difficulties_leveled = {
  easy: "PROWLERS_AND_PARAGONS.Roll.DifficultiesForRollMessage.Easy",
  average: "PROWLERS_AND_PARAGONS.Roll.DifficultiesForRollMessage.Average",
  hard: "PROWLERS_AND_PARAGONS.Roll.DifficultiesForRollMessage.Hard",
  daunting: "PROWLERS_AND_PARAGONS.Roll.DifficultiesForRollMessage.Daunting",
  brutal: "PROWLERS_AND_PARAGONS.Roll.DifficultiesForRollMessage.Brutal",
  inhuman: "PROWLERS_AND_PARAGONS.Roll.DifficultiesForRollMessage.Inhuman",
  superhuman: "PROWLERS_AND_PARAGONS.Roll.DifficultiesForRollMessage.Superhuman",
  legendary: "PROWLERS_AND_PARAGONS.Roll.DifficultiesForRollMessage.Legendary",
  godlike: "PROWLERS_AND_PARAGONS.Roll.DifficultiesForRollMessage.Godlike"
}
PROWLERS_AND_PARAGONS.roll_difficulty_values = {
  easy: 0,
  average: 1,
  hard: 2,
  daunting: 3,
  brutal: 4,
  inhuman: 5,
  superhuman: 6,
  legendary: 9,
  godlike: 12
}

PROWLERS_AND_PARAGONS.power_sources = {
  magic: 'PROWLERS_AND_PARAGONS.Item.Power.source.magic',
  innate: 'PROWLERS_AND_PARAGONS.Item.Power.source.innate',
  super: 'PROWLERS_AND_PARAGONS.Item.Power.source.super',
  tech: 'PROWLERS_AND_PARAGONS.Item.Power.source.tech',
  trained: 'PROWLERS_AND_PARAGONS.Item.Power.source.trained',
}

PROWLERS_AND_PARAGONS.power_ranges = {
  self: 'PROWLERS_AND_PARAGONS.Item.Power.range.self',
  touch: 'PROWLERS_AND_PARAGONS.Item.Power.range.touch',
  ranged: 'PROWLERS_AND_PARAGONS.Item.Power.range.ranged',
  zone: 'PROWLERS_AND_PARAGONS.Item.Power.range.zone',
  special: 'PROWLERS_AND_PARAGONS.Item.Power.range.special',
}

PROWLERS_AND_PARAGONS.abilityAbbreviations = {
  agility: 'PROWLERS_AND_PARAGONS.Ability.Agi.abbr',
  intellect: 'PROWLERS_AND_PARAGONS.Ability.Int.abbr',
  might: 'PROWLERS_AND_PARAGONS.Ability.Mgt.abbr',
  perception: 'PROWLERS_AND_PARAGONS.Ability.Per.abbr',
  toughness: 'PROWLERS_AND_PARAGONS.Ability.Tgh.abbr',
  willpower: 'PROWLERS_AND_PARAGONS.Ability.Wil.abbr',
};

PROWLERS_AND_PARAGONS.talents = {
  academics: 'PROWLERS_AND_PARAGONS.Talent.academics',
  charm: 'PROWLERS_AND_PARAGONS.Talent.charm',
  command: 'PROWLERS_AND_PARAGONS.Talent.command',
  covert: 'PROWLERS_AND_PARAGONS.Talent.covert',
  investigation: 'PROWLERS_AND_PARAGONS.Talent.investigation',
  medicine: 'PROWLERS_AND_PARAGONS.Talent.medicine',
  professional: 'PROWLERS_AND_PARAGONS.Talent.professional',
  science: 'PROWLERS_AND_PARAGONS.Talent.science',
  streetwise: 'PROWLERS_AND_PARAGONS.Talent.streetwise',
  survival: 'PROWLERS_AND_PARAGONS.Talent.survival',
  technology: 'PROWLERS_AND_PARAGONS.Talent.technology',
  vehicles: 'PROWLERS_AND_PARAGONS.Talent.vehicles',
};