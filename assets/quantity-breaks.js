if (!customElements.get('quantity-breaks')) {
  customElements.define(
    'quantity-breaks',
    class QuantityBreaks extends HTMLElement {
      constructor() {
        super();
        this.sectionId = this.dataset.sectionId;
        this.unitPrice = parseInt(this.dataset.unitPrice, 10) || 0;
        this.moneyFormat = this.dataset.moneyFormat || '${{amount}}';
        this.cards = Array.from(this.querySelectorAll('.quantity-breaks__card'));
        this.variantChangeUnsubscriber = undefined;
      }

      connectedCallback() {
        this.cards.forEach((card) => {
          const radio = card.querySelector('.quantity-breaks__radio');
          radio.addEventListener('change', () => this.onSelect(card));
        });

        // Apply the pre-selected (highlighted) tier on load.
        const selected = this.querySelector('.quantity-breaks__radio:checked');
        if (selected) this.onSelect(selected.closest('.quantity-breaks__card'));

        if (typeof subscribe === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
          this.variantChangeUnsubscriber = subscribe(PUB_SUB_EVENTS.variantChange, (event) => {
            const variant = event.data && event.data.variant;
            if (variant && typeof variant.price === 'number') {
              this.unitPrice = variant.price;
              this.refreshPricing();
            }
          });
        }
      }

      disconnectedCallback() {
        if (this.variantChangeUnsubscriber) this.variantChangeUnsubscriber();
      }

      onSelect(card) {
        this.cards.forEach((c) => c.classList.toggle('is-selected', c === card));
        this.setQuantity(parseInt(card.dataset.qty, 10) || 1);
      }

      setQuantity(qty) {
        const inputs = [
          document.getElementById(`Quantity-${this.sectionId}`),
          document.getElementById(`StickyQuantity-${this.sectionId}`),
        ];
        inputs.forEach((input) => {
          if (!input) return;
          input.value = qty;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        });
      }

      refreshPricing() {
        this.cards.forEach((card) => {
          const qty = parseInt(card.dataset.qty, 10) || 1;
          const discount = parseFloat(card.dataset.discount) || 0;
          const originalTotal = this.unitPrice * qty;
          const discountedTotal = Math.round((originalTotal * (100 - discount)) / 100);
          const perUnit = Math.round(discountedTotal / qty);

          const totalEl = card.querySelector('[data-qb-total]');
          const compareEl = card.querySelector('[data-qb-compare]');
          const perUnitEl = card.querySelector('[data-qb-per-unit]');

          if (totalEl) totalEl.textContent = this.formatMoney(discountedTotal);
          if (compareEl) compareEl.textContent = this.formatMoney(originalTotal);
          if (perUnitEl) perUnitEl.textContent = `${this.formatMoney(perUnit)}/ea`;
        });
      }

      formatMoney(cents) {
        const amount = (cents / 100).toFixed(2);
        return this.moneyFormat.replace(/\{\{\s*amount\s*\}\}/, amount);
      }
    }
  );
}
