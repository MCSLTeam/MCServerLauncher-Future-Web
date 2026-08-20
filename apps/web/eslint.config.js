import next from "eslint-config-next";

const config = [
  {
    ignores: ["public/monaco/**", "out/**", "dist/**", ".next/**", "target/**"],
  },
  ...next,
  {
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
];

export default config;
