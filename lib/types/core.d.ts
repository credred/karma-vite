export interface KarmaViteConfig {
  /**
   * @default true
   */
  autoInit?: boolean;
  /**
   * @description The config will only take effect after using karma coverage reporter like karma-coverage
   *
   * power by vite-plugin-istanbul.
   * @see https://github.com/ifaxity/vite-plugin-istanbul
   */
  coverage?: {
    include?: string | string[];
    exclude?: string | string[];
    extension?: string | string[];
    cwd?: string;
  };
}
