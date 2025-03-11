/** @type {import('@electron-forge/shared-types').ForgeConfig} */
module.exports = {
  packagerConfig: {
    asar: false,
    name: 'Project Reality Tesseract',
    // icon: 'src/icon.ico',
    executableName: 'prtr',
    extraResource: []
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      /** @type {import('@electron-forge/maker-squirrel').MakerSquirrelConfig} */
      config: {
        // icon: 'src/icon.ico',
        name: 'prtr',
        // setupIcon: 'src/icon.ico'
      }
    },
  ],
  plugins: [
  ],
};
