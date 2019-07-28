import {
  HtmlParser,
  I18NHtmlParser,
  Parser,
  Lexer,
  CompilerConfig,
  TemplateParser,
  DomElementSchemaRegistry,
  Visitor,
  Node,
  Attribute,
  Element,
  Expansion,
  Text,
  Comment,
  ExpansionCase
} from '@angular/compiler';

function isEmpty(value: any) {
  return value === undefined || value === null || value === '';
}

export function format(
  src: string,
  indentation: number = 4,
  useSpaces: boolean = true,
  closeTagSameLine: boolean = false,
  skipContents = [
    'p',
    'li',
    'span',
    'em',
    'strong',
    'i',
    'b',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6'
  ]
): string {
  const rawHtmlParser = new HtmlParser();
  const htmlParser = new I18NHtmlParser(rawHtmlParser);
  const expressionParser = new Parser(new Lexer());
  const config = new CompilerConfig();
  const parser = new TemplateParser(
    config,
    expressionParser,
    new DomElementSchemaRegistry(),
    htmlParser,
    null!,
    []
  );
  const htmlResult = htmlParser.parse(src, '', true);

  let pretty: string[] = [];
  let indent = 0;
  let attrNewLines = false;

  const selfClosing = {
    area: true,
    base: true,
    br: true,
    col: true,
    command: true,
    embed: true,
    hr: true,
    img: true,
    input: true,
    keygen: true,
    link: true,
    meta: true,
    param: true,
    source: true,
    track: true,
    wbr: true
  };

  const skipFormattingChildren = {
    style: true,
    pre: true
  };

  const getIndent = (i: number): string => {
    if (useSpaces) {
      return new Array(i * indentation).fill(' ').join('');
    } else {
      return new Array(i).fill('\t').join('');
    }
  };

  const enum AttributeWeight {
    StructuralDirective = 1,
    Variable = 10,
    Input = 20,
    Output = 30,
    BananaInTheBox = 40,
    Valueless = 50,
    None = 999999999,
  };

  interface WeightedAttribute {
    attr: Attribute;
    weight: AttributeWeight;
  }

  const convertAttributeToWeight = (attr: Attribute) => {
    const name = attr.name;
    const value = attr.value;

    if (name.startsWith('[(')) {
      return AttributeWeight.BananaInTheBox;
    }

    if (name.startsWith('#')) {
      return AttributeWeight.Variable;
    }

    if (name.startsWith('(')) {
      return AttributeWeight.Output;
    }

    if (name.startsWith('*')) {
      return AttributeWeight.StructuralDirective;
    }

    if (name.startsWith('[')) {
      return AttributeWeight.Input;
    }

    if (isEmpty(value)) {
      return AttributeWeight.Valueless;
    }

    return AttributeWeight.None;
  };

  const sortAttributes = (a: WeightedAttribute, b: WeightedAttribute) => {
    if ((a.weight !== AttributeWeight.None) || (b.weight !== AttributeWeight.None)) {
      return a.weight - b.weight;
    }

    return a.attr.name.localeCompare(a.attr.name);
  };

  let visitor: Visitor = {
    visitElement: function (element) {
      if (pretty.length > 0) {
        pretty.push('\n');
      }

      if (skipContents.indexOf(element.name) > -1) {
        pretty.push(getIndent(indent) + '<' + element.name);
        attrNewLines = element.attrs.length > 1;
        element.attrs
          .map(attr => ({ attr, weight: convertAttributeToWeight(attr) }))
          .sort(sortAttributes)
          .forEach(weightedAttr => {
            weightedAttr.attr.visit(visitor, {});
          });
        pretty.push('>');
        indent++;
        let obj = {
          inlineTextNode: true,
          textNodeInlined: true,
          skipFormattingChildren: true
        };
        element.children.forEach((element) => {
          element.visit(visitor, obj);
        });
        indent--;
        pretty.push(`</${element.name}>`);
        console.log(element.name);

        let tempArr = [];
        let matchEl = false;
        do {
          let tempEl = pretty.pop();
          for (var i = 0; i < skipContents.length; i++) {
            if ((tempEl.endsWith('<' + skipContents[i])) && (element.name === skipContents[i])) {
              tempArr.push(tempEl);
              matchEl = true;
            }
          }
          if (!matchEl) {
            if (tempEl.charAt(0) == ' ' && tempEl.charAt(1) == ' ') {
              tempEl = tempEl.replace(/^\s+/, '');
            }
            if (tempEl !== '\n') {
              tempArr.push(tempEl);
            }
          }
        } while (matchEl === false);
        tempArr = tempArr.reverse();
        console.log(tempArr);
        pretty = pretty.concat(tempArr);

        return;
      }

      if (element.name.startsWith(':svg:')) {
        pretty.push(getIndent(indent) + element.sourceSpan.toString());
        indent++;
        element.children.forEach((e) => e.visit(visitor, {}));
        indent--;
        if (element.children.length > 0) {
          pretty.push('\n' + getIndent(indent));
        } else if (element.sourceSpan.toString().endsWith('/>')) {
          return;
        }
        pretty.push(element.endSourceSpan!.toString());
        return;
      }
      pretty.push(getIndent(indent) + '<' + element.name);
      attrNewLines = element.attrs.length > 1 && element.name != 'link';
      element.attrs
        .map(attr => ({ attr, weight: convertAttributeToWeight(attr) }))
        .sort(sortAttributes)
        .forEach(weightedAttr => {
          weightedAttr.attr.visit(visitor, {});
        });
      if (!closeTagSameLine && attrNewLines) {
        pretty.push('\n' + getIndent(indent));
      }
      pretty.push('>');
      indent++;
      let ctx = {
        inlineTextNode: false,
        textNodeInlined: false,
        skipFormattingChildren: skipFormattingChildren.hasOwnProperty(element.name)
      };
      if (!attrNewLines && element.children.length == 1) {
        ctx.inlineTextNode = true;
      }
      element.children.forEach((element) => {
        element.visit(visitor, ctx);
      });
      indent--;
      if (
        element.children.length > 0 &&
        !ctx.textNodeInlined &&
        !ctx.skipFormattingChildren
      ) {
        pretty.push('\n' + getIndent(indent));
      }
      if (!selfClosing.hasOwnProperty(element.name)) {
        pretty.push(`</${element.name}>`);
      }
    },
    visit: function (node: Node, context: any) {
      console.error('IF YOU SEE THIS THE PRETTY PRINTER NEEDS TO BE UPDATED');
    },
    visitAttribute: function (attribute: Attribute, context: any) {
      let prefix = attrNewLines ? '\n' + getIndent(indent + 1) : ' ';
      pretty.push(prefix + attribute.name);
      if (attribute.value.length) {
        pretty.push(`="${attribute.value.trim()}"`);
      }
    },
    visitComment: function (comment: Comment, context: any) {
      pretty.push('\n' + getIndent(indent) + '<!-- ' + comment.value.trim() + ' -->');
    },
    visitExpansion: function (expansion: Expansion, context: any) {
      console.error('IF YOU SEE THIS THE PRETTY PRINTER NEEDS TO BE UPDATED');
    },
    visitExpansionCase: function (expansionCase: ExpansionCase, context: any) {
      console.error('IF YOU SEE THIS THE PRETTY PRINTER NEEDS TO BE UPDATED');
    },
    visitText: function (text: Text, context: any) {
      if (context.skipFormattingChildren) {
        pretty.push(text.value);
        return;
      }
      let shouldInline =
        context.inlineTextNode &&
        text.value.trim().length < 40 &&
        text.value.trim().length + pretty[pretty.length - 1].length < 140;

      context.textNodeInlined = shouldInline;
      if (text.value.trim().length > 0) {
        let prefix = shouldInline ? '' : '\n' + getIndent(indent);
        pretty.push(prefix + text.value.trim());
      } else if (!shouldInline) {
        pretty.push(
          text.value
            .replace('\n', '')
            .replace(/ /g, '')
            .replace(/\t/g, '')
            .replace(/\n+/, '\n')
        );
      }
    }
  };

  htmlResult.rootNodes.forEach((node) => {
    node.visit(visitor, {});
  });

  // console.log(pretty);

  let joiner = pretty.join('').trim() + '\n';

  return joiner;
}
