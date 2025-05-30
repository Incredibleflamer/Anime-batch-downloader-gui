/*! @silvermine/videojs-quality-selector 2023-11-15 v1.3.1 */

!(function r(o, i, a) {
  function u(e, n) {
    if (!i[e]) {
      if (!o[e]) {
        var t = "function" == typeof require && require;
        if (!n && t) return t(e, !0);
        if (c) return c(e, !0);
        throw (
          (((t = new Error("Cannot find module '" + e + "'")).code =
            "MODULE_NOT_FOUND"),
          t)
        );
      }
      (t = i[e] = { exports: {} }),
        o[e][0].call(
          t.exports,
          function (n) {
            return u(o[e][1][n] || n);
          },
          t,
          t.exports,
          r,
          o,
          i,
          a
        );
    }
    return i[e].exports;
  }
  for (
    var c = "function" == typeof require && require, n = 0;
    n < a.length;
    n++
  )
    u(a[n]);
  return u;
})(
  {
    1: [
      function (n, e, t) {
        e.exports = function (n) {
          if ("function" != typeof n)
            throw TypeError(String(n) + " is not a function");
          return n;
        };
      },
      {},
    ],
    2: [
      function (n, e, t) {
        var r = n("../internals/is-object");
        e.exports = function (n) {
          if (!r(n)) throw TypeError(String(n) + " is not an object");
          return n;
        };
      },
      { "../internals/is-object": 33 },
    ],
    3: [
      function (n, e, t) {
        var c = n("../internals/to-indexed-object"),
          s = n("../internals/to-length"),
          l = n("../internals/to-absolute-index"),
          n = function (u) {
            return function (n, e, t) {
              var r,
                o = c(n),
                i = s(o.length),
                a = l(t, i);
              if (u && e != e) {
                for (; a < i; ) if ((r = o[a++]) != r) return !0;
              } else
                for (; a < i; a++)
                  if ((u || a in o) && o[a] === e) return u || a || 0;
              return !u && -1;
            };
          };
        e.exports = { includes: n(!0), indexOf: n(!1) };
      },
      {
        "../internals/to-absolute-index": 55,
        "../internals/to-indexed-object": 56,
        "../internals/to-length": 58,
      },
    ],
    4: [
      function (n, e, t) {
        var j = n("../internals/function-bind-context"),
          w = n("../internals/indexed-object"),
          S = n("../internals/to-object"),
          x = n("../internals/to-length"),
          O = n("../internals/array-species-create"),
          _ = [].push,
          n = function (p) {
            var y = 1 == p,
              h = 2 == p,
              d = 3 == p,
              b = 4 == p,
              v = 6 == p,
              g = 7 == p,
              m = 5 == p || v;
            return function (n, e, t, r) {
              for (
                var o,
                  i,
                  a = S(n),
                  u = w(a),
                  c = j(e, t, 3),
                  s = x(u.length),
                  l = 0,
                  r = r || O,
                  f = y ? r(n, s) : h || g ? r(n, 0) : void 0;
                l < s;
                l++
              )
                if ((m || l in u) && ((i = c((o = u[l]), l, a)), p))
                  if (y) f[l] = i;
                  else if (i)
                    switch (p) {
                      case 3:
                        return !0;
                      case 5:
                        return o;
                      case 6:
                        return l;
                      case 2:
                        _.call(f, o);
                    }
                  else
                    switch (p) {
                      case 4:
                        return !1;
                      case 7:
                        _.call(f, o);
                    }
              return v ? -1 : d || b ? b : f;
            };
          };
        e.exports = {
          forEach: n(0),
          map: n(1),
          filter: n(2),
          some: n(3),
          every: n(4),
          find: n(5),
          findIndex: n(6),
          filterOut: n(7),
        };
      },
      {
        "../internals/array-species-create": 6,
        "../internals/function-bind-context": 20,
        "../internals/indexed-object": 28,
        "../internals/to-length": 58,
        "../internals/to-object": 59,
      },
    ],
    5: [
      function (n, e, t) {
        var r = n("../internals/fails"),
          o = n("../internals/well-known-symbol"),
          i = n("../internals/engine-v8-version"),
          a = o("species");
        e.exports = function (e) {
          return (
            51 <= i ||
            !r(function () {
              var n = [];
              return (
                ((n.constructor = {})[a] = function () {
                  return { foo: 1 };
                }),
                1 !== n[e](Boolean).foo
              );
            })
          );
        };
      },
      {
        "../internals/engine-v8-version": 16,
        "../internals/fails": 19,
        "../internals/well-known-symbol": 63,
      },
    ],
    6: [
      function (n, e, t) {
        var r = n("../internals/is-object"),
          o = n("../internals/is-array"),
          i = n("../internals/well-known-symbol")("species");
        e.exports = function (n, e) {
          var t;
          return new (
            void 0 ===
            (t =
              o(n) &&
              (("function" == typeof (t = n.constructor) &&
                (t === Array || o(t.prototype))) ||
                (r(t) && null === (t = t[i])))
                ? void 0
                : t)
              ? Array
              : t
          )(0 === e ? 0 : e);
        };
      },
      {
        "../internals/is-array": 31,
        "../internals/is-object": 33,
        "../internals/well-known-symbol": 63,
      },
    ],
    7: [
      function (n, e, t) {
        var r = {}.toString;
        e.exports = function (n) {
          return r.call(n).slice(8, -1);
        };
      },
      {},
    ],
    8: [
      function (n, e, t) {
        var u = n("../internals/has"),
          c = n("../internals/own-keys"),
          s = n("../internals/object-get-own-property-descriptor"),
          l = n("../internals/object-define-property");
        e.exports = function (n, e) {
          for (var t = c(e), r = l.f, o = s.f, i = 0; i < t.length; i++) {
            var a = t[i];
            u(n, a) || r(n, a, o(e, a));
          }
        };
      },
      {
        "../internals/has": 24,
        "../internals/object-define-property": 39,
        "../internals/object-get-own-property-descriptor": 40,
        "../internals/own-keys": 47,
      },
    ],
    9: [
      function (n, e, t) {
        n = n("../internals/fails");
        e.exports = !n(function () {
          function n() {}
          return (
            (n.prototype.constructor = null),
            Object.getPrototypeOf(new n()) !== n.prototype
          );
        });
      },
      { "../internals/fails": 19 },
    ],
    10: [
      function (n, e, t) {
        var r = n("../internals/descriptors"),
          o = n("../internals/object-define-property"),
          i = n("../internals/create-property-descriptor");
        e.exports = r
          ? function (n, e, t) {
              return o.f(n, e, i(1, t));
            }
          : function (n, e, t) {
              return (n[e] = t), n;
            };
      },
      {
        "../internals/create-property-descriptor": 11,
        "../internals/descriptors": 12,
        "../internals/object-define-property": 39,
      },
    ],
    11: [
      function (n, e, t) {
        e.exports = function (n, e) {
          return {
            enumerable: !(1 & n),
            configurable: !(2 & n),
            writable: !(4 & n),
            value: e,
          };
        };
      },
      {},
    ],
    12: [
      function (n, e, t) {
        n = n("../internals/fails");
        e.exports = !n(function () {
          return (
            7 !=
            Object.defineProperty({}, 1, {
              get: function () {
                return 7;
              },
            })[1]
          );
        });
      },
      { "../internals/fails": 19 },
    ],
    13: [
      function (n, e, t) {
        var r = n("../internals/global"),
          n = n("../internals/is-object"),
          o = r.document,
          i = n(o) && n(o.createElement);
        e.exports = function (n) {
          return i ? o.createElement(n) : {};
        };
      },
      { "../internals/global": 23, "../internals/is-object": 33 },
    ],
    14: [
      function (n, e, t) {
        var r = n("../internals/classof-raw"),
          n = n("../internals/global");
        e.exports = "process" == r(n.process);
      },
      { "../internals/classof-raw": 7, "../internals/global": 23 },
    ],
    15: [
      function (n, e, t) {
        n = n("../internals/get-built-in");
        e.exports = n("navigator", "userAgent") || "";
      },
      { "../internals/get-built-in": 22 },
    ],
    16: [
      function (n, e, t) {
        var r,
          o,
          i = n("../internals/global"),
          n = n("../internals/engine-user-agent"),
          i = i.process,
          i = i && i.versions,
          i = i && i.v8;
        i
          ? (o = (r = i.split("."))[0] + r[1])
          : n &&
            (!(r = n.match(/Edge\/(\d+)/)) || 74 <= r[1]) &&
            (r = n.match(/Chrome\/(\d+)/)) &&
            (o = r[1]),
          (e.exports = o && +o);
      },
      { "../internals/engine-user-agent": 15, "../internals/global": 23 },
    ],
    17: [
      function (n, e, t) {
        e.exports = [
          "constructor",
          "hasOwnProperty",
          "isPrototypeOf",
          "propertyIsEnumerable",
          "toLocaleString",
          "toString",
          "valueOf",
        ];
      },
      {},
    ],
    18: [
      function (n, e, t) {
        var s = n("../internals/global"),
          l = n("../internals/object-get-own-property-descriptor").f,
          f = n("../internals/create-non-enumerable-property"),
          p = n("../internals/redefine"),
          y = n("../internals/set-global"),
          h = n("../internals/copy-constructor-properties"),
          d = n("../internals/is-forced");
        e.exports = function (n, e) {
          var t,
            r,
            o,
            i = n.target,
            a = n.global,
            u = n.stat,
            c = a ? s : u ? s[i] || y(i, {}) : (s[i] || {}).prototype;
          if (c)
            for (t in e) {
              if (
                ((r = e[t]),
                (o = n.noTargetGet ? (o = l(c, t)) && o.value : c[t]),
                !d(a ? t : i + (u ? "." : "#") + t, n.forced) && void 0 !== o)
              ) {
                if (typeof r == typeof o) continue;
                h(r, o);
              }
              (n.sham || (o && o.sham)) && f(r, "sham", !0), p(c, t, r, n);
            }
        };
      },
      {
        "../internals/copy-constructor-properties": 8,
        "../internals/create-non-enumerable-property": 10,
        "../internals/global": 23,
        "../internals/is-forced": 32,
        "../internals/object-get-own-property-descriptor": 40,
        "../internals/redefine": 49,
        "../internals/set-global": 51,
      },
    ],
    19: [
      function (n, e, t) {
        e.exports = function (n) {
          try {
            return !!n();
          } catch (n) {
            return !0;
          }
        };
      },
      {},
    ],
    20: [
      function (n, e, t) {
        var i = n("../internals/a-function");
        e.exports = function (r, o, n) {
          if ((i(r), void 0 === o)) return r;
          switch (n) {
            case 0:
              return function () {
                return r.call(o);
              };
            case 1:
              return function (n) {
                return r.call(o, n);
              };
            case 2:
              return function (n, e) {
                return r.call(o, n, e);
              };
            case 3:
              return function (n, e, t) {
                return r.call(o, n, e, t);
              };
          }
          return function () {
            return r.apply(o, arguments);
          };
        };
      },
      { "../internals/a-function": 1 },
    ],
    21: [
      function (n, e, t) {
        "use strict";
        var i = n("../internals/a-function"),
          a = n("../internals/is-object"),
          u = [].slice,
          c = {};
        e.exports =
          Function.bind ||
          function (e) {
            var t = i(this),
              r = u.call(arguments, 1),
              o = function () {
                var n = r.concat(u.call(arguments));
                return this instanceof o
                  ? (function (n, e, t) {
                      if (!(e in c)) {
                        for (var r = [], o = 0; o < e; o++)
                          r[o] = "a[" + o + "]";
                        c[e] = Function(
                          "C,a",
                          "return new C(" + r.join(",") + ")"
                        );
                      }
                      return c[e](n, t);
                    })(t, n.length, n)
                  : t.apply(e, n);
              };
            return a(t.prototype) && (o.prototype = t.prototype), o;
          };
      },
      { "../internals/a-function": 1, "../internals/is-object": 33 },
    ],
    22: [
      function (n, e, t) {
        function r(n) {
          return "function" == typeof n ? n : void 0;
        }
        var o = n("../internals/path"),
          i = n("../internals/global");
        e.exports = function (n, e) {
          return arguments.length < 2
            ? r(o[n]) || r(i[n])
            : (o[n] && o[n][e]) || (i[n] && i[n][e]);
        };
      },
      { "../internals/global": 23, "../internals/path": 48 },
    ],
    23: [
      function (n, t, e) {
        !function (e) {
          !function () {
            function n(n) {
              return n && n.Math == Math && n;
            }
            t.exports =
              n("object" == typeof globalThis && globalThis) ||
              n("object" == typeof window && window) ||
              n("object" == typeof self && self) ||
              n("object" == typeof e && e) ||
              (function () {
                return this;
              })() ||
              Function("return this")();
          }.call(this);
        }.call(
          this,
          "undefined" != typeof global
            ? global
            : "undefined" != typeof self
            ? self
            : "undefined" != typeof window
            ? window
            : {}
        );
      },
      {},
    ],
    24: [
      function (n, e, t) {
        var r = n("../internals/to-object"),
          o = {}.hasOwnProperty;
        e.exports = function (n, e) {
          return o.call(r(n), e);
        };
      },
      { "../internals/to-object": 59 },
    ],
    25: [
      function (n, e, t) {
        e.exports = {};
      },
      {},
    ],
    26: [
      function (n, e, t) {
        n = n("../internals/get-built-in");
        e.exports = n("document", "documentElement");
      },
      { "../internals/get-built-in": 22 },
    ],
    27: [
      function (n, e, t) {
        var r = n("../internals/descriptors"),
          o = n("../internals/fails"),
          i = n("../internals/document-create-element");
        e.exports =
          !r &&
          !o(function () {
            return (
              7 !=
              Object.defineProperty(i("div"), "a", {
                get: function () {
                  return 7;
                },
              }).a
            );
          });
      },
      {
        "../internals/descriptors": 12,
        "../internals/document-create-element": 13,
        "../internals/fails": 19,
      },
    ],
    28: [
      function (n, e, t) {
        var r = n("../internals/fails"),
          o = n("../internals/classof-raw"),
          i = "".split;
        e.exports = r(function () {
          return !Object("z").propertyIsEnumerable(0);
        })
          ? function (n) {
              return "String" == o(n) ? i.call(n, "") : Object(n);
            }
          : Object;
      },
      { "../internals/classof-raw": 7, "../internals/fails": 19 },
    ],
    29: [
      function (n, e, t) {
        var n = n("../internals/shared-store"),
          r = Function.toString;
        "function" != typeof n.inspectSource &&
          (n.inspectSource = function (n) {
            return r.call(n);
          }),
          (e.exports = n.inspectSource);
      },
      { "../internals/shared-store": 53 },
    ],
    30: [
      function (n, e, t) {
        var r,
          o,
          i,
          a,
          u,
          c,
          s,
          l,
          f = n("../internals/native-weak-map"),
          p = n("../internals/global"),
          y = n("../internals/is-object"),
          h = n("../internals/create-non-enumerable-property"),
          d = n("../internals/has"),
          b = n("../internals/shared-store"),
          v = n("../internals/shared-key"),
          n = n("../internals/hidden-keys"),
          g = "Object already initialized",
          p = p.WeakMap;
        (s = f
          ? ((r = b.state || (b.state = new p())),
            (o = r.get),
            (i = r.has),
            (a = r.set),
            (u = function (n, e) {
              if (i.call(r, n)) throw new TypeError(g);
              return (e.facade = n), a.call(r, n, e), e;
            }),
            (c = function (n) {
              return o.call(r, n) || {};
            }),
            function (n) {
              return i.call(r, n);
            })
          : ((n[(l = v("state"))] = !0),
            (u = function (n, e) {
              if (d(n, l)) throw new TypeError(g);
              return (e.facade = n), h(n, l, e), e;
            }),
            (c = function (n) {
              return d(n, l) ? n[l] : {};
            }),
            function (n) {
              return d(n, l);
            })),
          (e.exports = {
            set: u,
            get: c,
            has: s,
            enforce: function (n) {
              return s(n) ? c(n) : u(n, {});
            },
            getterFor: function (t) {
              return function (n) {
                var e;
                if (!y(n) || (e = c(n)).type !== t)
                  throw TypeError("Incompatible receiver, " + t + " required");
                return e;
              };
            },
          });
      },
      {
        "../internals/create-non-enumerable-property": 10,
        "../internals/global": 23,
        "../internals/has": 24,
        "../internals/hidden-keys": 25,
        "../internals/is-object": 33,
        "../internals/native-weak-map": 36,
        "../internals/shared-key": 52,
        "../internals/shared-store": 53,
      },
    ],
    31: [
      function (n, e, t) {
        var r = n("../internals/classof-raw");
        e.exports =
          Array.isArray ||
          function (n) {
            return "Array" == r(n);
          };
      },
      { "../internals/classof-raw": 7 },
    ],
    32: [
      function (n, e, t) {
        var r = n("../internals/fails"),
          o = /#|\.prototype\./,
          n = function (n, e) {
            n = a[i(n)];
            return n == c || (n != u && ("function" == typeof e ? r(e) : !!e));
          },
          i = (n.normalize = function (n) {
            return String(n).replace(o, ".").toLowerCase();
          }),
          a = (n.data = {}),
          u = (n.NATIVE = "N"),
          c = (n.POLYFILL = "P");
        e.exports = n;
      },
      { "../internals/fails": 19 },
    ],
    33: [
      function (n, e, t) {
        e.exports = function (n) {
          return "object" == typeof n ? null !== n : "function" == typeof n;
        };
      },
      {},
    ],
    34: [
      function (n, e, t) {
        e.exports = !1;
      },
      {},
    ],
    35: [
      function (n, e, t) {
        var r = n("../internals/engine-is-node"),
          o = n("../internals/engine-v8-version"),
          n = n("../internals/fails");
        e.exports =
          !!Object.getOwnPropertySymbols &&
          !n(function () {
            return !Symbol.sham && (r ? 38 === o : 37 < o && o < 41);
          });
      },
      {
        "../internals/engine-is-node": 14,
        "../internals/engine-v8-version": 16,
        "../internals/fails": 19,
      },
    ],
    36: [
      function (n, e, t) {
        var r = n("../internals/global"),
          n = n("../internals/inspect-source"),
          r = r.WeakMap;
        e.exports = "function" == typeof r && /native code/.test(n(r));
      },
      { "../internals/global": 23, "../internals/inspect-source": 29 },
    ],
    37: [
      function (n, e, t) {
        function r() {}
        function o(n) {
          return "<script>" + n + "</" + y + ">";
        }
        var i,
          a = n("../internals/an-object"),
          u = n("../internals/object-define-properties"),
          c = n("../internals/enum-bug-keys"),
          s = n("../internals/hidden-keys"),
          l = n("../internals/html"),
          f = n("../internals/document-create-element"),
          n = n("../internals/shared-key"),
          p = "prototype",
          y = "script",
          h = n("IE_PROTO"),
          d = function () {
            try {
              i = document.domain && new ActiveXObject("htmlfile");
            } catch (n) {}
            var n;
            d = i
              ? (function (n) {
                  n.write(o("")), n.close();
                  var e = n.parentWindow.Object;
                  return (n = null), e;
                })(i)
              : (((n = f("iframe")).style.display = "none"),
                l.appendChild(n),
                (n.src = String("javascript:")),
                (n = n.contentWindow.document).open(),
                n.write(o("document.F=Object")),
                n.close(),
                n.F);
            for (var e = c.length; e--; ) delete d[p][c[e]];
            return d();
          };
        (s[h] = !0),
          (e.exports =
            Object.create ||
            function (n, e) {
              var t;
              return (
                null !== n
                  ? ((r[p] = a(n)), (t = new r()), (r[p] = null), (t[h] = n))
                  : (t = d()),
                void 0 === e ? t : u(t, e)
              );
            });
      },
      {
        "../internals/an-object": 2,
        "../internals/document-create-element": 13,
        "../internals/enum-bug-keys": 17,
        "../internals/hidden-keys": 25,
        "../internals/html": 26,
        "../internals/object-define-properties": 38,
        "../internals/shared-key": 52,
      },
    ],
    38: [
      function (n, e, t) {
        var r = n("../internals/descriptors"),
          a = n("../internals/object-define-property"),
          u = n("../internals/an-object"),
          c = n("../internals/object-keys");
        e.exports = r
          ? Object.defineProperties
          : function (n, e) {
              u(n);
              for (var t, r = c(e), o = r.length, i = 0; i < o; )
                a.f(n, (t = r[i++]), e[t]);
              return n;
            };
      },
      {
        "../internals/an-object": 2,
        "../internals/descriptors": 12,
        "../internals/object-define-property": 39,
        "../internals/object-keys": 45,
      },
    ],
    39: [
      function (n, e, t) {
        var r = n("../internals/descriptors"),
          o = n("../internals/ie8-dom-define"),
          i = n("../internals/an-object"),
          a = n("../internals/to-primitive"),
          u = Object.defineProperty;
        t.f = r
          ? u
          : function (n, e, t) {
              if ((i(n), (e = a(e, !0)), i(t), o))
                try {
                  return u(n, e, t);
                } catch (n) {}
              if ("get" in t || "set" in t)
                throw TypeError("Accessors not supported");
              return "value" in t && (n[e] = t.value), n;
            };
      },
      {
        "../internals/an-object": 2,
        "../internals/descriptors": 12,
        "../internals/ie8-dom-define": 27,
        "../internals/to-primitive": 60,
      },
    ],
    40: [
      function (n, e, t) {
        var r = n("../internals/descriptors"),
          o = n("../internals/object-property-is-enumerable"),
          i = n("../internals/create-property-descriptor"),
          a = n("../internals/to-indexed-object"),
          u = n("../internals/to-primitive"),
          c = n("../internals/has"),
          s = n("../internals/ie8-dom-define"),
          l = Object.getOwnPropertyDescriptor;
        t.f = r
          ? l
          : function (n, e) {
              if (((n = a(n)), (e = u(e, !0)), s))
                try {
                  return l(n, e);
                } catch (n) {}
              if (c(n, e)) return i(!o.f.call(n, e), n[e]);
            };
      },
      {
        "../internals/create-property-descriptor": 11,
        "../internals/descriptors": 12,
        "../internals/has": 24,
        "../internals/ie8-dom-define": 27,
        "../internals/object-property-is-enumerable": 46,
        "../internals/to-indexed-object": 56,
        "../internals/to-primitive": 60,
      },
    ],
    41: [
      function (n, e, t) {
        var r = n("../internals/object-keys-internal"),
          o = n("../internals/enum-bug-keys").concat("length", "prototype");
        t.f =
          Object.getOwnPropertyNames ||
          function (n) {
            return r(n, o);
          };
      },
      {
        "../internals/enum-bug-keys": 17,
        "../internals/object-keys-internal": 44,
      },
    ],
    42: [
      function (n, e, t) {
        t.f = Object.getOwnPropertySymbols;
      },
      {},
    ],
    43: [
      function (n, e, t) {
        var r = n("../internals/has"),
          o = n("../internals/to-object"),
          i = n("../internals/shared-key"),
          n = n("../internals/correct-prototype-getter"),
          a = i("IE_PROTO"),
          u = Object.prototype;
        e.exports = n
          ? Object.getPrototypeOf
          : function (n) {
              return (
                (n = o(n)),
                r(n, a)
                  ? n[a]
                  : "function" == typeof n.constructor &&
                    n instanceof n.constructor
                  ? n.constructor.prototype
                  : n instanceof Object
                  ? u
                  : null
              );
            };
      },
      {
        "../internals/correct-prototype-getter": 9,
        "../internals/has": 24,
        "../internals/shared-key": 52,
        "../internals/to-object": 59,
      },
    ],
    44: [
      function (n, e, t) {
        var a = n("../internals/has"),
          u = n("../internals/to-indexed-object"),
          c = n("../internals/array-includes").indexOf,
          s = n("../internals/hidden-keys");
        e.exports = function (n, e) {
          var t,
            r = u(n),
            o = 0,
            i = [];
          for (t in r) !a(s, t) && a(r, t) && i.push(t);
          for (; e.length > o; ) a(r, (t = e[o++])) && (~c(i, t) || i.push(t));
          return i;
        };
      },
      {
        "../internals/array-includes": 3,
        "../internals/has": 24,
        "../internals/hidden-keys": 25,
        "../internals/to-indexed-object": 56,
      },
    ],
    45: [
      function (n, e, t) {
        var r = n("../internals/object-keys-internal"),
          o = n("../internals/enum-bug-keys");
        e.exports =
          Object.keys ||
          function (n) {
            return r(n, o);
          };
      },
      {
        "../internals/enum-bug-keys": 17,
        "../internals/object-keys-internal": 44,
      },
    ],
    46: [
      function (n, e, t) {
        "use strict";
        var r = {}.propertyIsEnumerable,
          o = Object.getOwnPropertyDescriptor,
          i = o && !r.call({ 1: 2 }, 1);
        t.f = i
          ? function (n) {
              n = o(this, n);
              return !!n && n.enumerable;
            }
          : r;
      },
      {},
    ],
    47: [
      function (n, e, t) {
        var r = n("../internals/get-built-in"),
          o = n("../internals/object-get-own-property-names"),
          i = n("../internals/object-get-own-property-symbols"),
          a = n("../internals/an-object");
        e.exports =
          r("Reflect", "ownKeys") ||
          function (n) {
            var e = o.f(a(n)),
              t = i.f;
            return t ? e.concat(t(n)) : e;
          };
      },
      {
        "../internals/an-object": 2,
        "../internals/get-built-in": 22,
        "../internals/object-get-own-property-names": 41,
        "../internals/object-get-own-property-symbols": 42,
      },
    ],
    48: [
      function (n, e, t) {
        n = n("../internals/global");
        e.exports = n;
      },
      { "../internals/global": 23 },
    ],
    49: [
      function (n, e, t) {
        var u = n("../internals/global"),
          c = n("../internals/create-non-enumerable-property"),
          s = n("../internals/has"),
          l = n("../internals/set-global"),
          r = n("../internals/inspect-source"),
          n = n("../internals/internal-state"),
          o = n.get,
          f = n.enforce,
          p = String(String).split("String");
        (e.exports = function (n, e, t, r) {
          var o = !!r && !!r.unsafe,
            i = !!r && !!r.enumerable,
            a = !!r && !!r.noTargetGet;
          "function" == typeof t &&
            ("string" != typeof e || s(t, "name") || c(t, "name", e),
            (r = f(t)).source ||
              (r.source = p.join("string" == typeof e ? e : ""))),
            n !== u
              ? (o ? !a && n[e] && (i = !0) : delete n[e],
                i ? (n[e] = t) : c(n, e, t))
              : i
              ? (n[e] = t)
              : l(e, t);
        })(Function.prototype, "toString", function () {
          return ("function" == typeof this && o(this).source) || r(this);
        });
      },
      {
        "../internals/create-non-enumerable-property": 10,
        "../internals/global": 23,
        "../internals/has": 24,
        "../internals/inspect-source": 29,
        "../internals/internal-state": 30,
        "../internals/set-global": 51,
      },
    ],
    50: [
      function (n, e, t) {
        e.exports = function (n) {
          if (null == n) throw TypeError("Can't call method on " + n);
          return n;
        };
      },
      {},
    ],
    51: [
      function (n, e, t) {
        var r = n("../internals/global"),
          o = n("../internals/create-non-enumerable-property");
        e.exports = function (e, t) {
          try {
            o(r, e, t);
          } catch (n) {
            r[e] = t;
          }
          return t;
        };
      },
      {
        "../internals/create-non-enumerable-property": 10,
        "../internals/global": 23,
      },
    ],
    52: [
      function (n, e, t) {
        var r = n("../internals/shared"),
          o = n("../internals/uid"),
          i = r("keys");
        e.exports = function (n) {
          return i[n] || (i[n] = o(n));
        };
      },
      { "../internals/shared": 54, "../internals/uid": 61 },
    ],
    53: [
      function (n, e, t) {
        var r = n("../internals/global"),
          o = n("../internals/set-global"),
          n = "__core-js_shared__",
          n = r[n] || o(n, {});
        e.exports = n;
      },
      { "../internals/global": 23, "../internals/set-global": 51 },
    ],
    54: [
      function (n, e, t) {
        var r = n("../internals/is-pure"),
          o = n("../internals/shared-store");
        (e.exports = function (n, e) {
          return o[n] || (o[n] = void 0 !== e ? e : {});
        })("versions", []).push({
          version: "3.11.0",
          mode: r ? "pure" : "global",
          copyright: "© 2021 Denis Pushkarev (zloirock.ru)",
        });
      },
      { "../internals/is-pure": 34, "../internals/shared-store": 53 },
    ],
    55: [
      function (n, e, t) {
        var r = n("../internals/to-integer"),
          o = Math.max,
          i = Math.min;
        e.exports = function (n, e) {
          n = r(n);
          return n < 0 ? o(n + e, 0) : i(n, e);
        };
      },
      { "../internals/to-integer": 57 },
    ],
    56: [
      function (n, e, t) {
        var r = n("../internals/indexed-object"),
          o = n("../internals/require-object-coercible");
        e.exports = function (n) {
          return r(o(n));
        };
      },
      {
        "../internals/indexed-object": 28,
        "../internals/require-object-coercible": 50,
      },
    ],
    57: [
      function (n, e, t) {
        var r = Math.ceil,
          o = Math.floor;
        e.exports = function (n) {
          return isNaN((n = +n)) ? 0 : (0 < n ? o : r)(n);
        };
      },
      {},
    ],
    58: [
      function (n, e, t) {
        var r = n("../internals/to-integer"),
          o = Math.min;
        e.exports = function (n) {
          return 0 < n ? o(r(n), 9007199254740991) : 0;
        };
      },
      { "../internals/to-integer": 57 },
    ],
    59: [
      function (n, e, t) {
        var r = n("../internals/require-object-coercible");
        e.exports = function (n) {
          return Object(r(n));
        };
      },
      { "../internals/require-object-coercible": 50 },
    ],
    60: [
      function (n, e, t) {
        var o = n("../internals/is-object");
        e.exports = function (n, e) {
          if (!o(n)) return n;
          var t, r;
          if (e && "function" == typeof (t = n.toString) && !o((r = t.call(n))))
            return r;
          if ("function" == typeof (t = n.valueOf) && !o((r = t.call(n))))
            return r;
          if (
            !e &&
            "function" == typeof (t = n.toString) &&
            !o((r = t.call(n)))
          )
            return r;
          throw TypeError("Can't convert object to primitive value");
        };
      },
      { "../internals/is-object": 33 },
    ],
    61: [
      function (n, e, t) {
        var r = 0,
          o = Math.random();
        e.exports = function (n) {
          return (
            "Symbol(" +
            String(void 0 === n ? "" : n) +
            ")_" +
            (++r + o).toString(36)
          );
        };
      },
      {},
    ],
    62: [
      function (n, e, t) {
        n = n("../internals/native-symbol");
        e.exports = n && !Symbol.sham && "symbol" == typeof Symbol.iterator;
      },
      { "../internals/native-symbol": 35 },
    ],
    63: [
      function (n, e, t) {
        var r = n("../internals/global"),
          o = n("../internals/shared"),
          i = n("../internals/has"),
          a = n("../internals/uid"),
          u = n("../internals/native-symbol"),
          n = n("../internals/use-symbol-as-uid"),
          c = o("wks"),
          s = r.Symbol,
          l = n ? s : (s && s.withoutSetter) || a;
        e.exports = function (n) {
          return (
            (i(c, n) && (u || "string" == typeof c[n])) ||
              (u && i(s, n) ? (c[n] = s[n]) : (c[n] = l("Symbol." + n))),
            c[n]
          );
        };
      },
      {
        "../internals/global": 23,
        "../internals/has": 24,
        "../internals/native-symbol": 35,
        "../internals/shared": 54,
        "../internals/uid": 61,
        "../internals/use-symbol-as-uid": 62,
      },
    ],
    64: [
      function (n, e, t) {
        "use strict";
        var r = n("../internals/export"),
          o = n("../internals/array-iteration").map;
        r(
          {
            target: "Array",
            proto: !0,
            forced: !n("../internals/array-method-has-species-support")("map"),
          },
          {
            map: function (n) {
              return o(this, n, 1 < arguments.length ? arguments[1] : void 0);
            },
          }
        );
      },
      {
        "../internals/array-iteration": 4,
        "../internals/array-method-has-species-support": 5,
        "../internals/export": 18,
      },
    ],
    65: [
      function (n, e, t) {
        var r = n("../internals/export"),
          o = n("../internals/get-built-in"),
          i = n("../internals/a-function"),
          a = n("../internals/an-object"),
          u = n("../internals/is-object"),
          c = n("../internals/object-create"),
          s = n("../internals/function-bind"),
          n = n("../internals/fails"),
          l = o("Reflect", "construct"),
          f = n(function () {
            function n() {}
            return !(l(function () {}, [], n) instanceof n);
          }),
          p = !n(function () {
            l(function () {});
          }),
          n = f || p;
        r(
          { target: "Reflect", stat: !0, forced: n, sham: n },
          {
            construct: function (n, e) {
              i(n), a(e);
              var t = arguments.length < 3 ? n : i(arguments[2]);
              if (p && !f) return l(n, e, t);
              if (n == t) {
                switch (e.length) {
                  case 0:
                    return new n();
                  case 1:
                    return new n(e[0]);
                  case 2:
                    return new n(e[0], e[1]);
                  case 3:
                    return new n(e[0], e[1], e[2]);
                  case 4:
                    return new n(e[0], e[1], e[2], e[3]);
                }
                var r = [null];
                return r.push.apply(r, e), new (s.apply(n, r))();
              }
              (r = t.prototype),
                (t = c(u(r) ? r : Object.prototype)),
                (r = Function.apply.call(n, t, e));
              return u(r) ? r : t;
            },
          }
        );
      },
      {
        "../internals/a-function": 1,
        "../internals/an-object": 2,
        "../internals/export": 18,
        "../internals/fails": 19,
        "../internals/function-bind": 21,
        "../internals/get-built-in": 22,
        "../internals/is-object": 33,
        "../internals/object-create": 37,
      },
    ],
    66: [
      function (n, e, t) {
        var r = n("../internals/export"),
          i = n("../internals/is-object"),
          a = n("../internals/an-object"),
          u = n("../internals/has"),
          c = n("../internals/object-get-own-property-descriptor"),
          s = n("../internals/object-get-prototype-of");
        r(
          { target: "Reflect", stat: !0 },
          {
            get: function n(e, t) {
              var r,
                o = arguments.length < 3 ? e : arguments[2];
              return a(e) === o
                ? e[t]
                : (r = c.f(e, t))
                ? u(r, "value")
                  ? r.value
                  : void 0 === r.get
                  ? void 0
                  : r.get.call(o)
                : i((r = s(e)))
                ? n(r, t, o)
                : void 0;
            },
          }
        );
      },
      {
        "../internals/an-object": 2,
        "../internals/export": 18,
        "../internals/has": 24,
        "../internals/is-object": 33,
        "../internals/object-get-own-property-descriptor": 40,
        "../internals/object-get-prototype-of": 43,
      },
    ],
    67: [
      function (n, o, i) {
        !function (Fe) {
          !function () {
            var n, e, t, r;
            (n = this),
              (e = function () {
                var n =
                    ("object" == typeof self && self.self === self && self) ||
                    ("object" == typeof Fe && Fe.global === Fe && Fe) ||
                    Function("return this")() ||
                    {},
                  r = Array.prototype,
                  a = Object.prototype,
                  f = "undefined" != typeof Symbol ? Symbol.prototype : null,
                  o = r.push,
                  c = r.slice,
                  p = a.toString,
                  t = a.hasOwnProperty,
                  e = "undefined" != typeof ArrayBuffer,
                  i = "undefined" != typeof DataView,
                  u = Array.isArray,
                  s = Object.keys,
                  l = Object.create,
                  y = e && ArrayBuffer.isView,
                  h = isNaN,
                  d = isFinite,
                  b = !{ toString: null }.propertyIsEnumerable("toString"),
                  v = [
                    "valueOf",
                    "isPrototypeOf",
                    "toString",
                    "propertyIsEnumerable",
                    "hasOwnProperty",
                    "toLocaleString",
                  ],
                  g = Math.pow(2, 53) - 1;
                function m(o, i) {
                  return (
                    (i = null == i ? o.length - 1 : +i),
                    function () {
                      for (
                        var n = Math.max(arguments.length - i, 0),
                          e = Array(n),
                          t = 0;
                        t < n;
                        t++
                      )
                        e[t] = arguments[t + i];
                      switch (i) {
                        case 0:
                          return o.call(this, e);
                        case 1:
                          return o.call(this, arguments[0], e);
                        case 2:
                          return o.call(this, arguments[0], arguments[1], e);
                      }
                      for (var r = Array(i + 1), t = 0; t < i; t++)
                        r[t] = arguments[t];
                      return (r[i] = e), o.apply(this, r);
                    }
                  );
                }
                function j(n) {
                  var e = typeof n;
                  return "function" == e || ("object" == e && !!n);
                }
                function w(n) {
                  return void 0 === n;
                }
                function S(n) {
                  return (
                    !0 === n || !1 === n || "[object Boolean]" === p.call(n)
                  );
                }
                function x(n) {
                  var e = "[object " + n + "]";
                  return function (n) {
                    return p.call(n) === e;
                  };
                }
                var O = x("String"),
                  _ = x("Number"),
                  k = x("Date"),
                  E = x("RegExp"),
                  T = x("Error"),
                  P = x("Symbol"),
                  A = x("ArrayBuffer"),
                  R = x("Function"),
                  C = n.document && n.document.childNodes,
                  I = (R =
                    "function" != typeof /./ &&
                    "object" != typeof Int8Array &&
                    "function" != typeof C
                      ? function (n) {
                          return "function" == typeof n || !1;
                        }
                      : R),
                  M = x("Object"),
                  q = i && M(new DataView(new ArrayBuffer(8))),
                  D = "undefined" != typeof Map && M(new Map()),
                  F = x("DataView");
                var N = q
                    ? function (n) {
                        return null != n && I(n.getInt8) && A(n.buffer);
                      }
                    : F,
                  B = u || x("Array");
                function L(n, e) {
                  return null != n && t.call(n, e);
                }
                var U = x("Arguments");
                !(function () {
                  U(arguments) ||
                    (U = function (n) {
                      return L(n, "callee");
                    });
                })();
                var W = U;
                function Q(n) {
                  return _(n) && h(n);
                }
                function Y(n) {
                  return function () {
                    return n;
                  };
                }
                function V(e) {
                  return function (n) {
                    n = e(n);
                    return "number" == typeof n && 0 <= n && n <= g;
                  };
                }
                function z(e) {
                  return function (n) {
                    return null == n ? void 0 : n[e];
                  };
                }
                var G = z("byteLength"),
                  H = V(G),
                  K =
                    /\[object ((I|Ui)nt(8|16|32)|Float(32|64)|Uint8Clamped|Big(I|Ui)nt64)Array\]/;
                var $ = e
                    ? function (n) {
                        return y ? y(n) && !N(n) : H(n) && K.test(p.call(n));
                      }
                    : Y(!1),
                  J = z("length");
                function X(n, e) {
                  e = (function (e) {
                    for (var t = {}, n = e.length, r = 0; r < n; ++r)
                      t[e[r]] = !0;
                    return {
                      contains: function (n) {
                        return t[n];
                      },
                      push: function (n) {
                        return (t[n] = !0), e.push(n);
                      },
                    };
                  })(e);
                  var t = v.length,
                    r = n.constructor,
                    o = (I(r) && r.prototype) || a,
                    i = "constructor";
                  for (L(n, i) && !e.contains(i) && e.push(i); t--; )
                    (i = v[t]) in n &&
                      n[i] !== o[i] &&
                      !e.contains(i) &&
                      e.push(i);
                }
                function Z(n) {
                  if (!j(n)) return [];
                  if (s) return s(n);
                  var e,
                    t = [];
                  for (e in n) L(n, e) && t.push(e);
                  return b && X(n, t), t;
                }
                function nn(n, e) {
                  var t = Z(e),
                    r = t.length;
                  if (null == n) return !r;
                  for (var o = Object(n), i = 0; i < r; i++) {
                    var a = t[i];
                    if (e[a] !== o[a] || !(a in o)) return !1;
                  }
                  return !0;
                }
                function en(n) {
                  return n instanceof en
                    ? n
                    : this instanceof en
                    ? void (this._wrapped = n)
                    : new en(n);
                }
                function tn(n) {
                  return new Uint8Array(n.buffer || n, n.byteOffset || 0, G(n));
                }
                (en.VERSION = "1.13.1"),
                  (en.prototype.valueOf =
                    en.prototype.toJSON =
                    en.prototype.value =
                      function () {
                        return this._wrapped;
                      }),
                  (en.prototype.toString = function () {
                    return String(this._wrapped);
                  });
                var rn = "[object DataView]";
                function on(n, e, t, r) {
                  if (n === e) return 0 !== n || 1 / n == 1 / e;
                  if (null == n || null == e) return !1;
                  if (n != n) return e != e;
                  var o = typeof n;
                  return (
                    ("function" == o ||
                      "object" == o ||
                      "object" == typeof e) &&
                    (function n(e, t, r, o) {
                      e instanceof en && (e = e._wrapped);
                      t instanceof en && (t = t._wrapped);
                      var i = p.call(e);
                      if (i !== p.call(t)) return !1;
                      if (q && "[object Object]" == i && N(e)) {
                        if (!N(t)) return !1;
                        i = rn;
                      }
                      switch (i) {
                        case "[object RegExp]":
                        case "[object String]":
                          return "" + e == "" + t;
                        case "[object Number]":
                          return +e != +e
                            ? +t != +t
                            : 0 == +e
                            ? 1 / +e == 1 / t
                            : +e == +t;
                        case "[object Date]":
                        case "[object Boolean]":
                          return +e == +t;
                        case "[object Symbol]":
                          return f.valueOf.call(e) === f.valueOf.call(t);
                        case "[object ArrayBuffer]":
                        case rn:
                          return n(tn(e), tn(t), r, o);
                      }
                      var a = "[object Array]" === i;
                      if (!a && $(e)) {
                        var u = G(e);
                        if (u !== G(t)) return !1;
                        if (
                          e.buffer === t.buffer &&
                          e.byteOffset === t.byteOffset
                        )
                          return !0;
                        a = !0;
                      }
                      if (!a) {
                        if ("object" != typeof e || "object" != typeof t)
                          return !1;
                        var i = e.constructor,
                          u = t.constructor;
                        if (
                          i !== u &&
                          !(I(i) && i instanceof i && I(u) && u instanceof u) &&
                          "constructor" in e &&
                          "constructor" in t
                        )
                          return !1;
                      }
                      r = r || [];
                      o = o || [];
                      var c = r.length;
                      for (; c--; ) if (r[c] === e) return o[c] === t;
                      r.push(e);
                      o.push(t);
                      if (a) {
                        if ((c = e.length) !== t.length) return !1;
                        for (; c--; ) if (!on(e[c], t[c], r, o)) return !1;
                      } else {
                        var s,
                          l = Z(e);
                        if (((c = l.length), Z(t).length !== c)) return !1;
                        for (; c--; )
                          if (((s = l[c]), !L(t, s) || !on(e[s], t[s], r, o)))
                            return !1;
                      }
                      r.pop();
                      o.pop();
                      return !0;
                    })(n, e, t, r)
                  );
                }
                function an(n) {
                  if (!j(n)) return [];
                  var e,
                    t = [];
                  for (e in n) t.push(e);
                  return b && X(n, t), t;
                }
                function un(r) {
                  var o = J(r);
                  return function (n) {
                    if (null == n) return !1;
                    var e = an(n);
                    if (J(e)) return !1;
                    for (var t = 0; t < o; t++) if (!I(n[r[t]])) return !1;
                    return r !== pn || !I(n[cn]);
                  };
                }
                var cn = "forEach",
                  sn = ["clear", "delete"],
                  ln = ["get", "has", "set"],
                  fn = sn.concat(cn, ln),
                  pn = sn.concat(ln),
                  yn = ["add"].concat(sn, cn, "has"),
                  hn = D ? un(fn) : x("Map"),
                  dn = D ? un(pn) : x("WeakMap"),
                  bn = D ? un(yn) : x("Set"),
                  vn = x("WeakSet");
                function gn(n) {
                  for (
                    var e = Z(n), t = e.length, r = Array(t), o = 0;
                    o < t;
                    o++
                  )
                    r[o] = n[e[o]];
                  return r;
                }
                function mn(n) {
                  for (var e = {}, t = Z(n), r = 0, o = t.length; r < o; r++)
                    e[n[t[r]]] = t[r];
                  return e;
                }
                function jn(n) {
                  var e,
                    t = [];
                  for (e in n) I(n[e]) && t.push(e);
                  return t.sort();
                }
                function wn(c, s) {
                  return function (n) {
                    var e = arguments.length;
                    if ((s && (n = Object(n)), e < 2 || null == n)) return n;
                    for (var t = 1; t < e; t++)
                      for (
                        var r = arguments[t], o = c(r), i = o.length, a = 0;
                        a < i;
                        a++
                      ) {
                        var u = o[a];
                        (s && void 0 !== n[u]) || (n[u] = r[u]);
                      }
                    return n;
                  };
                }
                var Sn = wn(an),
                  xn = wn(Z),
                  On = wn(an, !0);
                function _n(n) {
                  if (!j(n)) return {};
                  if (l) return l(n);
                  var e = function () {};
                  e.prototype = n;
                  n = new e();
                  return (e.prototype = null), n;
                }
                function kn(n) {
                  return j(n) ? (B(n) ? n.slice() : Sn({}, n)) : n;
                }
                function En(n) {
                  return B(n) ? n : [n];
                }
                function Tn(n) {
                  return en.toPath(n);
                }
                function Pn(n, e) {
                  for (var t = e.length, r = 0; r < t; r++) {
                    if (null == n) return;
                    n = n[e[r]];
                  }
                  return t ? n : void 0;
                }
                function An(n, e, t) {
                  e = Pn(n, Tn(e));
                  return w(e) ? t : e;
                }
                function Rn(n) {
                  return n;
                }
                function Cn(e) {
                  return (
                    (e = xn({}, e)),
                    function (n) {
                      return nn(n, e);
                    }
                  );
                }
                function In(e) {
                  return (
                    (e = Tn(e)),
                    function (n) {
                      return Pn(n, e);
                    }
                  );
                }
                function Mn(o, i, n) {
                  if (void 0 === i) return o;
                  switch (null == n ? 3 : n) {
                    case 1:
                      return function (n) {
                        return o.call(i, n);
                      };
                    case 3:
                      return function (n, e, t) {
                        return o.call(i, n, e, t);
                      };
                    case 4:
                      return function (n, e, t, r) {
                        return o.call(i, n, e, t, r);
                      };
                  }
                  return function () {
                    return o.apply(i, arguments);
                  };
                }
                function qn(n, e, t) {
                  return null == n
                    ? Rn
                    : I(n)
                    ? Mn(n, e, t)
                    : (j(n) && !B(n) ? Cn : In)(n);
                }
                function Dn(n, e) {
                  return qn(n, e, 1 / 0);
                }
                function Fn(n, e, t) {
                  return en.iteratee !== Dn ? en.iteratee(n, e) : qn(n, e, t);
                }
                function Nn() {}
                function Bn(n, e) {
                  return (
                    null == e && ((e = n), (n = 0)),
                    n + Math.floor(Math.random() * (e - n + 1))
                  );
                }
                (en.toPath = En), (en.iteratee = Dn);
                var Ln =
                  Date.now ||
                  function () {
                    return new Date().getTime();
                  };
                function Un(e) {
                  function t(n) {
                    return e[n];
                  }
                  var n = "(?:" + Z(e).join("|") + ")",
                    r = RegExp(n),
                    o = RegExp(n, "g");
                  return function (n) {
                    return r.test((n = null == n ? "" : "" + n))
                      ? n.replace(o, t)
                      : n;
                  };
                }
                var Wn = {
                    "&": "&amp;",
                    "<": "&lt;",
                    ">": "&gt;",
                    '"': "&quot;",
                    "'": "&#x27;",
                    "`": "&#x60;",
                  },
                  Qn = Un(Wn),
                  Yn = Un(mn(Wn)),
                  Vn = (en.templateSettings = {
                    evaluate: /<%([\s\S]+?)%>/g,
                    interpolate: /<%=([\s\S]+?)%>/g,
                    escape: /<%-([\s\S]+?)%>/g,
                  }),
                  zn = /(.)^/,
                  Gn = {
                    "'": "'",
                    "\\": "\\",
                    "\r": "r",
                    "\n": "n",
                    "\u2028": "u2028",
                    "\u2029": "u2029",
                  },
                  Hn = /\\|'|\r|\n|\u2028|\u2029/g;
                function Kn(n) {
                  return "\\" + Gn[n];
                }
                var $n = /^\s*(\w|\$)+\s*$/;
                var Jn = 0;
                function Xn(n, e, t, r, o) {
                  if (!(r instanceof e)) return n.apply(t, o);
                  (t = _n(n.prototype)), (o = n.apply(t, o));
                  return j(o) ? o : t;
                }
                var Zn = m(function (o, i) {
                  var a = Zn.placeholder,
                    u = function () {
                      for (
                        var n = 0, e = i.length, t = Array(e), r = 0;
                        r < e;
                        r++
                      )
                        t[r] = i[r] === a ? arguments[n++] : i[r];
                      for (; n < arguments.length; ) t.push(arguments[n++]);
                      return Xn(o, u, this, this, t);
                    };
                  return u;
                });
                Zn.placeholder = en;
                var ne = m(function (e, t, r) {
                    if (!I(e))
                      throw new TypeError("Bind must be called on a function");
                    var o = m(function (n) {
                      return Xn(e, o, t, this, r.concat(n));
                    });
                    return o;
                  }),
                  ee = V(J);
                function te(n, e, t, r) {
                  if (((r = r || []), e || 0 === e)) {
                    if (e <= 0) return r.concat(n);
                  } else e = 1 / 0;
                  for (var o = r.length, i = 0, a = J(n); i < a; i++) {
                    var u = n[i];
                    if (ee(u) && (B(u) || W(u)))
                      if (1 < e) te(u, e - 1, t, r), (o = r.length);
                      else
                        for (var c = 0, s = u.length; c < s; ) r[o++] = u[c++];
                    else t || (r[o++] = u);
                  }
                  return r;
                }
                var re = m(function (n, e) {
                  var t = (e = te(e, !1, !1)).length;
                  if (t < 1)
                    throw new Error("bindAll must be passed function names");
                  for (; t--; ) {
                    var r = e[t];
                    n[r] = ne(n[r], n);
                  }
                  return n;
                });
                var oe = m(function (n, e, t) {
                    return setTimeout(function () {
                      return n.apply(null, t);
                    }, e);
                  }),
                  ie = Zn(oe, en, 1);
                function ae(n) {
                  return function () {
                    return !n.apply(this, arguments);
                  };
                }
                function ue(n, e) {
                  var t;
                  return function () {
                    return (
                      0 < --n && (t = e.apply(this, arguments)),
                      n <= 1 && (e = null),
                      t
                    );
                  };
                }
                n = Zn(ue, 2);
                function ce(n, e, t) {
                  e = Fn(e, t);
                  for (var r, o = Z(n), i = 0, a = o.length; i < a; i++)
                    if (e(n[(r = o[i])], r, n)) return r;
                }
                function se(i) {
                  return function (n, e, t) {
                    e = Fn(e, t);
                    for (
                      var r = J(n), o = 0 < i ? 0 : r - 1;
                      0 <= o && o < r;
                      o += i
                    )
                      if (e(n[o], o, n)) return o;
                    return -1;
                  };
                }
                var le = se(1),
                  C = se(-1);
                function fe(n, e, t, r) {
                  for (var o = (t = Fn(t, r, 1))(e), i = 0, a = J(n); i < a; ) {
                    var u = Math.floor((i + a) / 2);
                    t(n[u]) < o ? (i = u + 1) : (a = u);
                  }
                  return i;
                }
                function pe(i, a, u) {
                  return function (n, e, t) {
                    var r = 0,
                      o = J(n);
                    if ("number" == typeof t)
                      0 < i
                        ? (r = 0 <= t ? t : Math.max(t + o, r))
                        : (o = 0 <= t ? Math.min(t + 1, o) : t + o + 1);
                    else if (u && t && o)
                      return n[(t = u(n, e))] === e ? t : -1;
                    if (e != e)
                      return 0 <= (t = a(c.call(n, r, o), Q)) ? t + r : -1;
                    for (t = 0 < i ? r : o - 1; 0 <= t && t < o; t += i)
                      if (n[t] === e) return t;
                    return -1;
                  };
                }
                var ye = pe(1, le, fe),
                  R = pe(-1, C);
                function he(n, e, t) {
                  t = (ee(n) ? le : ce)(n, e, t);
                  if (void 0 !== t && -1 !== t) return n[t];
                }
                function de(n, e, t) {
                  if (((e = Mn(e, t)), ee(n)))
                    for (o = 0, i = n.length; o < i; o++) e(n[o], o, n);
                  else
                    for (var r = Z(n), o = 0, i = r.length; o < i; o++)
                      e(n[r[o]], r[o], n);
                  return n;
                }
                function be(n, e, t) {
                  e = Fn(e, t);
                  for (
                    var r = !ee(n) && Z(n),
                      o = (r || n).length,
                      i = Array(o),
                      a = 0;
                    a < o;
                    a++
                  ) {
                    var u = r ? r[a] : a;
                    i[a] = e(n[u], u, n);
                  }
                  return i;
                }
                function ve(c) {
                  return function (n, e, t, r) {
                    var o = 3 <= arguments.length;
                    return (function (n, e, t, r) {
                      var o = !ee(n) && Z(n),
                        i = (o || n).length,
                        a = 0 < c ? 0 : i - 1;
                      for (
                        r || ((t = n[o ? o[a] : a]), (a += c));
                        0 <= a && a < i;
                        a += c
                      ) {
                        var u = o ? o[a] : a;
                        t = e(t, n[u], u, n);
                      }
                      return t;
                    })(n, Mn(e, r, 4), t, o);
                  };
                }
                (i = ve(1)), (M = ve(-1));
                function ge(n, r, e) {
                  var o = [];
                  return (
                    (r = Fn(r, e)),
                    de(n, function (n, e, t) {
                      r(n, e, t) && o.push(n);
                    }),
                    o
                  );
                }
                function me(n, e, t) {
                  e = Fn(e, t);
                  for (
                    var r = !ee(n) && Z(n), o = (r || n).length, i = 0;
                    i < o;
                    i++
                  ) {
                    var a = r ? r[i] : i;
                    if (!e(n[a], a, n)) return !1;
                  }
                  return !0;
                }
                function je(n, e, t) {
                  e = Fn(e, t);
                  for (
                    var r = !ee(n) && Z(n), o = (r || n).length, i = 0;
                    i < o;
                    i++
                  ) {
                    var a = r ? r[i] : i;
                    if (e(n[a], a, n)) return !0;
                  }
                  return !1;
                }
                function we(n, e, t, r) {
                  return (
                    ee(n) || (n = gn(n)),
                    0 <= ye(n, e, (t = "number" != typeof t || r ? 0 : t))
                  );
                }
                F = m(function (n, t, r) {
                  var o, i;
                  return (
                    I(t)
                      ? (i = t)
                      : ((t = Tn(t)),
                        (o = t.slice(0, -1)),
                        (t = t[t.length - 1])),
                    be(n, function (n) {
                      var e = i;
                      if (!e) {
                        if (null == (n = o && o.length ? Pn(n, o) : n)) return;
                        e = n[t];
                      }
                      return null == e ? e : e.apply(n, r);
                    })
                  );
                });
                function Se(n, e) {
                  return be(n, In(e));
                }
                function xe(n, r, e) {
                  var t,
                    o,
                    i = -1 / 0,
                    a = -1 / 0;
                  if (
                    null == r ||
                    ("number" == typeof r &&
                      "object" != typeof n[0] &&
                      null != n)
                  )
                    for (
                      var u = 0, c = (n = ee(n) ? n : gn(n)).length;
                      u < c;
                      u++
                    )
                      null != (t = n[u]) && i < t && (i = t);
                  else
                    (r = Fn(r, e)),
                      de(n, function (n, e, t) {
                        (o = r(n, e, t)),
                          (a < o || (o === -1 / 0 && i === -1 / 0)) &&
                            ((i = n), (a = o));
                      });
                  return i;
                }
                function Oe(n, e, t) {
                  if (null == e || t)
                    return (n = !ee(n) ? gn(n) : n)[Bn(n.length - 1)];
                  var r = (ee(n) ? kn : gn)(n),
                    n = J(r);
                  e = Math.max(Math.min(e, n), 0);
                  for (var o = n - 1, i = 0; i < e; i++) {
                    var a = Bn(i, o),
                      u = r[i];
                    (r[i] = r[a]), (r[a] = u);
                  }
                  return r.slice(0, e);
                }
                function _e(i, e) {
                  return function (t, r, n) {
                    var o = e ? [[], []] : {};
                    return (
                      (r = Fn(r, n)),
                      de(t, function (n, e) {
                        e = r(n, e, t);
                        i(o, n, e);
                      }),
                      o
                    );
                  };
                }
                var u = _e(function (n, e, t) {
                    L(n, t) ? n[t].push(e) : (n[t] = [e]);
                  }),
                  e = _e(function (n, e, t) {
                    n[t] = e;
                  }),
                  ln = _e(function (n, e, t) {
                    L(n, t) ? n[t]++ : (n[t] = 1);
                  }),
                  sn = _e(function (n, e, t) {
                    n[t ? 0 : 1].push(e);
                  }, !0),
                  ke =
                    /[^\ud800-\udfff]|[\ud800-\udbff][\udc00-\udfff]|[\ud800-\udfff]/g;
                function Ee(n, e, t) {
                  return e in t;
                }
                var Te = m(function (n, e) {
                    var t = {},
                      r = e[0];
                    if (null == n) return t;
                    I(r)
                      ? (1 < e.length && (r = Mn(r, e[1])), (e = an(n)))
                      : ((r = Ee), (e = te(e, !1, !1)), (n = Object(n)));
                    for (var o = 0, i = e.length; o < i; o++) {
                      var a = e[o],
                        u = n[a];
                      r(u, a, n) && (t[a] = u);
                    }
                    return t;
                  }),
                  fn = m(function (n, t) {
                    var e,
                      r = t[0];
                    return (
                      I(r)
                        ? ((r = ae(r)), 1 < t.length && (e = t[1]))
                        : ((t = be(te(t, !1, !1), String)),
                          (r = function (n, e) {
                            return !we(t, e);
                          })),
                      Te(n, r, e)
                    );
                  });
                function Pe(n, e, t) {
                  return c.call(
                    n,
                    0,
                    Math.max(0, n.length - (null == e || t ? 1 : e))
                  );
                }
                function Ae(n, e, t) {
                  return null == n || n.length < 1
                    ? null == e || t
                      ? void 0
                      : []
                    : null == e || t
                    ? n[0]
                    : Pe(n, n.length - e);
                }
                function Re(n, e, t) {
                  return c.call(n, null == e || t ? 1 : e);
                }
                var Ce = m(function (n, e) {
                    return (
                      (e = te(e, !0, !0)),
                      ge(n, function (n) {
                        return !we(e, n);
                      })
                    );
                  }),
                  D = m(function (n, e) {
                    return Ce(n, e);
                  });
                function Ie(n, e, t, r) {
                  S(e) || ((r = t), (t = e), (e = !1)),
                    null != t && (t = Fn(t, r));
                  for (var o = [], i = [], a = 0, u = J(n); a < u; a++) {
                    var c = n[a],
                      s = t ? t(c, a, n) : c;
                    e && !t
                      ? ((a && i === s) || o.push(c), (i = s))
                      : t
                      ? we(i, s) || (i.push(s), o.push(c))
                      : we(o, c) || o.push(c);
                  }
                  return o;
                }
                yn = m(function (n) {
                  return Ie(te(n, !0, !0));
                });
                function Me(n) {
                  for (
                    var e = (n && xe(n, J).length) || 0, t = Array(e), r = 0;
                    r < e;
                    r++
                  )
                    t[r] = Se(n, r);
                  return t;
                }
                Wn = m(Me);
                function qe(n, e) {
                  return n._chain ? en(e).chain() : e;
                }
                function De(t) {
                  return (
                    de(jn(t), function (n) {
                      var e = (en[n] = t[n]);
                      en.prototype[n] = function () {
                        var n = [this._wrapped];
                        return o.apply(n, arguments), qe(this, e.apply(en, n));
                      };
                    }),
                    en
                  );
                }
                de(
                  [
                    "pop",
                    "push",
                    "reverse",
                    "shift",
                    "sort",
                    "splice",
                    "unshift",
                  ],
                  function (e) {
                    var t = r[e];
                    en.prototype[e] = function () {
                      var n = this._wrapped;
                      return (
                        null != n &&
                          (t.apply(n, arguments),
                          ("shift" !== e && "splice" !== e) ||
                            0 !== n.length ||
                            delete n[0]),
                        qe(this, n)
                      );
                    };
                  }
                ),
                  de(["concat", "join", "slice"], function (n) {
                    var e = r[n];
                    en.prototype[n] = function () {
                      var n = this._wrapped;
                      return qe(
                        this,
                        (n = null != n ? e.apply(n, arguments) : n)
                      );
                    };
                  });
                Wn = De({
                  __proto__: null,
                  VERSION: "1.13.1",
                  restArguments: m,
                  isObject: j,
                  isNull: function (n) {
                    return null === n;
                  },
                  isUndefined: w,
                  isBoolean: S,
                  isElement: function (n) {
                    return !(!n || 1 !== n.nodeType);
                  },
                  isString: O,
                  isNumber: _,
                  isDate: k,
                  isRegExp: E,
                  isError: T,
                  isSymbol: P,
                  isArrayBuffer: A,
                  isDataView: N,
                  isArray: B,
                  isFunction: I,
                  isArguments: W,
                  isFinite: function (n) {
                    return !P(n) && d(n) && !isNaN(parseFloat(n));
                  },
                  isNaN: Q,
                  isTypedArray: $,
                  isEmpty: function (n) {
                    if (null == n) return !0;
                    var e = J(n);
                    return "number" == typeof e && (B(n) || O(n) || W(n))
                      ? 0 === e
                      : 0 === J(Z(n));
                  },
                  isMatch: nn,
                  isEqual: function (n, e) {
                    return on(n, e);
                  },
                  isMap: hn,
                  isWeakMap: dn,
                  isSet: bn,
                  isWeakSet: vn,
                  keys: Z,
                  allKeys: an,
                  values: gn,
                  pairs: function (n) {
                    for (
                      var e = Z(n), t = e.length, r = Array(t), o = 0;
                      o < t;
                      o++
                    )
                      r[o] = [e[o], n[e[o]]];
                    return r;
                  },
                  invert: mn,
                  functions: jn,
                  methods: jn,
                  extend: Sn,
                  extendOwn: xn,
                  assign: xn,
                  defaults: On,
                  create: function (n, e) {
                    return (n = _n(n)), e && xn(n, e), n;
                  },
                  clone: kn,
                  tap: function (n, e) {
                    return e(n), n;
                  },
                  get: An,
                  has: function (n, e) {
                    for (var t = (e = Tn(e)).length, r = 0; r < t; r++) {
                      var o = e[r];
                      if (!L(n, o)) return !1;
                      n = n[o];
                    }
                    return !!t;
                  },
                  mapObject: function (n, e, t) {
                    e = Fn(e, t);
                    for (
                      var r = Z(n), o = r.length, i = {}, a = 0;
                      a < o;
                      a++
                    ) {
                      var u = r[a];
                      i[u] = e(n[u], u, n);
                    }
                    return i;
                  },
                  identity: Rn,
                  constant: Y,
                  noop: Nn,
                  toPath: En,
                  property: In,
                  propertyOf: function (e) {
                    return null == e
                      ? Nn
                      : function (n) {
                          return An(e, n);
                        };
                  },
                  matcher: Cn,
                  matches: Cn,
                  times: function (n, e, t) {
                    var r = Array(Math.max(0, n));
                    e = Mn(e, t, 1);
                    for (var o = 0; o < n; o++) r[o] = e(o);
                    return r;
                  },
                  random: Bn,
                  now: Ln,
                  escape: Qn,
                  unescape: Yn,
                  templateSettings: Vn,
                  template: function (i, n, e) {
                    n = On({}, (n = !n && e ? e : n), en.templateSettings);
                    var t,
                      e = RegExp(
                        [
                          (n.escape || zn).source,
                          (n.interpolate || zn).source,
                          (n.evaluate || zn).source,
                        ].join("|") + "|$",
                        "g"
                      ),
                      a = 0,
                      u = "__p+='";
                    if (
                      (i.replace(e, function (n, e, t, r, o) {
                        return (
                          (u += i.slice(a, o).replace(Hn, Kn)),
                          (a = o + n.length),
                          e
                            ? (u +=
                                "'+\n((__t=(" +
                                e +
                                "))==null?'':_.escape(__t))+\n'")
                            : t
                            ? (u += "'+\n((__t=(" + t + "))==null?'':__t)+\n'")
                            : r && (u += "';\n" + r + "\n__p+='"),
                          n
                        );
                      }),
                      (u += "';\n"),
                      (e = n.variable))
                    ) {
                      if (!$n.test(e))
                        throw new Error(
                          "variable is not a bare identifier: " + e
                        );
                    } else (u = "with(obj||{}){\n" + u + "}\n"), (e = "obj");
                    u =
                      "var __t,__p='',__j=Array.prototype.join,print=function(){__p+=__j.call(arguments,'');};\n" +
                      u +
                      "return __p;\n";
                    try {
                      t = new Function(e, "_", u);
                    } catch (n) {
                      throw ((n.source = u), n);
                    }
                    return (
                      ((n = function (n) {
                        return t.call(this, n, en);
                      }).source = "function(" + e + "){\n" + u + "}"),
                      n
                    );
                  },
                  result: function (n, e, t) {
                    var r = (e = Tn(e)).length;
                    if (!r) return I(t) ? t.call(n) : t;
                    for (var o = 0; o < r; o++) {
                      var i = null == n ? void 0 : n[e[o]];
                      void 0 === i && ((i = t), (o = r)),
                        (n = I(i) ? i.call(n) : i);
                    }
                    return n;
                  },
                  uniqueId: function (n) {
                    var e = ++Jn + "";
                    return n ? n + e : e;
                  },
                  chain: function (n) {
                    return ((n = en(n))._chain = !0), n;
                  },
                  iteratee: Dn,
                  partial: Zn,
                  bind: ne,
                  bindAll: re,
                  memoize: function (r, o) {
                    var i = function (n) {
                      var e = i.cache,
                        t = "" + (o ? o.apply(this, arguments) : n);
                      return L(e, t) || (e[t] = r.apply(this, arguments)), e[t];
                    };
                    return (i.cache = {}), i;
                  },
                  delay: oe,
                  defer: ie,
                  throttle: function (t, r, o) {
                    var i,
                      a,
                      u,
                      c,
                      s = 0;
                    function l() {
                      (s = !1 === o.leading ? 0 : Ln()),
                        (i = null),
                        (c = t.apply(a, u)),
                        i || (a = u = null);
                    }
                    function n() {
                      var n = Ln();
                      s || !1 !== o.leading || (s = n);
                      var e = r - (n - s);
                      return (
                        (a = this),
                        (u = arguments),
                        e <= 0 || r < e
                          ? (i && (clearTimeout(i), (i = null)),
                            (s = n),
                            (c = t.apply(a, u)),
                            i || (a = u = null))
                          : i || !1 === o.trailing || (i = setTimeout(l, e)),
                        c
                      );
                    }
                    return (
                      (o = o || {}),
                      (n.cancel = function () {
                        clearTimeout(i), (s = 0), (i = a = u = null);
                      }),
                      n
                    );
                  },
                  debounce: function (e, t, r) {
                    var o,
                      i,
                      a,
                      u,
                      c,
                      s = function () {
                        var n = Ln() - i;
                        n < t
                          ? (o = setTimeout(s, t - n))
                          : ((o = null),
                            r || (u = e.apply(c, a)),
                            o || (a = c = null));
                      },
                      n = m(function (n) {
                        return (
                          (c = this),
                          (a = n),
                          (i = Ln()),
                          o ||
                            ((o = setTimeout(s, t)), r && (u = e.apply(c, a))),
                          u
                        );
                      });
                    return (
                      (n.cancel = function () {
                        clearTimeout(o), (o = a = c = null);
                      }),
                      n
                    );
                  },
                  wrap: function (n, e) {
                    return Zn(e, n);
                  },
                  negate: ae,
                  compose: function () {
                    var t = arguments,
                      r = t.length - 1;
                    return function () {
                      for (var n = r, e = t[r].apply(this, arguments); n--; )
                        e = t[n].call(this, e);
                      return e;
                    };
                  },
                  after: function (n, e) {
                    return function () {
                      if (--n < 1) return e.apply(this, arguments);
                    };
                  },
                  before: ue,
                  once: n,
                  findKey: ce,
                  findIndex: le,
                  findLastIndex: C,
                  sortedIndex: fe,
                  indexOf: ye,
                  lastIndexOf: R,
                  find: he,
                  detect: he,
                  findWhere: function (n, e) {
                    return he(n, Cn(e));
                  },
                  each: de,
                  forEach: de,
                  map: be,
                  collect: be,
                  reduce: i,
                  foldl: i,
                  inject: i,
                  reduceRight: M,
                  foldr: M,
                  filter: ge,
                  select: ge,
                  reject: function (n, e, t) {
                    return ge(n, ae(Fn(e)), t);
                  },
                  every: me,
                  all: me,
                  some: je,
                  any: je,
                  contains: we,
                  includes: we,
                  include: we,
                  invoke: F,
                  pluck: Se,
                  where: function (n, e) {
                    return ge(n, Cn(e));
                  },
                  max: xe,
                  min: function (n, r, e) {
                    var t,
                      o,
                      i = 1 / 0,
                      a = 1 / 0;
                    if (
                      null == r ||
                      ("number" == typeof r &&
                        "object" != typeof n[0] &&
                        null != n)
                    )
                      for (
                        var u = 0, c = (n = ee(n) ? n : gn(n)).length;
                        u < c;
                        u++
                      )
                        null != (t = n[u]) && t < i && (i = t);
                    else
                      (r = Fn(r, e)),
                        de(n, function (n, e, t) {
                          ((o = r(n, e, t)) < a ||
                            (o === 1 / 0 && i === 1 / 0)) &&
                            ((i = n), (a = o));
                        });
                    return i;
                  },
                  shuffle: function (n) {
                    return Oe(n, 1 / 0);
                  },
                  sample: Oe,
                  sortBy: function (n, r, e) {
                    var o = 0;
                    return (
                      (r = Fn(r, e)),
                      Se(
                        be(n, function (n, e, t) {
                          return { value: n, index: o++, criteria: r(n, e, t) };
                        }).sort(function (n, e) {
                          var t = n.criteria,
                            r = e.criteria;
                          if (t !== r) {
                            if (r < t || void 0 === t) return 1;
                            if (t < r || void 0 === r) return -1;
                          }
                          return n.index - e.index;
                        }),
                        "value"
                      )
                    );
                  },
                  groupBy: u,
                  indexBy: e,
                  countBy: ln,
                  partition: sn,
                  toArray: function (n) {
                    return n
                      ? B(n)
                        ? c.call(n)
                        : O(n)
                        ? n.match(ke)
                        : ee(n)
                        ? be(n, Rn)
                        : gn(n)
                      : [];
                  },
                  size: function (n) {
                    return null == n ? 0 : (ee(n) ? n : Z(n)).length;
                  },
                  pick: Te,
                  omit: fn,
                  first: Ae,
                  head: Ae,
                  take: Ae,
                  initial: Pe,
                  last: function (n, e, t) {
                    return null == n || n.length < 1
                      ? null == e || t
                        ? void 0
                        : []
                      : null == e || t
                      ? n[n.length - 1]
                      : Re(n, Math.max(0, n.length - e));
                  },
                  rest: Re,
                  tail: Re,
                  drop: Re,
                  compact: function (n) {
                    return ge(n, Boolean);
                  },
                  flatten: function (n, e) {
                    return te(n, e, !1);
                  },
                  without: D,
                  uniq: Ie,
                  unique: Ie,
                  union: yn,
                  intersection: function (n) {
                    for (
                      var e = [], t = arguments.length, r = 0, o = J(n);
                      r < o;
                      r++
                    ) {
                      var i = n[r];
                      if (!we(e, i)) {
                        for (var a = 1; a < t && we(arguments[a], i); a++);
                        a === t && e.push(i);
                      }
                    }
                    return e;
                  },
                  difference: Ce,
                  unzip: Me,
                  transpose: Me,
                  zip: Wn,
                  object: function (n, e) {
                    for (var t = {}, r = 0, o = J(n); r < o; r++)
                      e ? (t[n[r]] = e[r]) : (t[n[r][0]] = n[r][1]);
                    return t;
                  },
                  range: function (n, e, t) {
                    null == e && ((e = n || 0), (n = 0)),
                      (t = t || (e < n ? -1 : 1));
                    for (
                      var r = Math.max(Math.ceil((e - n) / t), 0),
                        o = Array(r),
                        i = 0;
                      i < r;
                      i++, n += t
                    )
                      o[i] = n;
                    return o;
                  },
                  chunk: function (n, e) {
                    if (null == e || e < 1) return [];
                    for (var t = [], r = 0, o = n.length; r < o; )
                      t.push(c.call(n, r, (r += e)));
                    return t;
                  },
                  mixin: De,
                  default: en,
                });
                return (Wn._ = Wn);
              }),
              "object" == typeof i && void 0 !== o
                ? (o.exports = e())
                : "function" == typeof define && define.amd
                ? define("underscore", e)
                : ((n =
                    "undefined" != typeof globalThis ? globalThis : n || self),
                  (t = n._),
                  ((r = n._ = e()).noConflict = function () {
                    return (n._ = t), r;
                  }));
          }.call(this);
        }.call(
          this,
          "undefined" != typeof global
            ? global
            : "undefined" != typeof self
            ? self
            : "undefined" != typeof window
            ? window
            : {}
        );
      },
      {},
    ],
    68: [
      function (n, e, t) {
        "use strict";
        function a(n, e) {
          for (var t = 0; t < e.length; t++) {
            var r = e[t];
            (r.enumerable = r.enumerable || !1),
              (r.configurable = !0),
              "value" in r && (r.writable = !0),
              Object.defineProperty(n, r.key, r);
          }
        }
        function u() {
          return (u =
            "undefined" != typeof Reflect && Reflect.get
              ? Reflect.get.bind()
              : function (n, e, t) {
                  var r = (function (n, e) {
                    for (
                      ;
                      !Object.prototype.hasOwnProperty.call(n, e) &&
                      null !== (n = l(n));

                    );
                    return n;
                  })(n, e);
                  if (r) {
                    e = Object.getOwnPropertyDescriptor(r, e);
                    return e.get
                      ? e.get.call(arguments.length < 3 ? n : t)
                      : e.value;
                  }
                }).apply(this, arguments);
        }
        function c(n, e) {
          return (c = Object.setPrototypeOf
            ? Object.setPrototypeOf.bind()
            : function (n, e) {
                return (n.__proto__ = e), n;
              })(n, e);
        }
        function s(t) {
          var r = (function () {
            if ("undefined" == typeof Reflect || !Reflect.construct) return !1;
            if (Reflect.construct.sham) return !1;
            if ("function" == typeof Proxy) return !0;
            try {
              return (
                Boolean.prototype.valueOf.call(
                  Reflect.construct(Boolean, [], function () {})
                ),
                !0
              );
            } catch (n) {
              return !1;
            }
          })();
          return function () {
            var n,
              e = l(t);
            return (function (n, e) {
              {
                if (e && ("object" == typeof e || "function" == typeof e))
                  return e;
                if (void 0 !== e)
                  throw new TypeError(
                    "Derived constructors may only return object or undefined"
                  );
              }
              return (function (n) {
                if (void 0 !== n) return n;
                throw new ReferenceError(
                  "this hasn't been initialised - super() hasn't been called"
                );
              })(n);
            })(
              this,
              r
                ? ((n = l(this).constructor),
                  Reflect.construct(e, arguments, n))
                : e.apply(this, arguments)
            );
          };
        }
        function l(n) {
          return (l = Object.setPrototypeOf
            ? Object.getPrototypeOf.bind()
            : function (n) {
                return n.__proto__ || Object.getPrototypeOf(n);
              })(n);
        }
        n("core-js/modules/es.reflect.construct.js"),
          n("core-js/modules/es.reflect.get.js");
        var f = n("underscore"),
          p = n("../events");
        e.exports = function (n) {
          var i = n.getComponent("MenuItem");
          return (function () {
            !(function (n, e) {
              if ("function" != typeof e && null !== e)
                throw new TypeError(
                  "Super expression must either be null or a function"
                );
              (n.prototype = Object.create(e && e.prototype, {
                constructor: { value: n, writable: !0, configurable: !0 },
              })),
                Object.defineProperty(n, "prototype", { writable: !1 }),
                e && c(n, e);
            })(o, i);
            var n,
              e,
              t,
              r = s(o);
            function o(n, e) {
              !(function (n, e) {
                if (!(n instanceof e))
                  throw new TypeError("Cannot call a class as a function");
              })(this, o);
              var t = e.source;
              if (!f.isObject(t))
                throw new Error(
                  'was not provided a "source" object, but rather: ' + typeof t
                );
              return (
                (e = f.extend({ selectable: !0, label: t.label }, e)),
                ((e = r.call(this, n, e)).source = t),
                e
              );
            }
            return (
              (n = o),
              (e = [
                {
                  key: "handleClick",
                  value: function (n) {
                    u(l(o.prototype), "handleClick", this).call(this, n),
                      this.player().trigger(p.QUALITY_REQUESTED, this.source);
                  },
                },
              ]) && a(n.prototype, e),
              t && a(n, t),
              Object.defineProperty(n, "prototype", { writable: !1 }),
              o
            );
          })();
        };
      },
      {
        "../events": 70,
        "core-js/modules/es.reflect.construct.js": 65,
        "core-js/modules/es.reflect.get.js": 66,
        underscore: 67,
      },
    ],
    69: [
      function (n, e, t) {
        "use strict";
        function u(n, e) {
          for (var t = 0; t < e.length; t++) {
            var r = e[t];
            (r.enumerable = r.enumerable || !1),
              (r.configurable = !0),
              "value" in r && (r.writable = !0),
              Object.defineProperty(n, r.key, r);
          }
        }
        function c() {
          return (c =
            "undefined" != typeof Reflect && Reflect.get
              ? Reflect.get.bind()
              : function (n, e, t) {
                  var r = (function (n, e) {
                    for (
                      ;
                      !Object.prototype.hasOwnProperty.call(n, e) &&
                      null !== (n = p(n));

                    );
                    return n;
                  })(n, e);
                  if (r) {
                    e = Object.getOwnPropertyDescriptor(r, e);
                    return e.get
                      ? e.get.call(arguments.length < 3 ? n : t)
                      : e.value;
                  }
                }).apply(this, arguments);
        }
        function s(n, e) {
          return (s = Object.setPrototypeOf
            ? Object.setPrototypeOf.bind()
            : function (n, e) {
                return (n.__proto__ = e), n;
              })(n, e);
        }
        function l(t) {
          var r = (function () {
            if ("undefined" == typeof Reflect || !Reflect.construct) return !1;
            if (Reflect.construct.sham) return !1;
            if ("function" == typeof Proxy) return !0;
            try {
              return (
                Boolean.prototype.valueOf.call(
                  Reflect.construct(Boolean, [], function () {})
                ),
                !0
              );
            } catch (n) {
              return !1;
            }
          })();
          return function () {
            var n,
              e = p(t);
            return (function (n, e) {
              {
                if (e && ("object" == typeof e || "function" == typeof e))
                  return e;
                if (void 0 !== e)
                  throw new TypeError(
                    "Derived constructors may only return object or undefined"
                  );
              }
              return f(n);
            })(
              this,
              r
                ? ((n = p(this).constructor),
                  Reflect.construct(e, arguments, n))
                : e.apply(this, arguments)
            );
          };
        }
        function f(n) {
          if (void 0 === n)
            throw new ReferenceError(
              "this hasn't been initialised - super() hasn't been called"
            );
          return n;
        }
        function p(n) {
          return (p = Object.setPrototypeOf
            ? Object.getPrototypeOf.bind()
            : function (n) {
                return n.__proto__ || Object.getPrototypeOf(n);
              })(n);
        }
        n("core-js/modules/es.reflect.construct.js"),
          n("core-js/modules/es.reflect.get.js"),
          n("core-js/modules/es.array.map.js");
        var y = n("underscore"),
          h = n("../events"),
          r = n("./QualityOption"),
          d = "vjs-quality-changing";
        e.exports = function (n) {
          var i = n.getComponent("MenuButton"),
            a = r(n),
            e = (function () {
              !(function (n, e) {
                if ("function" != typeof e && null !== e)
                  throw new TypeError(
                    "Super expression must either be null or a function"
                  );
                (n.prototype = Object.create(e && e.prototype, {
                  constructor: { value: n, writable: !0, configurable: !0 },
                })),
                  Object.defineProperty(n, "prototype", { writable: !1 }),
                  e && s(n, e);
              })(o, i);
              var n,
                e,
                t,
                r = l(o);
              function o(t, n) {
                return (
                  (function (n, e) {
                    if (!(n instanceof e))
                      throw new TypeError("Cannot call a class as a function");
                  })(this, o),
                  (n = r.call(this, t, n)),
                  t.on(
                    h.QUALITY_REQUESTED,
                    function (n, e) {
                      this.setSelectedSource(e),
                        t.addClass(d),
                        t.one("loadeddata", function () {
                          t.removeClass(d);
                        });
                    }.bind(f(n))
                  ),
                  t.on(
                    h.PLAYER_SOURCES_CHANGED,
                    function () {
                      this.update();
                    }.bind(f(n))
                  ),
                  t.on(
                    h.QUALITY_SELECTED,
                    function (n, e) {
                      this.setSelectedSource(e);
                    }.bind(f(n))
                  ),
                  t.one(
                    "ready",
                    function () {
                      (this.selectedSrc = t.src()), this.update();
                    }.bind(f(n))
                  ),
                  n.controlText("Open quality selector menu"),
                  n
                );
              }
              return (
                (n = o),
                (e = [
                  {
                    key: "setSelectedSource",
                    value: function (n) {
                      var e = n ? n.src : void 0;
                      this.selectedSrc !== e &&
                        ((this.selectedSrc = e),
                        y.each(this.items, function (n) {
                          n.selected(n.source.src === e);
                        }));
                    },
                  },
                  {
                    key: "createItems",
                    value: function () {
                      var e = this.player(),
                        n = e.currentSources();
                      return !n || n.length < 2
                        ? []
                        : y.map(
                            n,
                            function (n) {
                              return new a(e, {
                                source: n,
                                selected: n.src === this.selectedSrc,
                              });
                            }.bind(this)
                          );
                    },
                  },
                  {
                    key: "buildWrapperCSSClass",
                    value: function () {
                      return (
                        "vjs-quality-selector " +
                        c(p(o.prototype), "buildWrapperCSSClass", this).call(
                          this
                        )
                      );
                    },
                  },
                ]) && u(n.prototype, e),
                t && u(n, t),
                Object.defineProperty(n, "prototype", { writable: !1 }),
                o
              );
            })();
          return n.registerComponent("QualitySelector", e), e;
        };
      },
      {
        "../events": 70,
        "./QualityOption": 68,
        "core-js/modules/es.array.map.js": 64,
        "core-js/modules/es.reflect.construct.js": 65,
        "core-js/modules/es.reflect.get.js": 66,
        underscore: 67,
      },
    ],
    70: [
      function (n, e, t) {
        "use strict";
        e.exports = {
          QUALITY_REQUESTED: "qualityRequested",
          QUALITY_SELECTED: "qualitySelected",
          PLAYER_SOURCES_CHANGED: "playerSourcesChanged",
        };
      },
      {},
    ],
    71: [
      function (n, e, t) {
        "use strict";
        var u = n("underscore"),
          r = n("./events"),
          o = n("./components/QualitySelector"),
          i = n("./middleware/SourceInterceptor"),
          c = n("./util/SafeSeek");
        (e.exports = function (n) {
          (n = n || window.videojs),
            o(n),
            i(n),
            n.hook("setup", function (a) {
              a.on(r.QUALITY_REQUESTED, function (n, e) {
                var t = a.currentSources(),
                  r = a.currentTime(),
                  o = a.playbackRate(),
                  i = a.paused();
                u.each(t, function (n) {
                  n.selected = !1;
                }),
                  (u.findWhere(t, { src: e.src }).selected = !0),
                  a._qualitySelectorSafeSeek &&
                    a._qualitySelectorSafeSeek.onQualitySelectionChange(),
                  a.src(t),
                  a.ready(function () {
                    (a._qualitySelectorSafeSeek &&
                      !a._qualitySelectorSafeSeek.hasFinished()) ||
                      ((a._qualitySelectorSafeSeek = new c(a, r)),
                      a.playbackRate(o)),
                      i || a.play();
                  });
              });
            });
        }),
          (e.exports.EVENTS = r);
      },
      {
        "./components/QualitySelector": 69,
        "./events": 70,
        "./middleware/SourceInterceptor": 72,
        "./util/SafeSeek": 74,
        underscore: 67,
      },
    ],
    72: [
      function (n, e, t) {
        "use strict";
        var o = n("underscore"),
          i = n("../events");
        e.exports = function (n) {
          n.use("*", function (r) {
            return {
              setSource: function (n, e) {
                var t = r.currentSources();
                r._qualitySelectorSafeSeek &&
                  r._qualitySelectorSafeSeek.onPlayerSourcesChange(),
                  o.isEqual(t, r._qualitySelectorPreviousSources) ||
                    (r.trigger(i.PLAYER_SOURCES_CHANGED, t),
                    (r._qualitySelectorPreviousSources = t)),
                  (t = o.find(t, function (n) {
                    return (
                      !0 === n.selected ||
                      "true" === n.selected ||
                      "selected" === n.selected
                    );
                  })),
                  r.trigger(i.QUALITY_SELECTED, (n = t || n)),
                  e(null, n);
              },
            };
          });
        };
      },
      { "../events": 70, underscore: 67 },
    ],
    73: [
      function (n, e, t) {
        "use strict";
        n("./index")();
      },
      { "./index": 71 },
    ],
    74: [
      function (n, e, t) {
        "use strict";
        function o(n, e) {
          for (var t = 0; t < e.length; t++) {
            var r = e[t];
            (r.enumerable = r.enumerable || !1),
              (r.configurable = !0),
              "value" in r && (r.writable = !0),
              Object.defineProperty(n, r.key, r);
          }
        }
        e.exports = (function () {
          function t(n, e) {
            !(function (n, e) {
              if (!(n instanceof e))
                throw new TypeError("Cannot call a class as a function");
            })(this, t),
              (this._player = n),
              (this._seekToTime = e),
              (this._hasFinished = !1),
              (this._keepThisInstanceWhenPlayerSourcesChange = !1),
              this._seekWhenSafe();
          }
          var n, e, r;
          return (
            (n = t),
            (e = [
              {
                key: "_seekWhenSafe",
                value: function () {
                  this._player.readyState() < 3
                    ? ((this._seekFn = this._seek.bind(this)),
                      this._player.one("canplay", this._seekFn))
                    : this._seek();
                },
              },
              {
                key: "onPlayerSourcesChange",
                value: function () {
                  this._keepThisInstanceWhenPlayerSourcesChange
                    ? (this._keepThisInstanceWhenPlayerSourcesChange = !1)
                    : this.cancel();
                },
              },
              {
                key: "onQualitySelectionChange",
                value: function () {
                  this.hasFinished() ||
                    (this._keepThisInstanceWhenPlayerSourcesChange = !0);
                },
              },
              {
                key: "_seek",
                value: function () {
                  this._player.currentTime(this._seekToTime),
                    (this._keepThisInstanceWhenPlayerSourcesChange = !1),
                    (this._hasFinished = !0);
                },
              },
              {
                key: "hasFinished",
                value: function () {
                  return this._hasFinished;
                },
              },
              {
                key: "cancel",
                value: function () {
                  this._player.off("canplay", this._seekFn),
                    (this._keepThisInstanceWhenPlayerSourcesChange = !1),
                    (this._hasFinished = !0);
                },
              },
            ]) && o(n.prototype, e),
            r && o(n, r),
            Object.defineProperty(n, "prototype", { writable: !1 }),
            t
          );
        })();
      },
      {},
    ],
  },
  {},
  [73]
);
//# sourceMappingURL=silvermine-videojs-quality-selector.min.js.map
