<div class="team-builder-shell" data-team-builder-shell data-team-builder-root>
	<button
		class="pdx-btn team-builder__trigger"
		type="button"
		data-team-builder-trigger
		aria-haspopup="dialog"
		aria-controls="team-builder-modal"
		aria-expanded="false"
	>
		Plan your team
	</button>
	<div class="team-builder-modal" data-team-builder-modal aria-hidden="true" id="team-builder-modal">
		<div class="team-builder-modal__backdrop" data-team-builder-backdrop></div>
		<div class="team-builder-modal__panel" role="dialog" aria-modal="true" aria-labelledby="team-builder-title">
			<header class="team-builder-modal__header">
				<div>
					<p class="panel-heading" id="team-builder-title">Team Builder</p>
					<p class="team-builder__hint">Type a Pokémon name and press Enter.</p>
				</div>
				<button class="team-builder-modal__close" type="button" data-team-builder-close>Close</button>
			</header>
			<div class="team-builder__status" data-team-status aria-live="polite">Add a Pokémon to activate the grid.</div>
			<div class="team-builder__slots">
				<div class="team-builder__slot" data-slot-index="0">
					<div class="team-builder__slot-heading">
						<span>Slot 1</span>
						<strong class="team-builder__slot-name" data-slot-name>Empty</strong>
					</div>
					<input class="team-builder__input" type="text" name="slot-1" placeholder="Search by name" data-slot-input autocomplete="off" />
					<div class="team-builder__slot-types" data-slot-types></div>
					<div class="team-builder__slot-footer">
						<div class="team-builder__slot-sprite">
							<img data-slot-sprite alt="" aria-hidden="true" />
						</div>
						<button class="team-builder__slot-clear" type="button" data-slot-clear>Clear</button>
					</div>
				</div>
				<div class="team-builder__slot" data-slot-index="1">
					<div class="team-builder__slot-heading">
						<span>Slot 2</span>
						<strong class="team-builder__slot-name" data-slot-name>Empty</strong>
					</div>
					<input class="team-builder__input" type="text" name="slot-2" placeholder="Search by name" data-slot-input autocomplete="off" />
					<div class="team-builder__slot-types" data-slot-types></div>
					<div class="team-builder__slot-footer">
						<div class="team-builder__slot-sprite">
							<img data-slot-sprite alt="" aria-hidden="true" />
						</div>
						<button class="team-builder__slot-clear" type="button" data-slot-clear>Clear</button>
					</div>
				</div>
				<div class="team-builder__slot" data-slot-index="2">
					<div class="team-builder__slot-heading">
						<span>Slot 3</span>
						<strong class="team-builder__slot-name" data-slot-name>Empty</strong>
					</div>
					<input class="team-builder__input" type="text" name="slot-3" placeholder="Search by name" data-slot-input autocomplete="off" />
					<div class="team-builder__slot-types" data-slot-types></div>
					<div class="team-builder__slot-footer">
						<div class="team-builder__slot-sprite">
							<img data-slot-sprite alt="" aria-hidden="true" />
						</div>
						<button class="team-builder__slot-clear" type="button" data-slot-clear>Clear</button>
					</div>
				</div>
				<div class="team-builder__slot" data-slot-index="3">
					<div class="team-builder__slot-heading">
						<span>Slot 4</span>
						<strong class="team-builder__slot-name" data-slot-name>Empty</strong>
					</div>
					<input class="team-builder__input" type="text" name="slot-4" placeholder="Search by name" data-slot-input autocomplete="off" />
					<div class="team-builder__slot-types" data-slot-types></div>
					<div class="team-builder__slot-footer">
						<div class="team-builder__slot-sprite">
							<img data-slot-sprite alt="" aria-hidden="true" />
						</div>
						<button class="team-builder__slot-clear" type="button" data-slot-clear>Clear</button>
					</div>
				</div>
				<div class="team-builder__slot" data-slot-index="4">
					<div class="team-builder__slot-heading">
						<span>Slot 5</span>
						<strong class="team-builder__slot-name" data-slot-name>Empty</strong>
					</div>
					<input class="team-builder__input" type="text" name="slot-5" placeholder="Search by name" data-slot-input autocomplete="off" />
					<div class="team-builder__slot-types" data-slot-types></div>
					<div class="team-builder__slot-footer">
						<div class="team-builder__slot-sprite">
							<img data-slot-sprite alt="" aria-hidden="true" />
						</div>
						<button class="team-builder__slot-clear" type="button" data-slot-clear>Clear</button>
					</div>
				</div>
				<div class="team-builder__slot" data-slot-index="5">
					<div class="team-builder__slot-heading">
						<span>Slot 6</span>
						<strong class="team-builder__slot-name" data-slot-name>Empty</strong>
					</div>
					<input class="team-builder__input" type="text" name="slot-6" placeholder="Search by name" data-slot-input autocomplete="off" />
					<div class="team-builder__slot-types" data-slot-types></div>
					<div class="team-builder__slot-footer">
						<div class="team-builder__slot-sprite">
							<img data-slot-sprite alt="" aria-hidden="true" />
						</div>
						<button class="team-builder__slot-clear" type="button" data-slot-clear>Clear</button>
					</div>
				</div>
			</div>
			<div class="team-builder__grid">
				<article class="effect-card team-builder__effect">
					<p class="effect-label">4x Weaknesses</p>
					<div class="chips" data-category-list="4x"></div>
				</article>
				<article class="effect-card team-builder__effect">
					<p class="effect-label">2x Weaknesses</p>
					<div class="chips" data-category-list="2x"></div>
				</article>
				<article class="effect-card team-builder__effect">
					<p class="effect-label">0.5x Resistances</p>
					<div class="chips" data-category-list="0.5x"></div>
				</article>
				<article class="effect-card team-builder__effect">
					<p class="effect-label">0x Immunities</p>
					<div class="chips" data-category-list="0x"></div>
				</article>
			</div>
		</div>
	</div>
</div>
