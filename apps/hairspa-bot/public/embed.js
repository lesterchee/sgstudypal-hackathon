/**
 * CommitPay AI — Distributable Embed Script
 *
 * Purpose: Vanilla JS IIFE that injects a fixed-position iframe
 * pointing to the chat widget. Listens for postMessage resize
 * events from the React app to toggle between FAB and full-size.
 *
 * Usage:
 * <script src="https://YOUR_DOMAIN/embed.js" data-bot-id="BOT_ID" defer></script>
 */
(function () {
    "use strict";

    // Purpose: Read the bot ID from the script tag's data attribute.
    var scriptTag = document.currentScript;
    var botId = scriptTag ? scriptTag.getAttribute("data-bot-id") || "" : "";

    // Purpose: Allow domain override for local testing; default to the script's origin.
    var origin = scriptTag
        ? new URL(scriptTag.src).origin
        : window.location.origin;

    // Purpose: Create the iframe element pointing to the chat widget.
    var iframe = document.createElement("iframe");
    iframe.src = origin + "/?botId=" + encodeURIComponent(botId);
    iframe.id = "commitpay-chat-frame";
    iframe.allow = "clipboard-write";

    // Purpose: Style the iframe as a fixed FAB (collapsed by default).
    var s = iframe.style;
    s.position = "fixed";
    s.bottom = "0";
    s.right = "0";
    s.border = "none";
    s.zIndex = "999999";
    s.transition = "all 0.3s ease";
    s.width = "100px";
    s.height = "100px";
    s.pointerEvents = "auto";
    s.colorScheme = "normal";

    document.body.appendChild(iframe);

    // Purpose: Handle cross-origin resize requests from the React app.
    window.addEventListener("message", function (event) {
        if (!event.data || event.data.type !== "COMMITPAY_RESIZE") return;

        if (event.data.isExpanded) {
            s.width = "400px";
            s.height = "85vh";
            s.maxHeight = "800px";
            s.bottom = "0";
            s.right = "0";
        } else {
            s.width = "100px";
            s.height = "100px";
            s.maxHeight = "100px";
        }
    });
})();
