export type Sprites = {
  front_default?: string | null;
  front_shiny?: string | null;
  front_female?: string | null;
  front_shiny_female?: string | null;
};

export type Variety = {
  id: string;
  label?: string;
  icon?: string | null;
  sprites: Sprites;
};

export type PokemonRegistryData = {
  name: string;
  sprites: Sprites;
  varieties?: Variety[];
};

export type RegistryState = {
  active: number;
  shiny: boolean;
  female: boolean;
};

export type RegistryView = {
  list: Variety[];
  current: Variety;
  spriteUrl: string;
};

export const getVarieties = (pokemon: PokemonRegistryData): Variety[] =>
  pokemon?.varieties?.length
    ? pokemon.varieties
    : [{ id: pokemon?.name ?? 'default', label: pokemon?.name, sprites: pokemon?.sprites ?? {} }];

export const getCurrentVariety = (list: Variety[], active: number): Variety =>
  list[Math.min(active, Math.max(0, list.length - 1))];

export const getSpriteUrl = (sprites: Sprites, shiny: boolean, female: boolean): string =>
  shiny
    ? female
      ? sprites.front_shiny_female || sprites.front_shiny || sprites.front_default || ''
      : sprites.front_shiny || sprites.front_default || ''
    : female
      ? sprites.front_female || sprites.front_default || ''
      : sprites.front_default || '';

export const createRegistryState = (): RegistryState => ({
  active: 0,
  shiny: false,
  female: false
});

export const getRegistryView = (pokemon: PokemonRegistryData, state: RegistryState): RegistryView => {
  const list = getVarieties(pokemon);
  const current = getCurrentVariety(list, state.active);
  return {
    list,
    current,
    spriteUrl: getSpriteUrl(current?.sprites ?? {}, state.shiny, state.female)
  };
};
