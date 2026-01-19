chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "get_active_image") {
    // Search for thumbnail
    const activeWrapper = document.querySelector('.upload-tile__wrapper.active');
    const activeImg = activeWrapper ? activeWrapper.querySelector('img.upload-tile__thumbnail') : null;
    
    if (activeImg) {
      sendResponse({ url: activeImg.src });
    } else {
      // If no active, select first image on Grid
      const firstImg = document.querySelector('.upload-tile__thumbnail');
      if (firstImg) {
        firstImg.click();
        sendResponse({ url: firstImg.src });
      } else {
        sendResponse({ url: null });
      }
    }
  }

  if (request.action === "fill_and_move_next") {
      chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "get_active_image") {
    const activeWrapper = document.querySelector('.upload-tile__wrapper.active');
    const activeImg = activeWrapper ? activeWrapper.querySelector('img.upload-tile__thumbnail') : null;
    
    // Immediately send response
    sendResponse({ url: activeImg ? activeImg.src : null });
    return false;
  }

  if (request.action === "fill_and_move_next") {
    const titleField = document.querySelector('textarea[data-t="asset-title-content-tagger"]');
    const keywordField = document.querySelector('textarea[data-t="content-keywords-ui-textarea"]');

    if (titleField && keywordField) {
      // Setter
      const setNativeValue = (element, value) => {
        try {
          const prototype = Object.getPrototypeOf(element);
          const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');
          if (descriptor && descriptor.set) descriptor.set.call(element, value);
          else element.value = value;
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
        } catch (e) { element.value = value; }
      };

      setNativeValue(titleField, request.title);
      setNativeValue(keywordField, request.keywords);

      const allWrappers = Array.from(document.querySelectorAll('.upload-tile__wrapper'));
      const currentIndex = allWrappers.findIndex(w => w.classList.contains('active'));
      const hasMore = currentIndex !== -1 && allWrappers[currentIndex + 1];

      sendResponse({ status: "success", hasMore: !!hasMore });

      if (hasMore) {
        setTimeout(() => {
          const nextImg = allWrappers[currentIndex + 1].querySelector('.upload-tile__thumbnail');
          if (nextImg) nextImg.click();
        }, 500); 
      }
    } else {
      sendResponse({ status: "error" });
    }
    return true;
  }
  });
  }
});