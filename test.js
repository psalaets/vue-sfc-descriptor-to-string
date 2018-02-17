const fs = require('fs');
const compiler = require('vue-template-compiler');

const toString = require('./index');

it('vanilla sfc', async () => {
  const descriptor = await parse('./test-components/Vanilla.vue');

  const result = toString(descriptor);

  expect(result).toMatchSnapshot();
});

function parse(pathToComponent) {
  return new Promise((resolve, reject) => {
    fs.readFile(pathToComponent, 'utf8', (err, sfc) => {
      if (err) return reject(err);

      try {
        const descriptor = compiler.parseComponent(sfc);
        return resolve(descriptor);
      } catch (e) {
        return reject(e);
      }
    })
  });
}