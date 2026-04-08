<script lang="ts">
  type RawStat = { stat: { name: string }; base_stat: number };
  type PokemonTacticsInput = {
    types?: string[];
    stats?: RawStat[] | Record<string, number>;
    baseStats?: Record<string, number>;
  };
  type TypeChartEntry = { double: string[]; half: string[]; zero: string[] };
  const TYPE_CHART: Record<string, TypeChartEntry> = {
    normal: { double: [], half: ['rock', 'steel'], zero: ['ghost'] },
    fire: { double: ['grass', 'ice', 'bug', 'steel'], half: ['fire', 'water', 'rock', 'dragon'], zero: [] },
    water: { double: ['fire', 'ground', 'rock'], half: ['water', 'grass', 'dragon'], zero: [] },
    electric: { double: ['water', 'flying'], half: ['electric', 'grass', 'dragon'], zero: ['ground'] },
    grass: { double: ['water', 'ground', 'rock'], half: ['fire', 'grass', 'poison', 'flying', 'bug', 'dragon', 'steel'], zero: [] },
    ice: { double: ['grass', 'ground', 'flying', 'dragon'], half: ['fire', 'water', 'ice', 'steel'], zero: [] },
    fighting: { double: ['normal', 'ice', 'rock', 'dark', 'steel'], half: ['poison', 'flying', 'psychic', 'bug', 'fairy'], zero: ['ghost'] },
    poison: { double: ['grass', 'fairy'], half: ['poison', 'ground', 'rock', 'ghost'], zero: ['steel'] },
    ground: { double: ['fire', 'electric', 'poison', 'rock', 'steel'], half: ['grass', 'bug'], zero: ['flying'] },
    flying: { double: ['grass', 'fighting', 'bug'], half: ['electric', 'rock', 'steel'], zero: [] },
    psychic: { double: ['fighting', 'poison'], half: ['psychic', 'steel'], zero: ['dark'] },
    bug: { double: ['grass', 'psychic', 'dark'], half: ['fire', 'fighting', 'poison', 'flying', 'ghost', 'steel', 'fairy'], zero: [] },
    rock: { double: ['fire', 'ice', 'flying', 'bug'], half: ['fighting', 'ground', 'steel'], zero: [] },
    ghost: { double: ['psychic', 'ghost'], half: ['dark'], zero: ['normal'] },
    dragon: { double: ['dragon'], half: ['steel'], zero: ['fairy'] },
    dark: { double: ['psychic', 'ghost'], half: ['fighting', 'dark', 'fairy'], zero: [] },
    steel: { double: ['ice', 'rock', 'fairy'], half: ['fire', 'water', 'electric', 'steel'], zero: [] },
    fairy: { double: ['fighting', 'dragon', 'dark'], half: ['fire', 'poison', 'steel'], zero: [] }
  };
  const STAT_KEYS = [
    { label: 'HP', keys: ['hp'] },
    { label: 'Attack', keys: ['attack'] },
    { label: 'Defense', keys: ['defense'] },
    { label: 'Sp. Atk', keys: ['special-attack', 'specialAttack', 'spAttack', 'spatk'] },
    { label: 'Sp. Def', keys: ['special-defense', 'specialDefense', 'spDefense', 'spdef'] },
    { label: 'Speed', keys: ['speed'] }
  ];
  const MAX_STAT = 255;
  export let pokemon: PokemonTacticsInput;
  const normalizeType = (value?: string) => value?.toLowerCase().trim() ?? '';
  const titleCase = (value: string) =>
    value
      .split(/[- ]/)
      .map((segment) => (segment ? segment[0].toUpperCase() + segment.slice(1) : ''))
      .join(' ');
  const recordFromStats = () => {
    const record: Record<string, number> = {};
    if (Array.isArray(pokemon?.stats)) {
      pokemon.stats.forEach((entry) => {
        record[entry.stat.name] = entry.base_stat;
      });
    }
    if (pokemon?.stats && !Array.isArray(pokemon.stats)) {
      Object.assign(record, pokemon.stats);
    }
    if (pokemon?.baseStats) {
      Object.assign(record, pokemon.baseStats);
    }
    return record;
  };
  const pickValue = (keys: string[], record: Record<string, number>) =>
    keys.reduce<number | undefined>((value, key) => value ?? record[key], undefined) ?? 0;
  const resolveMultiplier = (attackType: string, defenses: string[]) => {
    let multiplier = 1;
    for (const defense of defenses) {
      const chart = TYPE_CHART[attackType];
      if (!chart) continue;
      if (chart.zero.includes(defense)) {
        multiplier = 0;
        break;
      }
      if (chart.double.includes(defense)) multiplier *= 2;
      if (chart.half.includes(defense)) multiplier *= 0.5;
    }
    return multiplier;
  };
  const attackTypes = Object.keys(TYPE_CHART);
  $: statRecord = recordFromStats();
  $: stats = STAT_KEYS.map(({ label, keys }) => ({
    label,
    value: pickValue(keys, statRecord)
  }));
  $: normalizedTypes = (pokemon?.types ?? []).map(normalizeType).filter(Boolean);
  $: effectiveness = attackTypes.reduce(
    (acc, attackType) => {
      const multiplier = resolveMultiplier(attackType, normalizedTypes);
      if (multiplier === 0) acc.immunities.push(attackType);
      else if (multiplier >= 2) acc.weaknesses.push(attackType);
      else if (multiplier <= 0.5) acc.resistances.push(attackType);
      return acc;
    },
    { weaknesses: [] as string[], resistances: [] as string[], immunities: [] as string[] }
  );
</script>

<section class="pokemon-tactics">
  <div class="panel">
    <div class="panel-heading">Type Effectiveness</div>
    <div class="effectiveness-grid">
      {#each [
        { label: '2× Weaknesses', values: effectiveness.weaknesses },
        { label: '0.5× Resistances', values: effectiveness.resistances },
        { label: '0× Immunities', values: effectiveness.immunities }
      ] as category}
        <article class="effect-card">
          <div class="effect-label">{category.label}</div>
          <div class="chips">
            {#if category.values.length}
              {#each category.values as type}
                <span class="chip">{titleCase(type)}</span>
              {/each}
            {:else}
              <span class="chip muted">None</span>
            {/if}
          </div>
        </article>
      {/each}
    </div>
  </div>
  <div class="panel">
    <div class="panel-heading">Base Stats</div>
    <div class="stats-grid">
      {#each stats as stat}
        <div class="stat-row">
          <span class="stat-label">{stat.label}</span>
          <div class="stat-bar">
            <div class="stat-fill" style={`width:${Math.min(100, (stat.value / MAX_STAT) * 100)}%`}></div>
          </div>
          <span class="stat-number">{stat.value}</span>
        </div>
      {/each}
    </div>
  </div>
</section>

