---
feature: cross-rule-accessor
fr: FR-XREF
phase: Growth
status: not-implemented
description: >
  @(selector {property}) looks up a property value from a different rule
  in the CSS output. Backward references only.
tags: [symbol-system, accessor, runtime, cross-rule]
see-also: [style-lookup, selector-lookup]
---

# @(selector {property}) Cross-Rule Accessor

`@(selector {property})` reaches into a different rule's declarations to
grab a property value. You specify the selector to target and the
property to read — the runtime walks the CSS output accumulated so far
to find the match.

This is the one accessor that crosses selector tree boundaries. `@(prop)`
only looks within the current tree (and its parents); `@(selector {prop})`
can look at any rule that's already been output.

The catch: **backward references only**. The target rule must appear
before the reference in the CSS output. Forward references are an error —
the rule hasn't been output yet.

In v0, `@(selector {property})` does not cross `@media`, `@layer`, or
other at-rule boundaries.

<test-case type="valid">

## valid: basic cross-rule reference

`.main` reads the `height` property from `.header`.

```lass
.header {
  position: sticky;
  top: 0;
  height: 29px;
}

.main {
  min-height: @(.header {height});
}
```

```css
.header {
  position: sticky;
  top: 0;
  height: 29px;
}

.main {
  min-height: 29px;
}
```

</test-case>


<test-case type="valid">

## valid: inside a string value

Cross-rule references work inside any value position, including string
concatenation via `{{ }}`.

```lass
.header {
  height: 29px;
}

.main::after {
  content: "header is {{ @(.header {height}) }}";
}
```

```css
.header {
  height: 29px;
}

.main::after {
  content: "header is 29px";
}
```

</test-case>


<test-case type="valid">

## valid: referencing a nested selector

The selector string matches against the fully resolved selector in the
CSS output.

```lass
.card {
  .title {
    font-size: 24px;
  }
}

.sidebar {
  font-size: @(.card .title {font-size});
}
```

```css
.card {
  .title {
    font-size: 24px;
  }
}

.sidebar {
  font-size: 24px;
}
```

</test-case>


<test-case type="valid">

## valid: inside {{ }} expression

The runtime call returns a string — you can operate on it with JS.

```lass
.header {
  height: 60px;
}

.main {
  padding-top: {{ parseInt(@(.header {height})) + 16 }}px;
}
```

```css
.header {
  height: 60px;
}

.main {
  padding-top: 76px;
}
```

</test-case>


<test-case type="invalid">

## invalid: forward reference

The target rule must already exist in the CSS output. If `.main` comes
before `.header`, the reference fails.

```lass
.main {
  min-height: @(.header {height});
}

.header {
  height: 29px;
}
```

```error
RuntimeError: @(.header {height}) not found — selector .header has not been output yet at line 2
```

</test-case>


<test-case type="invalid">

## invalid: selector not found

If the selector doesn't match any rule in the CSS output, it's an error.

```lass
.main {
  min-height: @(.nonexistent {height});
}
```

```error
RuntimeError: @(.nonexistent {height}) not found — selector .nonexistent has not been output yet at line 2
```

</test-case>


<test-case type="invalid">

## invalid: property not found on matched selector

The selector exists, but the property hasn't been declared on it.

```lass
.header {
  position: sticky;
}

.main {
  min-height: @(.header {height});
}
```

```error
RuntimeError: @(.header {height}) — property height not found on .header at line 6
```

</test-case>


<test-case type="invalid">

## invalid: crosses @media boundary (v0)

In v0, cross-rule references don't reach across at-rule boundaries.

```lass
@media (min-width: 768px) {
  .header {
    height: 60px;
  }
}

.main {
  min-height: @(.header {height});
}
```

```error
RuntimeError: @(.header {height}) not found — selector .header has not been output yet at line 8
```

</test-case>

