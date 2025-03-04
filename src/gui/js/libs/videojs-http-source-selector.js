/**
 * videojs-http-source-selector
 * @version 1.1.6
 * @copyright 2019 Justin Fujita <Justin@pivotshare.com>
 * @license MIT
 */
!(function (e, t) {
  "object" == typeof exports && "undefined" != typeof module
    ? (module.exports = t(require("video.js")))
    : "function" == typeof define && define.amd
    ? define(["video.js"], t)
    : ((e = e || self)["videojs-http-source-selector"] = t(e.videojs));
})(this, function (r) {
  "use strict";
  function o(e, t) {
    (e.prototype = Object.create(t.prototype)),
      ((e.prototype.constructor = e).__proto__ = t);
  }
  function s(e) {
    if (void 0 === e)
      throw new ReferenceError(
        "this hasn't been initialised - super() hasn't been called"
      );
    return e;
  }
  var e = (r = r && r.hasOwnProperty("default") ? r.default : r).getComponent(
      "MenuItem"
    ),
    t = r.getComponent("Component"),
    a = (function (n) {
      function e(e, t) {
        return (
          (t.selectable = !0),
          (t.multiSelectable = !1),
          n.call(this, e, t) || this
        );
      }
      o(e, n);
      var t = e.prototype;
      return (
        (t.handleClick = function () {
          var e = this.options_;
          console.log("Changing quality to:", e.label),
            n.prototype.handleClick.call(this);
          for (var t = this.player().qualityLevels(), o = 0; o < t.length; o++)
            e.index == t.length
              ? (t[o].enabled = !0)
              : e.index == o
              ? (t[o].enabled = !0)
              : (t[o].enabled = !1);
        }),
        (t.update = function () {
          var e = this.player().qualityLevels().selectedIndex;
          this.selected(this.options_.index == e);
        }),
        e
      );
    })(e);
  t.registerComponent("SourceMenuItem", a);
  var u = r.getComponent("MenuButton"),
    n = (function (i) {
      function e(e, t) {
        var o;
        (o = i.call(this, e, t) || this), u.apply(s(o), arguments);
        var n = o.player().qualityLevels();
        if (t && t.default)
          if ("low" == t.default)
            for (var l = 0; l < n.length; l++) n[l].enabled = 0 == l;
          else if ((t.default = "high"))
            for (l = 0; l < n.length; l++) n[l].enabled = l == n.length - 1;
        return (
          o
            .player()
            .qualityLevels()
            .on(["change", "addqualitylevel"], r.bind(s(o), o.update)),
          o
        );
      }
      o(e, i);
      var t = e.prototype;
      return (
        (t.createEl = function () {
          return r.dom.createEl("div", {
            className:
              "vjs-http-source-selector vjs-menu-button vjs-menu-button-popup vjs-control vjs-button",
          });
        }),
        (t.buildCSSClass = function () {
          return u.prototype.buildCSSClass.call(this) + " vjs-icon-cog";
        }),
        (t.update = function () {
          return u.prototype.update.call(this);
        }),
        (t.createItems = function () {
          for (
            var e = [], t = this.player().qualityLevels(), o = [], n = 0;
            n < t.length;
            n++
          ) {
            var l = t.length - (n + 1),
              i = l === t.selectedIndex,
              r = "" + l,
              s = l;
            t[l].height
              ? ((r = t[l].height + "p"), (s = parseInt(t[l].height, 10)))
              : t[l].bitrate &&
                ((r = Math.floor(t[l].bitrate / 1e3) + " kbps"),
                (s = parseInt(t[l].bitrate, 10))),
              0 <= o.indexOf(r) ||
                (o.push(r),
                e.push(
                  new a(this.player_, {
                    label: r,
                    index: l,
                    selected: i,
                    sortVal: s,
                  })
                ));
          }
          return (
            1 < t.length &&
              e.push(
                new a(this.player_, {
                  label: "Auto",
                  index: t.length,
                  selected: !1,
                  sortVal: 99999,
                })
              ),
            e.sort(function (e, t) {
              return e.options_.sortVal < t.options_.sortVal
                ? 1
                : e.options_.sortVal > t.options_.sortVal
                ? -1
                : 0;
            }),
            e
          );
        }),
        e
      );
    })(u),
    l = {},
    i = r.registerPlugin || r.plugin,
    c = function (e) {
      var t = this;
      this.ready(function () {
        !(function (n, e) {
          if (
            (n.addClass("vjs-http-source-selector"),
            console.log("videojs-http-source-selector initialized!"),
            console.log("player.techName_:" + n.techName_),
            "Html5" != n.techName_)
          )
            return;
          n.on(["loadedmetadata"], function (e) {
            if (
              (n.qualityLevels(),
              r.log("loadmetadata event"),
              "undefined" == n.videojs_http_source_selector_initialized ||
                1 == n.videojs_http_source_selector_initialized)
            )
              console.log(
                "player.videojs_http_source_selector_initialized == true"
              );
            else {
              console.log(
                "player.videojs_http_source_selector_initialized == false"
              ),
                (n.videojs_http_source_selector_initialized = !0);
              var t = n.controlBar,
                o = t.getChild("fullscreenToggle").el();
              t.el().insertBefore(t.addChild("SourceMenuButton").el(), o);
            }
          });
        })(t, r.mergeOptions(l, e));
      }),
        r.registerComponent("SourceMenuButton", n),
        r.registerComponent("SourceMenuItem", a);
    };
  return i("httpSourceSelector", c), (c.VERSION = "1.1.6"), c;
});
