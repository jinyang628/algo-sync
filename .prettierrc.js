export default {
  printWidth: 100,
  trailingComma: 'all',
  singleQuote: true,
  importOrder: [
    '^(next)|(next/(.*))$',
    '^(react)|(react/(.*))$',
    '<THIRD_PARTY_MODULES>',
    '^@/components/(.*)$',
    '^@/types/(.*)$',
    '^@/lib/(.*)$',
    '^@/styles/(.*)$',
    '^[./]',
  ],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
  importOrderCaseInsensitive: false,
  plugins: ['@trivago/prettier-plugin-sort-imports', 'prettier-plugin-tailwindcss'],
};
