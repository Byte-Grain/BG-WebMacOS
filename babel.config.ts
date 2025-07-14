import { ConfigAPI, TransformOptions } from '@babel/core';

module.exports = (api: ConfigAPI): TransformOptions => {
  api.cache(true);
  
  return {
    presets: [
      '@vue/cli-plugin-babel/preset'
    ]
  };
};
