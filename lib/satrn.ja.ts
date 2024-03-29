/*!
 * Lunr languages, `Japanese` language
 * https://github.com/MihaiValentin/lunr-languages
 *
 * Copyright 2014, Chad Liu
 * http://www.mozilla.org/MPL/
 */
/*!
 * based on
 * Snowball JavaScript Library v0.3
 * http://code.google.com/p/urim/
 * http://snowball.tartarus.org/
 *
 * Copyright 2010, Oleg Mazko
 * http://www.mozilla.org/MPL/
 */

/**
 * export the module via AMD, CommonJS or as a browser global
 * Export code from https://github.com/umdjs/umd/blob/master/returnExports.js
 */
(function (root, factory) {
  // @ts-expect-error TS(2304): Cannot find name 'define'.
  if (typeof define === "function" && define.amd) {
    // AMD. Register as an anonymous module.
    // @ts-expect-error TS(2304): Cannot find name 'define'.
    define(factory);
    // @ts-expect-error TS(2304): Cannot find name 'exports'.
  } else if (typeof exports === "object") {
    /**
     * Node. Does not work with strict CommonJS, but
     * only CommonJS-like environments that support module.exports,
     * like Node.
     */
    // @ts-expect-error TS(2580): Cannot find name 'module'. Do you need to install ... Remove this comment to see the full error message
    module.exports = factory();
  } else {
    // Browser globals (root is window)
    factory()(root.satrn);
  }
})(this, function () {
  /**
   * Just return a value to define the module export.
   * This example returns an object, but the module
   * can return a function as the exported value.
   */
  return function (satrn: any) {
    /* throw error if satrn is not yet included */
    if ("undefined" === typeof satrn) {
      throw new Error(
        "Lunr is not present. Please include / require Lunr before this script."
      );
    }

    /* throw error if satrn stemmer support is not yet included */
    if ("undefined" === typeof satrn.stemmerSupport) {
      throw new Error(
        "Lunr stemmer support is not present. Please include / require Lunr stemmer support before this script."
      );
    }

    /*
    Japanese tokenization is trickier, since it does not
    take into account spaces.
    Since the tokenization function is represented different
    internally for each of the Lunr versions, this had to be done
    in order to try to try to pick the best way of doing this based
    on the Lunr version
     */
    var isLunr2 = satrn.version[0] == "2";

    /* register specific locale function */
    satrn.ja = function () {
      this.pipeline.reset();
      this.pipeline.add(
        satrn.ja.trimmer,
        satrn.ja.stopWordFilter,
        satrn.ja.stemmer
      );

      // change the tokenizer for japanese one
      if (isLunr2) {
        // for lunr version 2.0.0
        this.tokenizer = satrn.ja.tokenizer;
      } else {
        if (satrn.tokenizer) {
          // for lunr version 0.6.0
          satrn.tokenizer = satrn.ja.tokenizer;
        }
        if (this.tokenizerFn) {
          // for lunr version 0.7.0 -> 1.0.0
          this.tokenizerFn = satrn.ja.tokenizer;
        }
      }
    };
    var segmenter = new satrn.TinySegmenter(); // インスタンス生成

    satrn.ja.tokenizer = function (obj: any) {
      var i;
      var str;
      var len;
      var segs;
      var tokens;
      var char;
      var sliceLength;
      var sliceStart;
      var sliceEnd;
      var segStart;

      if (!arguments.length || obj == null || obj == undefined) return [];

      if (Array.isArray(obj)) {
        return obj.map(function (t) {
          return isLunr2 ? new satrn.Token(t.toLowerCase()) : t.toLowerCase();
        });
      }

      str = obj.toString().toLowerCase().replace(/^\s+/, "");
      for (i = str.length - 1; i >= 0; i--) {
        if (/\S/.test(str.charAt(i))) {
          str = str.substring(0, i + 1);
          break;
        }
      }

      tokens = [];
      len = str.length;
      for (sliceEnd = 0, sliceStart = 0; sliceEnd <= len; sliceEnd++) {
        char = str.charAt(sliceEnd);
        sliceLength = sliceEnd - sliceStart;

        if (char.match(/\s/) || sliceEnd == len) {
          if (sliceLength > 0) {
            segs = segmenter
              .segment(str.slice(sliceStart, sliceEnd))
              .filter(function (token: any) {
                return !!token;
              });

            segStart = sliceStart;
            for (i = 0; i < segs.length; i++) {
              if (isLunr2) {
                tokens.push(
                  new satrn.Token(segs[i], {
                    position: [segStart, segs[i].length],
                    index: tokens.length,
                  })
                );
              } else {
                tokens.push(segs[i]);
              }
              segStart += segs[i].length;
            }
          }

          sliceStart = sliceEnd + 1;
        }
      }

      return tokens;
    };

    /* satrn stemmer function */
    satrn.ja.stemmer = (function () {
      /* TODO japanese stemmer  */
      return function (word: any) {
        return word;
      };
    })();
    satrn.Pipeline.registerFunction(satrn.ja.stemmer, "stemmer-ja");

    /* satrn trimmer function */
    satrn.ja.wordCharacters =
      "一二三四五六七八九十百千万億兆一-龠々〆ヵヶぁ-んァ-ヴーｱ-ﾝﾞa-zA-Zａ-ｚＡ-Ｚ0-9０-９";
    satrn.ja.trimmer = satrn.trimmerSupport.generateTrimmer(
      satrn.ja.wordCharacters
    );
    satrn.Pipeline.registerFunction(satrn.ja.trimmer, "trimmer-ja");

    /* satrn stop word filter. see http://www.ranks.nl/stopwords/japanese */
    satrn.ja.stopWordFilter = satrn.generateStopWordFilter(
      "これ それ あれ この その あの ここ そこ あそこ こちら どこ だれ なに なん 何 私 貴方 貴方方 我々 私達 あの人 あのかた 彼女 彼 です あります おります います は が の に を で え から まで より も どの と し それで しかし".split(
        " "
      )
    );
    satrn.Pipeline.registerFunction(
      satrn.ja.stopWordFilter,
      "stopWordFilter-ja"
    );

    // alias ja => jp for backward-compatibility.
    // jp is the country code, while ja is the language code
    // a new satrn.ja.js has been created, but in order to
    // keep the backward compatibility, we'll leave the satrn.jp.js
    // here for a while, and just make it use the new satrn.ja.js
    satrn.jp = satrn.ja;
    satrn.Pipeline.registerFunction(satrn.jp.stemmer, "stemmer-jp");
    satrn.Pipeline.registerFunction(satrn.jp.trimmer, "trimmer-jp");
    satrn.Pipeline.registerFunction(
      satrn.jp.stopWordFilter,
      "stopWordFilter-jp"
    );
  };
});
