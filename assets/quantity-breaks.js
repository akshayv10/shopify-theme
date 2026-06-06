if (!customElements.get('quantity-breaks')) {
  customElements.define(
    'quantity-breaks',
    class QuantityBreaks extends HTMLElement {
      constructor() {
        super();
        this.sectionId = this.dataset.sectionId;
        this.formId = this.dataset.formId;
        this.onTierSelect = this.onTierSelect.bind(this);
        this.onVariantChange = this.onVariantChange.bind(this);
      }

      connectedCallback() {
        this.bindTiers();
        this.applySelectedQuantity();
        this.variantChangeUnsubscriber = subscribe(PUB_SUB_EVENTS.variantChange, this.onVariantChange);
      }

      disconnectedCallback() {
        if (this.variantChangeUnsubscriber) this.variantChangeUnsubscriber();
      }

      bindTiers() {
        this.list = this.querySelector('.quantity-breaks__list');
        this.radios = Array.from(this.querySelectorAll('.quantity-breaks__radio'));
        this.radios.forEach((radio) => radio.addEventListener('change', this.onTierSelect));
      }

      get form() {
        return document.getElementById(this.formId);
      }

      get quantityInput() {
        // Prefer the visible quantity_selector block if present, else our hidden input.
        const root = this.closest('product-info') || document;
        return (
          root.querySelector('.product-form__quantity .quantity__input[name="quantity"]') ||
          root.querySelector('.quantity__input[name="quantity"]') ||
          this.querySelector('[data-qb-quantity]')
        );
      }

      get selectedRadio() {
        return this.querySelector('.quantity-breaks__radio:checked') || this.radios[0];
      }

      onTierSelect(event) {
        const radio = event.target;
        this.querySelectorAll('.quantity-breaks__tier').forEach((tier) => {
          tier.classList.toggle('is-selected', tier.contains(radio));
        });
        this.applyQuantity(radio.dataset.qbQuantityValue);
      }

      applySelectedQuantity() {
        const radio = this.selectedRadio;
        if (radio) this.applyQuantity(radio.dataset.qbQuantityValue);
      }

      applyQuantity(quantity) {
        const input = this.quantityInput;
        if (!input || !quantity) return;
        input.value = quantity;
        // Keep quantity-input.js / price-per-item.js in sync with the new value.
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }

      onVariantChange(event) {
        const { sectionId, html, variant } = event.data;
        if (sectionId !== this.sectionId) return;

        if (html) {
          const updated = html.getElementById(`QuantityBreaks-${this.sectionId}`);
          if (!updated) {
            this.hidden = true;
            return;
          }
          this.hidden = false;
          const previousIndex = this.radios.indexOf(this.selectedRadio);
          this.innerHTML = updated.innerHTML;
          this.bindTiers();
          // Restore the previously selected tier when it still exists.
          if (previousIndex > -1 && this.radios[previousIndex] && !this.radios[previousIndex].disabled) {
            this.radios.forEach((radio) => {
              radio.checked = false;
            });
            this.radios[previousIndex].checked = true;
            this.querySelectorAll('.quantity-breaks__tier').forEach((tier, index) => {
              tier.classList.toggle('is-selected', index === previousIndex);
            });
          }
          this.applySelectedQuantity();
        }

        this.toggleAttribute('data-qb-unavailable', !variant || variant.available === false);
      }
    }
  );
}
