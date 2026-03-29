//* HTMLMediaElement blank polyfill for UXP
try{window.HTMLMediaElement = function() {};}catch(e){}
//* Microtask polyfill for UXP
if (typeof queueMicrotask !== "function") { window.queueMicrotask = function (fn) { Promise.resolve().then(fn).catch((err) => setTimeout(() => { throw err; }));  }; }
//* Template polyfill for UXP
(function () {
  if ("content" in document.createElement("template")) return;
  const origCreateElement = document.createElement;
  document.createElement = function (tagName, ...args) {
    const lowerTag = tagName.toLowerCase();
    if (lowerTag === "template") {
      const fakeTemplate = origCreateElement.call(document, "div");
      const content = document.createDocumentFragment();
      Object.defineProperty(fakeTemplate, "content", {
        get() { return content; },
      });
      Object.defineProperty(fakeTemplate, "innerHTML", {
        set(html) {
          const tempDiv = origCreateElement.call(document, "div");
          tempDiv.innerHTML = html;
          // Clear previous content
          while (content.firstChild) content.removeChild(content.firstChild);
          // Move parsed nodes into the content fragment
          while (tempDiv.firstChild) {
            content.appendChild(tempDiv.firstChild);
          }
        },
        get() { return ""; },
      });
      return fakeTemplate;
    }
    return origCreateElement.call(document, tagName, ...args);
  };
})();

//* MutationObserver for Vite to work correctly in UXP
(function(){var t;null==window.MutationObserver&&(t=function(){function t(t){this.callBack=t}return t.prototype.observe=function(t,n){var e;return this.element=t,this.interval=setInterval((e=this,function(){var t;if((t=e.element.innerHTML)!==e.oldHtml)return e.oldHtml=t,e.callBack.apply(null)}),200)},t.prototype.disconnect=function(){return window.clearInterval(this.interval)},t}(),window.MutationObserver=t)}).call(this);

(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) {
    return;
  }
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) {
    processPreload(link);
  }
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") {
        continue;
      }
      for (const node of mutation.addedNodes) {
        if (node.tagName === "LINK" && node.rel === "modulepreload")
          processPreload(node);
      }
    }
  }).observe(document, { childList: true, subtree: true });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials")
      fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep)
      return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
const { entrypoints } = require("uxp");
const { render, h } = require("preact");
const App = require("./ui/App").default;
entrypoints.setup({
  panels: {
    "dessy-panel": {
      show(node) {
        render(h(App, null), node);
      },
      destroy() {
      }
    }
  }
});
//# sourceMappingURL=index-CzkbGeQl.js.map
