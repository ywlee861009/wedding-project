export class AbilitySelect {
  constructor(game) {
    this.game = game;
    this._overlay = document.getElementById('ability-select');
    this._cardsContainer = document.getElementById('ability-cards');
  }

  show(choices) {
    this._cardsContainer.innerHTML = '';

    for (const ability of choices) {
      const card = document.createElement('div');
      card.className = 'ability-card';
      card.innerHTML = `
        <div class="ability-icon">${ability.icon}</div>
        <div class="ability-name">${ability.name}</div>
        <div class="ability-desc">${ability.desc}</div>
      `;
      card.addEventListener('click', () => this._pick(ability));
      this._cardsContainer.appendChild(card);
    }

    this._overlay.classList.remove('hidden');
  }

  _pick(ability) {
    ability.apply(this.game.player);
    this._overlay.classList.add('hidden');
    this.game.resumeFromLevelUp();
  }
}
