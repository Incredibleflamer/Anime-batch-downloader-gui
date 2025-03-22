// Taken From : https://github.com/Dungeon69/Junk && https://github.com/consumet/consumet.ts

class AnimeKaiDecoder {
  #reverseIt = (n) => {
    return n.split("").reverse().join("");
  };

  #base64UrlEncode = (str) => {
    return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  };

  #substitute = (input, keys, values) => {
    const map = Object.fromEntries(
      keys.split("").map((key, i) => [key, values[i] || ""])
    );
    const a = input
      .split("")
      .map((char) => map[char] || char)
      .join("");
    return a;
  };

  #transform = (n, t) => {
    const v = Array.from({ length: 256 }, (_, i) => i);
    let c = 0,
      f = "";

    for (let w = 0; w < 256; w++) {
      c = (c + v[w] + n.charCodeAt(w % n.length)) % 256;
      [v[w], v[c]] = [v[c], v[w]];
    }
    for (let a = (c = 0), w = 0; a < t.length; a++) {
      w = (w + 1) % 256;
      c = (c + v[w]) % 256;
      [v[w], v[c]] = [v[c], v[w]];
      f += String.fromCharCode(t.charCodeAt(a) ^ v[(v[w] + v[c]) % 256]);
    }

    return f;
  };

  #base64UrlDecode = (n) => {
    n = n
      .padEnd(n.length + ((4 - (n.length % 4)) % 4), "=")
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    return atob(n);
  };

  GenerateToken = (n) => {
    n = encodeURIComponent(n);
    return (n = this.#base64UrlEncode(
      this.#substitute(
        this.#base64UrlEncode(
          this.#transform(
            "sXmH96C4vhRrgi8",
            this.#reverseIt(
              this.#reverseIt(
                this.#base64UrlEncode(
                  this.#transform(
                    "kOCJnByYmfI",
                    this.#substitute(
                      this.#substitute(
                        this.#reverseIt(
                          this.#base64UrlEncode(
                            this.#transform("0DU8ksIVlFcia2", n)
                          )
                        ),
                        "1wctXeHqb2",
                        "1tecHq2Xbw"
                      ),
                      "48KbrZx1ml",
                      "Km8Zb4lxr1"
                    )
                  )
                )
              )
            )
          )
        ),
        "hTn79AMjduR5",
        "djn5uT7AMR9h"
      )
    ));
  };

  DecodeIframeData = (n) => {
    n = `${n}`;
    n = this.#transform(
      "0DU8ksIVlFcia2",
      this.#base64UrlDecode(
        this.#reverseIt(
          this.#substitute(
            this.#substitute(
              this.#transform(
                "kOCJnByYmfI",
                this.#base64UrlDecode(
                  this.#reverseIt(
                    this.#reverseIt(
                      this.#transform(
                        "sXmH96C4vhRrgi8",
                        this.#base64UrlDecode(
                          this.#substitute(
                            this.#base64UrlDecode(n),
                            "djn5uT7AMR9h",
                            "hTn79AMjduR5"
                          )
                        )
                      )
                    )
                  )
                )
              ),
              "Km8Zb4lxr1",
              "48KbrZx1ml"
            ),
            "1tecHq2Xbw",
            "1wctXeHqb2"
          )
        )
      )
    );
    return decodeURIComponent(n);
  };

  Decode = (n) => {
    n = this.#substitute(
      this.#transform(
        "fnxEj3tD4Bl0X",
        this.#base64UrlDecode(
          this.#reverseIt(
            this.#reverseIt(
              this.#transform(
                "IjilzMV57GrnF",
                this.#base64UrlDecode(
                  this.#substitute(
                    this.#reverseIt(
                      this.#substitute(
                        this.#transform(
                          "PlzI69YVCtGwoa8",
                          this.#base64UrlDecode(this.#base64UrlDecode(`${n}`))
                        ),
                        "c2IfHZwSX1mj",
                        "mwfXcS2ZjI1H"
                      )
                    ),
                    "82NkgQDYbIF",
                    "82IQNkFgYbD"
                  )
                )
              )
            )
          )
        )
      ),
      "crwkth05iJR8",
      "JRkt8rw0i5ch"
    );

    return decodeURIComponent(n);
  };
}

module.exports = AnimeKaiDecoder;
