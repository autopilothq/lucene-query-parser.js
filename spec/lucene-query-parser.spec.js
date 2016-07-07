if (typeof define !== 'function') { var define = require('amdefine')(module) }


define(["../lib/lucene-query-parser.js"], function(lucenequeryparser) {
  describe("lucenequeryparser: whitespace handling", function() {

    // term parsing
    it("handles empty string", function() {
        var results = lucenequeryparser.parse('');

        expect(isEmpty(results)).toBe(true);
    });

    it("handles leading whitespace with no contents", function() {
        var results = lucenequeryparser.parse(' \r\n');

        expect(isEmpty(results)).toBe(true);
    });

    it("handles leading whitespace before an expression string", function() {
        var results = lucenequeryparser.parse(' Test:Foo');

        expect(results.field).toBe('Test');
        expect(results.term).toBe('Foo');
    });

    function isEmpty(arr)
    {
        for (var i in arr)
        {
            return false;
        }
        return true;
    }
});

describe("lucenequeryparser: term parsing", function() {

    // term parsing
    it("parses terms", function() {
        var results = lucenequeryparser.parse('bar');

      expect(results.term).toBe('bar');
      expect(results.unquoted).toBe(true);
    });

    it("parses terms that begin with //", function() {
        var results = lucenequeryparser.parse('\\/\\/bar');

      expect(results.term).toBe('\\/\\/bar');
      expect(results.unquoted).toBe(true);
    });

    it("parses quoted terms", function() {
      var results = lucenequeryparser.parse('"fizz buzz"');

      expect(results.term).toBe('fizz buzz');
      expect(results.unquoted).toBeUndefined();
    });


    it("parses terms with +", function() {
        var results = lucenequeryparser.parse('fizz+buzz');

        expect(results.term).toBe('fizz+buzz');
    });

    it("parses terms with -", function() {
        var results = lucenequeryparser.parse('fizz-buzz');

        expect(results.term).toBe('fizz-buzz');
    });

    it("parses term with regular expression", function() {
        var results = lucenequeryparser.parse('/bar/');

        expect(results.term).toBe('bar');
        expect(results.regexpr).toBe(true);
    });

    it("parses term with regular expression containing /", function() {
        var results = lucenequeryparser.parse('/fizz\\/buzz/');

        expect(results.term).toBe('fizz/buzz');
        expect(results.regexpr).toBe(true);
    });

    it("parses term with regular expression that begins with //", function() {
        var results = lucenequeryparser.parse('url_match:/\\/\\/example.com\\/products\\/example.html/');

        expect(results.term).toBe('//example.com/products/example.html');
        expect(results.regexpr).toBe(true);
    });


    it("accepts terms with '-'", function() {
        var results = lucenequeryparser.parse('created_at:>now-5d');

        expect(results.term).toBe('>now-5d');
    });

    it("accepts terms with '+'", function() {
        var results = lucenequeryparser.parse('published_at:>now+5d');

        expect(results.term).toBe('>now+5d');
    });
});

describe("lucenequeryparser: term prefix operators", function() {

    it("parses prefix operators (-)", function() {
        var results = lucenequeryparser.parse('-bar');

        expect(results.term).toBe('bar');
        expect(results.prefix).toBe('-');
    });

    it("parses prefix operator (+)", function() {
        var results = lucenequeryparser.parse('+bar');

        expect(results.term).toBe('bar');
        expect(results.prefix).toBe('+');
    });

    it("parses prefix operator on quoted term (-)", function() {
        var results = lucenequeryparser.parse('-"fizz buzz"');

        expect(results.term).toBe('fizz buzz');
        expect(results.prefix).toBe('-');
    });

    it("parses prefix operator on quoted term (+)", function() {
        var results = lucenequeryparser.parse('+"fizz buzz"');

        expect(results.term).toBe('fizz buzz');
        expect(results.prefix).toBe('+');
    });
});

describe("lucenequeryparser: field name support", function() {

    it("parses implicit field name for term", function() {
        var results = lucenequeryparser.parse('bar');

        expect(results.field).toBe('<implicit>');
        expect(results.term).toBe('bar');
    });

    it("parses implicit field name for quoted term", function() {
        var results = lucenequeryparser.parse('"fizz buzz"');

        expect(results.field).toBe('<implicit>');
        expect(results.term).toBe('fizz buzz');
    });

    it("parses explicit field name for term", function() {
        var results = lucenequeryparser.parse('foo:bar');

        expect(results.field).toBe('foo');
        expect(results.term).toBe('bar');
    });

    it("parses explicit field name for date term", function() {
        var results = lucenequeryparser.parse('foo:2015-01-01');

        expect(results.field).toBe('foo');
        expect(results.term).toBe('2015-01-01');
    });

    it("parses explicit field name including dots (e.g 'sub.field') for term", function() {
        var results = lucenequeryparser.parse('sub.foo:bar');

        expect(results.field).toBe('sub.foo');
        expect(results.term).toBe('bar');
    });


    it("parses explicit field name for quoted term", function() {
        var results = lucenequeryparser.parse('foo:"fizz buzz"');

        expect(results.field).toBe('foo');
        expect(results.term).toBe('fizz buzz');
    });

    it("parses explicit field name for term with prefix", function() {
        var results = lucenequeryparser.parse('foo:-bar');

        expect(results.field).toBe('foo');
        expect(results.term).toBe('bar');
        expect(results.prefix).toBe('-');

        results = lucenequeryparser.parse('foo:+bar');

        expect(results.field).toBe('foo');
        expect(results.term).toBe('bar');
        expect(results.prefix).toBe('+');
    });

    it("parses explicit field name for quoted term with prefix", function() {
        var results = lucenequeryparser.parse('foo:-"fizz buzz"');

        expect(results.field).toBe('foo');
        expect(results.term).toBe('fizz buzz');
        expect(results.prefix).toBe('-');

        results = lucenequeryparser.parse('foo:+"fizz buzz"');

        expect(results.field).toBe('foo');
        expect(results.term).toBe('fizz buzz');
        expect(results.prefix).toBe('+');
    });

});

describe("lucenequeryparser: conjunction operators", function() {

    it("parses implicit conjunction operator (OR)", function() {
        var results = lucenequeryparser.parse('fizz buzz');

        expect(results.left.term).toBe('fizz');
        expect(results.operator).toBe('<implicit>');
        expect(results.right.term).toBe('buzz');
    });

    it("parses explicit conjunction operator (AND)", function() {
        var results = lucenequeryparser.parse('fizz AND buzz');

        expect(results.left.term).toBe('fizz');
        expect(results.operator).toBe('AND');
        expect(results.right.term).toBe('buzz');
    });

    it("parses explicit conjunction operator (OR)", function() {
        var results = lucenequeryparser.parse('fizz OR buzz');

        expect(results.left.term).toBe('fizz');
        expect(results.operator).toBe('OR');
        expect(results.right.term).toBe('buzz');
    });

    it("parses explicit conjunction operator (NOT)", function() {
        var results = lucenequeryparser.parse('fizz NOT buzz');

        expect(results.left.term).toBe('fizz');
        expect(results.operator).toBe('NOT');
        expect(results.right.term).toBe('buzz');
    });

    it("parses explicit conjunction operator (&&)", function() {
        var results = lucenequeryparser.parse('fizz && buzz');

        expect(results.left.term).toBe('fizz');
        expect(results.operator).toBe('AND');
        expect(results.right.term).toBe('buzz');
    });

    it("parses explicit conjunction operator (||)", function() {
        var results = lucenequeryparser.parse('fizz || buzz');

        expect(results.left.term).toBe('fizz');
        expect(results.operator).toBe('OR');
        expect(results.right.term).toBe('buzz');
    });

    it("parses explicit conjunction operator (!)", function() {
        var results = lucenequeryparser.parse('fizz ! buzz');

        expect(results.left.term).toBe('fizz');
        expect(results.operator).toBe('NOT');
        expect(results.right.term).toBe('buzz');
    });
});

describe("lucenequeryparser: parentheses groups", function() {

    it("parses parentheses group", function() {
        var results = lucenequeryparser.parse('fizz (buzz baz)');

        expect(results.left.term).toBe('fizz');
        expect(results.operator).toBe('<implicit>');

        var rightNode = results.right;

        expect(rightNode['left'].term).toBe('buzz');
        expect(rightNode.operator).toBe('<implicit>');
        expect(rightNode['right'].term).toBe('baz');
    });

    it("parses parentheses groups with explicit conjunction operators ", function() {
        var results = lucenequeryparser.parse('fizz AND (buzz OR baz)');

        expect(results.left.term).toBe('fizz');
        expect(results.operator).toBe('AND');

        var rightNode = results.right;

        expect(rightNode['left'].term).toBe('buzz');
        expect(rightNode.operator).toBe('OR');
        expect(rightNode['right'].term).toBe('baz');
    });
});

describe("lucenequeryparser: range expressions", function() {

    it("parses inclusive range expression: foo:[bar TO baz]", function() {
        var results = lucenequeryparser.parse('foo:[bar TO baz]');

        expect(results.field).toBe('foo');
        expect(results.term_min).toBe('bar');
        expect(results.term_max).toBe('baz');
        expect(results.inclusive).toBe(true);
    });

    it("parses inclusive range expression: foo:{bar TO baz}", function() {
        var results = lucenequeryparser.parse('foo:{bar TO baz}');

        expect(results.field).toBe('foo');
        expect(results.term_min).toBe('bar');
        expect(results.term_max).toBe('baz');
        expect(results.inclusive).toBe(false);
    });

    it("parses range expression with -ve numbers: foo:{0 TO -20}", function() {
      var results = lucenequeryparser.parse('foo:{0 TO -20}');

      expect(results.field).toBe('foo');
      expect(results.term_min).toBe('0');
      expect(results.term_max).toBe('-20');
      expect(results.inclusive).toBe(false);
    });

    it("parses range expression with -ve numbers: foo:{-20 TO 0}", function() {
      var results = lucenequeryparser.parse('foo:{-20 TO 0}');

      expect(results.field).toBe('foo');
      expect(results.term_min).toBe('-20');
      expect(results.term_max).toBe('0');
      expect(results.inclusive).toBe(false);
    });
});

describe("lucenequeryparser: Lucene Query syntax documentation examples", function() {

    /*
        Examples from Lucene documentation at

        http://lucene.apache.org/java/2_9_4/queryparsersyntax.html

        title:"The Right Way" AND text:go
        title:"Do it right" AND right
        title:Do it right

        te?t
        test*
        te*t

        roam~
        roam~0.8

        "jakarta apache"~10
        mod_date:[20020101 TO 20030101]
        title:{Aida TO Carmen}

        jakarta apache
        jakarta^4 apache
        "jakarta apache"^4 "Apache Lucene"
        "jakarta apache" jakarta
        "jakarta apache" OR jakarta
        "jakarta apache" AND "Apache Lucene"
        +jakarta lucene
        "jakarta apache" NOT "Apache Lucene"
        NOT "jakarta apache"
        "jakarta apache" -"Apache Lucene"
        (jakarta OR apache) AND website
        title:(+return +"pink panther")
    */

    it('parses example: title:"The Right Way" AND text:go', function() {
        var results = lucenequeryparser.parse('title:"The Right Way" AND text:go');

        expect(results.left.field).toBe('title');
        expect(results.left.term).toBe('The Right Way');
        expect(results.operator).toBe('AND');
        expect(results.right.field).toBe('text');
        expect(results.right.term).toBe('go');
    });

    it('parses example: title:"Do it right" AND right', function() {
        var results = lucenequeryparser.parse('title:"Do it right" AND right');

        expect(results.left.field).toBe('title');
        expect(results.left.term).toBe('Do it right');
        expect(results.operator).toBe('AND');
        expect(results.right.field).toBe('<implicit>');
        expect(results.right.term).toBe('right');
    });

    it('parses example: title:Do it right', function() {
        var results = lucenequeryparser.parse('title:Do it right');

        expect(results.left.field).toBe('title');
        expect(results.left.term).toBe('Do');
        expect(results.operator).toBe('<implicit>');

        var rightNode = results.right;

        expect(rightNode['left'].field).toBe('<implicit>');
        expect(rightNode['left'].term).toBe('it');
        expect(rightNode.operator).toBe('<implicit>');

        expect(rightNode['right'].field).toBe('<implicit>');
        expect(rightNode['right'].term).toBe('right');
    });

    it('parses example: te?t', function() {
        var results = lucenequeryparser.parse('te?t');

        expect(results.field).toBe('<implicit>');
        expect(results.term).toBe('te?t');
    });

    it('parses example: test*', function() {
        var results = lucenequeryparser.parse('test*');

        expect(results.field).toBe('<implicit>');
        expect(results.term).toBe('test*');
    });

    it('parses example: te*t', function() {
        var results = lucenequeryparser.parse('te*t');

        expect(results.field).toBe('<implicit>');
        expect(results.term).toBe('te*t');
    });

    it('parses example: roam~', function() {
        var results = lucenequeryparser.parse('roam~');

        expect(results.field).toBe('<implicit>');
        expect(results.term).toBe('roam');
        expect(results.similarity).toBe(0.5);
    });

    it('parses example: roam~0.8', function() {
        var results = lucenequeryparser.parse('roam~0.8');

        expect(results.field).toBe('<implicit>');
        expect(results.term).toBe('roam');
        expect(results.similarity).toBe(0.8);
    });

    it('parses example: "jakarta apache"~10', function() {
        var results = lucenequeryparser.parse('"jakarta apache"~10');

        expect(results.field).toBe('<implicit>');
        expect(results.term).toBe('jakarta apache');
        expect(results.proximity).toBe(10);
    });

    it('parses example: mod_date:[20020101 TO 20030101]', function() {
        var results = lucenequeryparser.parse('mod_date:[20020101 TO 20030101]');

        expect(results.field).toBe('mod_date');
        expect(results.term_min).toBe('20020101');
        expect(results.term_max).toBe('20030101');
        expect(results.inclusive).toBe(true);
    });

    // From: https://wiki.apache.org/solr/SolrQuerySyntax
    it('parses example: timestamp:[* TO NOW]', function() {
        var results = lucenequeryparser.parse('timestamp:[* TO NOW]');

        expect(results.field).toBe('timestamp');
        expect(results.term_min).toBe('*');
        expect(results.term_max).toBe('NOW');
        expect(results.inclusive).toBe(true);
    });

    // From: https://wiki.apache.org/solr/SolrQuerySyntax
    it('parses example: createdate:[1995-12-31T23:59:59.999Z TO 2007-03-06T00:00:00Z]', function() {
        var results = lucenequeryparser.parse('createdate:[1995-12-31T23:59:59.999Z TO 2007-03-06T00:00:00Z]');

        expect(results.field).toBe('createdate');
        expect(results.term_min).toBe('1995-12-31T23:59:59.999Z');
        expect(results.term_max).toBe('2007-03-06T00:00:00Z');
        expect(results.inclusive).toBe(true);
    });

    // From: https://wiki.apache.org/solr/SolrQuerySyntax
    it('parses example: pubdate:[NOW-1YEAR/DAY TO NOW/DAY+1DAY]', function() {
        var results = lucenequeryparser.parse('pubdate:[NOW-1YEAR/DAY TO NOW/DAY+1DAY]');

        expect(results.field).toBe('pubdate');
        expect(results.term_min).toBe('NOW-1YEAR/DAY');
        expect(results.term_max).toBe('NOW/DAY+1DAY');
        expect(results.inclusive).toBe(true);
    });

    // From: https://wiki.apache.org/solr/SolrQuerySyntax
    it('parses example: createdate:[1976-03-06T23:59:59.999Z TO 1976-03-06T23:59:59.999Z+1YEAR]', function() {
        var results = lucenequeryparser.parse('createdate:[1976-03-06T23:59:59.999Z TO 1976-03-06T23:59:59.999Z+1YEAR]');

        expect(results.field).toBe('createdate');
        expect(results.term_min).toBe('1976-03-06T23:59:59.999Z');
        expect(results.term_max).toBe('1976-03-06T23:59:59.999Z+1YEAR');
        expect(results.inclusive).toBe(true);
    });

    // From: https://wiki.apache.org/solr/SolrQuerySyntax
    it('parses example: createdate:[1976-03-06T23:59:59.999Z/YEAR TO 1976-03-06T23:59:59.999Z]', function() {
        var results = lucenequeryparser.parse('createdate:[1976-03-06T23:59:59.999Z/YEAR TO 1976-03-06T23:59:59.999Z]');

        expect(results.field).toBe('createdate');
        expect(results.term_min).toBe('1976-03-06T23:59:59.999Z/YEAR');
        expect(results.term_max).toBe('1976-03-06T23:59:59.999Z');
        expect(results.inclusive).toBe(true);
    });


    it('parses example: title:{Aida TO Carmen}', function() {
        var results = lucenequeryparser.parse('title:{Aida TO Carmen}');

        expect(results.field).toBe('title');
        expect(results.term_min).toBe('Aida');
        expect(results.term_max).toBe('Carmen');
        expect(results.inclusive).toBe(false);
    });

    it('parses example: jakarta apache', function() {
        var results = lucenequeryparser.parse('jakarta apache');

        expect(results.left.field).toBe('<implicit>');
        expect(results.left.term).toBe('jakarta');
        expect(results.operator).toBe('<implicit>');
        expect(results.right.field).toBe('<implicit>');
        expect(results.right.term).toBe('apache');
    });

    it('parses example: jakarta^4 apache', function() {
        var results = lucenequeryparser.parse('jakarta^4 apache');

        expect(results.left.field).toBe('<implicit>');
        expect(results.left.term).toBe('jakarta');
        expect(results.left['boost']).toBe(4);
        expect(results.operator).toBe('<implicit>');
        expect(results.right.field).toBe('<implicit>');
        expect(results.right.term).toBe('apache');
    });

    it('parses example: "jakarta apache"^4 "Apache Lucene"', function() {
        var results = lucenequeryparser.parse('"jakarta apache"^4 "Apache Lucene"');


        expect(results.left.field).toBe('<implicit>');
        expect(results.left.term).toBe('jakarta apache');
        expect(results.left['boost']).toBe(4);
        expect(results.operator).toBe('<implicit>');
        expect(results.right.field).toBe('<implicit>');
        expect(results.right.term).toBe('Apache Lucene');
    });

    it('parses example: "jakarta apache" jakarta', function() {
        var results = lucenequeryparser.parse('"jakarta apache" jakarta');

        expect(results.left.field).toBe('<implicit>');
        expect(results.left.term).toBe('jakarta apache');
        expect(results.operator).toBe('<implicit>');
        expect(results.right.field).toBe('<implicit>');
        expect(results.right.term).toBe('jakarta');
    });

    it('parses example: "jakarta apache" OR jakarta', function() {
        var results = lucenequeryparser.parse('"jakarta apache" OR jakarta');

        expect(results.left.field).toBe('<implicit>');
        expect(results.left.term).toBe('jakarta apache');
        expect(results.operator).toBe('OR');
        expect(results.right.field).toBe('<implicit>');
        expect(results.right.term).toBe('jakarta');
    });

    it('parses example: "jakarta apache" AND "Apache Lucene"', function() {
        var results = lucenequeryparser.parse('"jakarta apache" AND "Apache Lucene"');

        expect(results.left.field).toBe('<implicit>');
        expect(results.left.term).toBe('jakarta apache');
        expect(results.operator).toBe('AND');
        expect(results.right.field).toBe('<implicit>');
        expect(results.right.term).toBe('Apache Lucene');
    });

    it('parses example: +jakarta lucene', function() {
        var results = lucenequeryparser.parse('+jakarta lucene');

        expect(results.left.field).toBe('<implicit>');
        expect(results.left.term).toBe('jakarta');
        expect(results.left['prefix']).toBe('+');
    });

    it('parses example: "jakarta apache" NOT "Apache Lucene"', function() {
        var results = lucenequeryparser.parse('"jakarta apache" NOT "Apache Lucene"');

        expect(results.left.field).toBe('<implicit>');
        expect(results.left.term).toBe('jakarta apache');
        expect(results.operator).toBe('NOT');
        expect(results.right.field).toBe('<implicit>');
        expect(results.right.term).toBe('Apache Lucene');
    });

    it('parses example: NOT "jakarta apache"', function() {
        var results = lucenequeryparser.parse('NOT "jakarta apache"');

        // not a valid query, so operator is ignored.
        expect(results.field).toBe('<implicit>');
        expect(results.term).toBe('jakarta apache');
    });

    it('parses example: "jakarta apache" -"Apache Lucene"', function() {
        var results = lucenequeryparser.parse('"jakarta apache" -"Apache Lucene"');

        expect(results.left.field).toBe('<implicit>');
        expect(results.left.term).toBe('jakarta apache');
        expect(results.operator).toBe('<implicit>');
        expect(results.right.field).toBe('<implicit>');
        expect(results.right.term).toBe('Apache Lucene');
        expect(results.right.prefix).toBe('-');
    });

    it('parses example: (jakarta OR apache) AND website', function() {
        var results = lucenequeryparser.parse('(jakarta OR apache) AND website');

        var leftNode = results.left;
        expect(leftNode.left.field).toBe('<implicit>');
        expect(leftNode.left.term).toBe('jakarta');
        expect(leftNode.operator).toBe('OR');
        expect(leftNode.right.field).toBe('<implicit>');
        expect(leftNode.right.term).toBe('apache');

        expect(results.operator).toBe('AND');
        expect(results.right.field).toBe('<implicit>');
        expect(results.right.term).toBe('website');
    });

    it('parses example: title:(+return +"pink panther")', function() {
        var results = lucenequeryparser.parse('title:(+return +"pink panther")');

        expect(results.left.field).toBe('<implicit>');
        expect(results.left.term).toBe('return');
        expect(results.left['prefix']).toBe('+');
        expect(results.operator).toBe('<implicit>');
        expect(results.right.field).toBe('<implicit>');
        expect(results.right.term).toBe('pink panther');
        expect(results.right.prefix).toBe('+');
        expect(results.field).toBe('title');
    });
  });
});
