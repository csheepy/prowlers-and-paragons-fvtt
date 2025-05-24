export function addEventListener(el, eventName, eventHandler, selector) {
    // convert to plain dom element under v13
    if (parseInt(game.version.split('.')[0]) < 13 && el && el.length && el[0]) {
        el = el[0]; 
    }
    
    if (selector) {
      const wrappedHandler = (e) => {
        if (!e.target) return;
        const elem = e.target.closest(selector);
        if (elem) {
          eventHandler.call(elem, e);
        }
      };
      el.addEventListener(eventName, wrappedHandler);
      return wrappedHandler;
    } else {
      const wrappedHandler = (e) => {
        eventHandler.call(el, e);
      };
      el.addEventListener(eventName, wrappedHandler);
      return wrappedHandler;
    }
  }