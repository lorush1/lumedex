<script lang="ts">
  import {
    createRegistryState,
    getRegistryView,
    type PokemonRegistryData
  } from '$lib/pokemonRegistry';

  export let pokemon: PokemonRegistryData;

  let state = createRegistryState();
  $: view = getRegistryView(pokemon, state);
</script>

<section>
  {#if view.list.length > 1}
    <div>
      {#each view.list as form, i}
        <button type="button" aria-pressed={i === state.active} onclick={() => (state.active = i)} title={form.label || form.id}>
          {#if form.icon}
            <img src={form.icon} alt={form.label || form.id} width="22" height="22" />
          {:else}
            <span>{(form.label || form.id).slice(0, 1).toUpperCase()}</span>
          {/if}
        </button>
      {/each}
    </div>
  {/if}

  <div>
    <label>
      <input type="checkbox" bind:checked={state.shiny} />
      {state.shiny ? 'Shiny' : 'Default'}
    </label>
    <label>
      <input type="checkbox" bind:checked={state.female} />
      {state.female ? 'Female' : 'Male'}
    </label>
  </div>

  {#if view.spriteUrl}
    <img src={view.spriteUrl} alt={view.current?.label || pokemon?.name} />
    <p>{view.current?.label || pokemon?.name}</p>
  {/if}
</section>
