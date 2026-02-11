/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
  type: "widget",

  // Optional but recommended: give it a stable name in Xcode
  name: "GRITWidget",
  displayName: "GRIT Widget",

  // Keep the icon (can be local later)
  icon: "https://github.com/expo.png",

  // Mirror app entitlements so you don’t duplicate strings
  entitlements: {
    "com.apple.security.application-groups":
      config.ios?.entitlements?.["com.apple.security.application-groups"] ?? [],
  },
});
