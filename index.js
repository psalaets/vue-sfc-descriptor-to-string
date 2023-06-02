import indentString from 'indent-string';

export default function toString(sfcDescriptor, options = {}) {
  const {
    template,
    script,
    scriptSetup,
    styles,
    customBlocks
  } = sfcDescriptor;

  options.indents = options.indents || {}

  return [template, script, scriptSetup, ...styles, ...customBlocks]
    // discard blocks that don't exist
    .filter(block => block != null)
    // sort blocks by source position
    .sort((a, b) => a.loc.start.offset - b.loc.start.offset)
    // figure out exact source positions of blocks
    .map(block => {
      const openTag = makeOpenTag(block);
      const closeTag = makeCloseTag(block);
      const isSelfClosing = block.ast?.isSelfClosing;

      return Object.assign({}, block, {
        openTag,
        closeTag,
        isSelfClosing,

        ...isSelfClosing
          ? {
            startOfOpenTag: block.ast.loc.start.offset,
            endOfOpenTag: block.ast.loc.end.offset,

            startOfCloseTag: block.ast.loc.start.offset,
            endOfCloseTag: block.ast.loc.end.offset,
          }
          : {
            startOfOpenTag: block.loc.start.offset - openTag.length,
            endOfOpenTag: block.loc.start.offset,

            startOfCloseTag: block.loc.end.offset,
            endOfCloseTag: block.loc.end.offset + closeTag.length,
          }
      });
    })
    // generate sfc source
    .reduce((sfcCode, block, index, array) => {
      const first = index === 0;

      let newlinesBefore = 0;

      if (first) {
        newlinesBefore = block.startOfOpenTag;
      } else {
        const prevBlock = array[index - 1];
        newlinesBefore = block.startOfOpenTag - prevBlock.endOfCloseTag;
      }

      return sfcCode
        + '\n'.repeat(newlinesBefore)
        + (block.isSelfClosing
          ? `${block.ast.loc.source}\n`
          : block.openTag
            + indentString(block.content, options.indents[block.type] || 0)
            + block.closeTag
        );
    }, '');
}

function makeOpenTag(block) {
  let source = '<' + block.type;

  source += Object.keys(block.attrs)
    .sort()
    .map(name => {
      const value = block.attrs[name];

      if (value === true) {
        return name;
      } else {
        return `${name}="${value}"`;
      }
    })
    .map(attr => ' ' + attr)
    .join('');

  return source + '>';
}

function makeCloseTag(block) {
  return `</${block.type}>\n`
}