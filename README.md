# Angular Template Formatter

Extension for formatting Angular 2+ HTML templates. This extension is opinionated and not very configurable.

This extension is a fork of [Angular Template Formatter](https://marketplace.visualstudio.com/items?itemName=stringham.angular-template-formatter) that adds additional configuration options. It also changes the default value of some of the configuration options.

## Formatting:

When run, this extension will put each HTML attribute on its own line—unless there is a single attribute declared on the HTML tag. In the case of a single attribute, the tag and attribute will be put on a single line.

## Example:

This template from the Angular [Tour of Heroes](https://github.com/johnpapa/angular-tour-of-heroes/blob/master/src/app/hero-search.component.html):

```html
<div id="search-component">
  <h4>Hero Search</h4>
  <input #searchBox id="search-box" (keyup)="search(searchBox.value)" />
  <div>
    <div *ngFor="let hero of heroes | async"
         (click)="gotoDetail(hero)" class="search-result" >
      {{hero.name}}
    </div>
  </div>
</div>
```

will get formatted to:

```html
<div id="search-component">
  <h4>Hero Search</h4>
  <input
    #searchBox
    (keyup)="search(searchBox.value)"
    id="search-box">
  <div>
    <div
      *ngFor="let hero of heroes | async"
      (click)="gotoDetail(hero)"
      class="search-result">
      {{hero.name}}
    </div>
  </div>
</div>
```

## Recommended Configuration:

```
{
    // turn off default vs code formatter
    "html.format.enable": false,
    // enable formatting by default
    "editor.formatOnSave": true,
    "editor.formatOnPaste": true
}
```


## Release Notes

### 0.0.11

Fixing parsing issues with and adding additional default tags for `angular-template-formatter.skipContents`.

### 0.0.9

Added option for setting certain HTML tags whose contents should be completely ignored: `angular-template-formatter.skipContents`.

### 0.0.8

Added option for preventing closing tag `>` from being on their own line: `angular-template-formatter.closeTagSameLine`. Thanks @larscom!

### 0.0.7

Added an option for tabs vs spaces. Thanks @Empereol!

### 0.0.2

Added configuration option for indentWidth, defaults to 4.

### 0.0.1

Initial release of Angular template formatter
