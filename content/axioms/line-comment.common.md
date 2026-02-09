---
feature: line-comment
fr: FR-COMMENT
phase: MVP
status: implemented
description: >
  // comments are stripped from output. /* */ comments are preserved.
tags: [syntax, comments]
see-also: [css-passthrough]
---

# // Single-Line Comments

Lass adds `//` single-line comments to CSS. Everything from `//` to
the end of the line is stripped from the output.

Standard CSS `/* */` comments still work and are preserved in the
output — nothing changes there.

The scanner only detects `//` outside of CSS string literals, `url()`
values, and `/* */` comments. A `//` inside `"..."` or `url(...)` is
just text.

<test-case type="valid">

## valid: basic comment stripped

```lass
---
p {
  // this comment is stripped
  color: red;
}
```

```css
p {
  
  color: red;
}
```

</test-case>


<test-case type="valid">

## valid: inline comment stripped

`//` strips everything from the `//` to end of line. The declaration
before it is preserved.

```lass
---
p {
  color: red; // this is stripped
}
```

```css
p {
  color: red; 
}
```

</test-case>


<test-case type="valid">

## valid: CSS comments preserved

`/* */` comments are standard CSS — they pass through into the output.

```lass
---
/* preserved */
p {
  color: red; /* also preserved */
}
```

```css
/* preserved */
p {
  color: red; /* also preserved */
}
```

</test-case>


<test-case type="valid">

## valid: both comment styles together

`//` stripped, `/* */` preserved — they coexist.

```lass
---
// this line disappears
/* this stays */
p {
  color: red; // gone
  background: blue; /* stays */
}
```

```css

/* this stays */
p {
  color: red; 
  background: blue; /* stays */
}
```

</test-case>


<test-case type="valid">

## valid: // inside a CSS string is not a comment

The scanner skips `//` detection inside string literals.

```lass
---
a {
  content: "https://example.com";
}
```

```css
a {
  content: "https://example.com";
}
```

</test-case>


<test-case type="valid">

## valid: // inside url() is not a comment

The scanner skips `//` detection inside `url()`.

```lass
---
.bg {
  background: url(https://example.com/image.png);
}
```

```css
.bg {
  background: url(https://example.com/image.png);
}
```

</test-case>


<test-case type="valid">

## valid: // inside a /* */ comment is not a comment

`//` inside a `/* */` block is just part of the CSS comment text. The
`/* */` takes precedence.

```lass
---
/* This contains // but it's all one CSS comment */
p {
  color: red;
}
```

```css
/* This contains // but it's all one CSS comment */
p {
  color: red;
}
```

</test-case>


<test-case type="valid">

## valid: comment-only file produces empty output

```lass
---
// nothing but a comment
```

```css
```

</test-case>


<test-case type="valid">

## valid: // comments in no-separator pure CSS file

`//` stripping works regardless of whether the file has a `---`
separator. A pure CSS file (no preamble) with `//` comments gets them
stripped just the same.

```lass
// top-level comment
p {
  color: red; // inline comment
}
```

```css

p {
  color: red; 
}
```

</test-case>


<test-case type="invalid">

## invalid: unclosed /* */ breaks comment-state detection

An unclosed `/* */` comment means the scanner enters comment-state and
never exits. Everything from `/*` onward is consumed as a comment, and
the output is truncated. The transpiler detects this at end-of-file and
reports an error.

```lass
---
p {
  color: red;
}
/* this comment never closes
.box {
  padding: 8px;
}
```

```error
Unclosed /* comment
```

</test-case>

