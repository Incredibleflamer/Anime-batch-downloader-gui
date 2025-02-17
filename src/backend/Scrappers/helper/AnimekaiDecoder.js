class AnimekaiDecoder {
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
    let a = input
      .split("")
      .map((char) => map[char] || char)
      .join("");

    return a;
  };
  #transform = (n, t) => {
    let v = Array.from({ length: 256 }, (_, i) => i),
      c = 0,
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

    let temp1 = this.#base64UrlEncode(
      this.#transform("gEUzYavPrGpj", this.#reverseIt(n))
    );

    temp1 = this.#substitute(temp1, "U8nv0tEFGTb", "bnGvE80UtTF");
    temp1 = this.#substitute(temp1, "9ysoRqBZHV", "oqsZyVHBR9");
    temp1 = this.#reverseIt(
      this.#base64UrlEncode(this.#transform("CSk63F7PwBHJKa", temp1))
    );
    temp1 = this.#substitute(temp1, "cKj9BMN15LsdH", "NL5cdKs1jB9MH");
    return this.#base64UrlEncode(
      this.#reverseIt(
        this.#base64UrlEncode(this.#transform("T2zEp1WHL9CsSk7", temp1))
      )
    );
  };
  DecodeIframeData = (n) => {
    var temp1 = this.#base64UrlDecode(
      this.#reverseIt(this.#base64UrlDecode(n))
    );

    var temp2 = this.#transform("T2zEp1WHL9CsSk7", temp1);

    var temp3 = this.#reverseIt(
      this.#substitute(temp2, "NL5cdKs1jB9MH", "cKj9BMN15LsdH")
    );
    var temp4 = this.#transform("CSk63F7PwBHJKa", this.#base64UrlDecode(temp3));
    var temp5 = this.#substitute(temp4, "oqsZyVHBR9", "9ysoRqBZHV");
    var temp6 = this.#base64UrlDecode(
      this.#substitute(temp5, "bnGvE80UtTF", "U8nv0tEFGTb")
    );
    n = this.#reverseIt(this.#transform("gEUzYavPrGpj", temp6));

    return decodeURIComponent(n);
  };
  Decode = (n) => {
    n = this.#base64UrlDecode(this.#base64UrlDecode(n));
    n = this.#reverseIt(this.#transform("E438hS1W9oRmB", n));
    n = this.#reverseIt(
      this.#substitute(n, "D5qdzkGANMQZEi", "Q5diEGMADkZzNq")
    );
    n = this.#base64UrlDecode(
      this.#substitute(
        this.#transform("NZcfoMD7JpIrgQE", this.#base64UrlDecode(n)),
        "kTr0pjKzBqZV",
        "kZpjzTV0KqBr"
      )
    );
    n = this.#reverseIt(
      this.#substitute(
        this.#transform("Gay7bxj5B81TJFM", n),
        "zcUxoJTi3fgyS",
        "oSgyJUfizcTx3"
      )
    );
    return decodeURIComponent(n);
  };
}

module.exports = AnimekaiDecoder;
