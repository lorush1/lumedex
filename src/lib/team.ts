type PokemonResponse = {
  name: string;
  types: { type: { name: string } }[];
  sprites: {
    front_default?: string;
    other?: {
      'official-artwork'?: {
        front_default?: string;
      };
    };
  };
};

type TypeResponse = {
  damage_relations: {
    double_damage_from: { name: string }[];
    half_damage_from: { name: string }[];
    no_damage_from: { name: string }[];
  };
};

type TypeRelations = {
  double: Set<string>;
  half: Set<string>;
  none: Set<string>;
};

type SlotInfo = {
  name: string;
  sprite: string;
  types: string[];
  multipliers: Record<AttackType, number>;
};

type SlotContext = {
  index: number;
  input: HTMLInputElement | null;
  name: HTMLElement | null;
  types: HTMLElement | null;
  sprite: HTMLImageElement | null;
  clear: HTMLButtonElement | null;
  lastQuery: string;
  cleanup?: () => void;
};

const DEFAULT_STATUS = 'Add a Pokémon to activate the grid.';
const ATTACK_TYPES = [
  'normal',
  'fire',
  'water',
  'electric',
  'grass',
  'ice',
  'fighting',
  'poison',
  'ground',
  'flying',
  'psychic',
  'bug',
  'rock',
  'ghost',
  'dragon',
  'dark',
  'steel',
  'fairy',
] as const;

type AttackType = (typeof ATTACK_TYPES)[number];

const TYPE_CACHE = new Map<string, TypeRelations>();
const POKEMON_CACHE = new Map<string, SlotInfo>();

const formatLabel = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

const fetchTypeRelations = async (typeName: string): Promise<TypeRelations | undefined> => {
  const normalized = typeName.toLowerCase();
  if (TYPE_CACHE.has(normalized)) return TYPE_CACHE.get(normalized);
  try {
    const response = await fetch(`https://pokeapi.co/api/v2/type/${normalized}`);
    if (!response.ok) return undefined;
    const data = (await response.json()) as TypeResponse;
    const relations: TypeRelations = {
      double: new Set(data.damage_relations.double_damage_from.map((entry) => entry.name)),
      half: new Set(data.damage_relations.half_damage_from.map((entry) => entry.name)),
      none: new Set(data.damage_relations.no_damage_from.map((entry) => entry.name)),
    };
    TYPE_CACHE.set(normalized, relations);
    return relations;
  } catch {
    return undefined;
  }
};

const computeMultipliers = async (types: string[]) => {
  const relations = await Promise.all(types.map((type) => fetchTypeRelations(type)));
  const output = {} as Record<AttackType, number>;
  for (const attack of ATTACK_TYPES) {
    let multiplier = 1;
    for (const relation of relations) {
      if (!relation) continue;
      if (relation.none.has(attack)) {
        multiplier = 0;
        break;
      }
      if (relation.double.has(attack)) multiplier *= 2;
      if (relation.half.has(attack)) multiplier *= 0.5;
    }
    output[attack] = multiplier;
  }
  return output;
};

const fetchPokemonEntry = async (query: string) => {
  if (POKEMON_CACHE.has(query)) return POKEMON_CACHE.get(query);
  try {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${query}`);
    if (!response.ok) return null;
    const data = (await response.json()) as PokemonResponse;
    const types = data.types.map((entry) => entry.type.name);
    const multipliers = await computeMultipliers(types);
    const sprite =
      data.sprites?.other?.['official-artwork']?.front_default ??
      data.sprites?.front_default ??
      '';
    const entry = { name: data.name, types, sprite, multipliers };
    POKEMON_CACHE.set(query, entry);
    return entry;
  } catch {
    return null;
  }
};

const renderChips = (element: HTMLElement | null, values: Set<string>) => {
  if (!element) return;
  element.innerHTML = '';
  const list = Array.from(values).sort();
  if (!list.length) {
    const placeholder = document.createElement('span');
    placeholder.className = 'chip muted';
    placeholder.textContent = 'None';
    element.appendChild(placeholder);
    return;
  }
  list.forEach((value) => {
    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.textContent = formatLabel(value);
    element.appendChild(chip);
  });
};

export const mountTeamBuilder = (root: HTMLElement) => {
  if (!root) return () => {};
  const modal = root.querySelector<HTMLElement>('[data-team-builder-modal]');
  const trigger = root.querySelector<HTMLButtonElement>('[data-team-builder-trigger]');
  const closeButton = root.querySelector<HTMLButtonElement>('[data-team-builder-close]');
  const backdrop = root.querySelector<HTMLElement>('[data-team-builder-backdrop]');
  const statusElement = root.querySelector<HTMLElement>('[data-team-status]');
  const lists: Record<'4x' | '2x' | '0.5x' | '0x', HTMLElement | null> = {
    '4x': root.querySelector<HTMLElement>('[data-category-list="4x"]'),
    '2x': root.querySelector<HTMLElement>('[data-category-list="2x"]'),
    '0.5x': root.querySelector<HTMLElement>('[data-category-list="0.5x"]'),
    '0x': root.querySelector<HTMLElement>('[data-category-list="0x"]'),
  };
  const slotContexts: SlotContext[] = Array.from({ length: 6 }, (_, index) => {
    const slot = root.querySelector<HTMLElement>(`[data-slot-index="${index}"]`);
    return {
      index,
      input: slot?.querySelector<HTMLInputElement>('[data-slot-input]') ?? null,
      name: slot?.querySelector<HTMLElement>('[data-slot-name]') ?? null,
      types: slot?.querySelector<HTMLElement>('[data-slot-types]') ?? null,
      sprite: slot?.querySelector<HTMLImageElement>('[data-slot-sprite]') ?? null,
      clear: slot?.querySelector<HTMLButtonElement>('[data-slot-clear]') ?? null,
      lastQuery: '',
    };
  });
  const slotState: Array<SlotInfo | null> = Array(6).fill(null);
  let statusTimer: ReturnType<typeof setTimeout> | null = null;
  const setStatus = (message: string, temporary = false) => {
    if (!statusElement) return;
    statusElement.textContent = message;
    if (statusTimer) {
      clearTimeout(statusTimer);
      statusTimer = null;
    }
    if (temporary) {
      statusTimer = setTimeout(() => updateTeamStatus(), 3000);
    }
  };
  const updateTeamStatus = () => {
    const filled = slotState.filter(Boolean).length;
    const message = filled ? `${filled}/6 slots filled` : DEFAULT_STATUS;
    setStatus(message);
  };
  const updateDefenseGrid = () => {
    const categories: Record<'4x' | '2x' | '0.5x' | '0x', Set<string>> = {
      '4x': new Set(),
      '2x': new Set(),
      '0.5x': new Set(),
      '0x': new Set(),
    };
    for (const attack of ATTACK_TYPES) {
      const values = slotState
        .map((slot) => slot?.multipliers[attack])
        .filter((value): value is number => typeof value === 'number');
      if (!values.length) continue;
      const maxWeak = Math.max(...values);
      const minRes = Math.min(...values);
      if (maxWeak >= 4) categories['4x'].add(attack);
      else if (maxWeak >= 2) categories['2x'].add(attack);
      if (minRes <= 0) categories['0x'].add(attack);
      else if (minRes <= 0.5) categories['0.5x'].add(attack);
    }
    renderChips(lists['4x'], categories['4x']);
    renderChips(lists['2x'], categories['2x']);
    renderChips(lists['0.5x'], categories['0.5x']);
    renderChips(lists['0x'], categories['0x']);
  };
  const setSlot = (index: number, entry: SlotInfo | null) => {
    slotState[index] = entry;
    const context = slotContexts[index];
    if (!context) return;
    context.lastQuery = entry ? entry.name.toLowerCase() : '';
    if (entry) {
      context.name && (context.name.textContent = formatLabel(entry.name));
      if (context.input) context.input.value = entry.name;
      if (context.types) context.types.innerHTML = entry.types
        .map((type) => `<span class="chip">${formatLabel(type)}</span>`)
        .join('');
      if (context.sprite) {
        context.sprite.src = entry.sprite || '';
        context.sprite.alt = entry.types.map(formatLabel).join(' / ');
        context.sprite.classList.toggle('team-builder__sprite-visible', Boolean(entry.sprite));
      }
    } else {
      context.name && (context.name.textContent = 'Empty');
      if (context.input) context.input.value = '';
      if (context.types) context.types.innerHTML = '';
      if (context.sprite) {
        context.sprite.removeAttribute('src');
        context.sprite.alt = '';
        context.sprite.classList.remove('team-builder__sprite-visible');
      }
    }
    context.input && delete context.input.dataset.invalid;
    updateDefenseGrid();
    updateTeamStatus();
  };
  const clearSlot = (context: SlotContext) => {
    context.lastQuery = '';
    setSlot(context.index, null);
  };
  const handleSlotInput = (context: SlotContext) => {
    const raw = context.input?.value ?? '';
    const normalized = raw.trim().toLowerCase();
    if (!normalized) return;
    if (context.lastQuery === normalized) return;
    context.lastQuery = normalized;
    if (context.input) context.input.dataset.loading = '1';
    fetchPokemonEntry(normalized)
      .then((entry) => {
        if (!entry) {
          context.input && (context.input.dataset.invalid = '1');
          context.lastQuery = '';
          setStatus(`No Pokémon found for "${raw.trim()}"`, true);
          return;
        }
        context.input && delete context.input.dataset.invalid;
        setSlot(context.index, entry);
      })
      .catch(() => {
        context.input && (context.input.dataset.invalid = '1');
        context.lastQuery = '';
        setStatus('Unable to reach PokéAPI', true);
      })
      .finally(() => {
        if (context.input) delete context.input.dataset.loading;
      });
  };
  slotContexts.forEach((context) => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        handleSlotInput(context);
      }
    };
    const onBlur = () => handleSlotInput(context);
    const onClear = () => clearSlot(context);
    context.input?.addEventListener('keydown', onKeyDown);
    context.input?.addEventListener('blur', onBlur);
    context.clear?.addEventListener('click', onClear);
    context.cleanup = () => {
      context.input?.removeEventListener('keydown', onKeyDown);
      context.input?.removeEventListener('blur', onBlur);
      context.clear?.removeEventListener('click', onClear);
    };
  });
  const toggleBody = (value: boolean) => {
    document.body.classList.toggle('team-builder-active', value);
  };
  const openModal = () => {
    modal?.setAttribute('data-visible', '1');
    modal?.setAttribute('aria-hidden', 'false');
    trigger?.setAttribute('aria-expanded', 'true');
    toggleBody(true);
  };
  const closeModal = () => {
    modal?.removeAttribute('data-visible');
    modal?.setAttribute('aria-hidden', 'true');
    trigger?.setAttribute('aria-expanded', 'false');
    toggleBody(false);
  };
  const handleEscape = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      closeModal();
    }
  };
  trigger?.addEventListener('click', openModal);
  closeButton?.addEventListener('click', closeModal);
  backdrop?.addEventListener('click', closeModal);
  document.addEventListener('keydown', handleEscape);
  updateDefenseGrid();
  updateTeamStatus();
  return () => {
    trigger?.removeEventListener('click', openModal);
    closeButton?.removeEventListener('click', closeModal);
    backdrop?.removeEventListener('click', closeModal);
    document.removeEventListener('keydown', handleEscape);
    slotContexts.forEach((context) => context.cleanup?.());
    toggleBody(false);
    if (statusTimer) {
      clearTimeout(statusTimer);
      statusTimer = null;
    }
  };
};
