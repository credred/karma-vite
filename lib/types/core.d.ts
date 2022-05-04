import type { ConfigEnv, InlineConfig } from 'vite';

export type InlineConfigExport =
  | InlineConfig
  | Promise<InlineConfig>
  | ((env: ConfigEnv) => InlineConfig | Promise<InlineConfig>);

export interface KarmaViteConfig {
  /**
   * @description auto config vite middleware
   * @default true
   */
  autoInit?: boolean;
  /**
   * @description vite server configuration
   * @see https://vitejs.dev/config/
   */
  config?: InlineConfigExport;
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

    /**
     * @description In most cases, it does not need to be configured unless the test enters an infinite loop
     *
     * let vite not listen to the changes of this directory, coverage reporter's output directory,
     * to avoid the test enters an infinite loop in some case.
     *
     * By default, The value is coverageReporter.dir or coverageIstanbulReporter.dir from karma config.
     * If neither of these values exists, the value is 'coverage'
     */
    dir?: string;
  };
}
