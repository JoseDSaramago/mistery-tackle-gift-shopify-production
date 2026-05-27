if (!customElements.get('product-modal')) {
  customElements.define(
    'product-modal',
    class ProductModal extends ModalDialog {
      constructor() {
        super();
      }

      hide() {
        super.hide();
      }

      show(opener) {
        super.show(opener);
        this.showActiveMedia();
      }

      showActiveMedia() {
        this.querySelectorAll(
          `[data-media-id]:not([data-media-id="${this.openedBy.getAttribute('data-media-id')}"])`
        ).forEach((element) => {
          element.classList.remove('active');
        });
        const activeMedia = this.querySelector(`[data-media-id="${this.openedBy.getAttribute('data-media-id')}"]`);
        const activeMediaTemplate = activeMedia.querySelector('template');
        const activeMediaContent = activeMediaTemplate ? activeMediaTemplate.content : null;
        activeMedia.classList.add('active');
        activeMedia.scrollIntoView();

        const container = this.querySelector('[role="document"]');
        container.scrollLeft = (activeMedia.width - container.clientWidth) / 2;

        if (
          activeMedia.nodeName == 'DEFERRED-MEDIA' &&
          activeMediaContent &&
          activeMediaContent.querySelector('.js-youtube')
        )
          activeMedia.loadContent();
      }
    }
  );
}
// Remove error text from modal
document.addEventListener('DOMContentLoaded', function() {
  const observer = new MutationObserver(function() {
    document.querySelectorAll('.product-media-modal__dialog').forEach(function(modal) {
      if (modal.textContent.includes('#ProductModal-')) {
        modal.childNodes.forEach(function(node) {
          if (node.nodeType === 3 && node.textContent.includes('#ProductModal-')) {
            node.remove();
          }
        });
      }
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });
});