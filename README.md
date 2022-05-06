# karma-vite

> A karma plugin. Transform es module by using vite.

## Installation

```bash
npm install -D karma karma-vite
```

## Example

### Basic

```javascript
// karma.conf.js
module.exports = (config) => {
  config.set({
    plugins: ['karma-vite', 'karma-jasmine'],
    frameworks: ['vite', 'jasmine'],
    files: [
      {
        pattern: 'test/**/*.spec.ts',
        type: 'module',
        watched: false,
        served: false,
      },
    ],
  });
};
```

### full solution

Edit on [stackblitz](https://stackblitz.com/edit/karma-vite-react-example?file=test/button.spec.tsx)

more examples see in [github](https://github.com/credred/karma-vite/tree/main/examples)

## Configuration

The plugin works out of the box. But you may need to customize some configuration.

```javascript
// karma.conf.js
module.exports = (config) => {
  config.set({
    vite: {
      /**
       * @description auto config vite middleware
       * @default true
       */
      autoInit: true;
      /**
       * vite server configuration
       * @see https://vitejs.dev/config/
       */
      config: {
      },
      /**
       * @description The config will only take effect after using karma coverage reporter like karma-coverage.
       * see the typescript declaration below for more detail.
       */
      coverage: {
      },
    },
  });
};
```

### Typescript Declaration

```typescript
export interface KarmaViteConfig {
  /**
   * @description auto config vite middleware
   * @default true
   */
  autoInit?: boolean;
  /**
   * vite server configuration
   * @see https://vitejs.dev/config/
   */
  config: UserConfigExport;
  /**
   * @description The plugin can reporte coverage,
   * but it will only take effect after using karma coverage reporter like karma-coverage
   *
   * power by vite-plugin-istanbul.
   * @see https://github.com/ifaxity/vite-plugin-istanbul
   */
  coverage?: {
    /**
     * By default, it's true if the reporter of karma config contains 'coverage', otherwise false.
     */
    enable?: boolean;
    include?: string | string[];
    exclude?: string | string[];
    extension?: string | string[];
    cwd?: string;
  };
}
```
