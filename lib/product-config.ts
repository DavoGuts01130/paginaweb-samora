export type ProductSaleMode = "single" | "variant" | "configurable";

export type ConfigSelector = {
  id: string;
  label: string;
  values: string[];
};

export type ConfigQuantity = {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  base: number;
};

export type ConfigPricingRule = {
  key: string;
  selections: Record<string, string>;
  supplier_base_cost_cop: number;
  supplier_increment_cost_cop: number;
  markup_percent: number;
};

export type ProductConfiguration = {
  product_id: string;
  selectors: ConfigSelector[];
  quantity_config: ConfigQuantity | null;
  pricing_rules: ConfigPricingRule[];
  is_active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
};

export function toSaleMode(
  productType: string | null | undefined,
  hasVariants?: boolean | null
): ProductSaleMode {
  if (productType === "variant" || productType === "configurable") {
    return productType;
  }

  if (hasVariants) return "variant";
  return "single";
}

export function roundCOP(value: number) {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.ceil(value / 1000) * 1000;
}

export function normalizeSelectors(value: unknown): ConfigSelector[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item, index) => {
      const record = (item ?? {}) as Record<string, unknown>;
      const values = Array.isArray(record.values)
        ? record.values
            .map((entry) => String(entry ?? "").trim())
            .filter(Boolean)
        : [];

      return {
        id: String(record.id ?? `selector_${index + 1}`),
        label: String(record.label ?? "").trim(),
        values,
      };
    })
    .filter((selector) => selector.label && selector.values.length > 0);
}

export function normalizeQuantity(value: unknown): ConfigQuantity | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const record = value as Record<string, unknown>;
  const min = Math.max(Number(record.min ?? 1) || 1, 0);
  const max = Math.max(Number(record.max ?? min) || min, min);
  const step = Math.max(Number(record.step ?? 1) || 1, 1);
  const base = Math.min(
    Math.max(Number(record.base ?? min) || min, min),
    max
  );

  return {
    id: String(record.id ?? "quantity"),
    label: String(record.label ?? "Cantidad").trim() || "Cantidad",
    min,
    max,
    step,
    base,
  };
}

export function normalizePricingRules(value: unknown): ConfigPricingRule[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      const record = (item ?? {}) as Record<string, unknown>;

      return {
        key: String(record.key ?? ""),
        selections:
          record.selections &&
          typeof record.selections === "object" &&
          !Array.isArray(record.selections)
            ? Object.fromEntries(
                Object.entries(record.selections as Record<string, unknown>).map(
                  ([key, entry]) => [key, String(entry ?? "")]
                )
              )
            : {},
        supplier_base_cost_cop: Math.max(
          Number(record.supplier_base_cost_cop ?? 0) || 0,
          0
        ),
        supplier_increment_cost_cop: Math.max(
          Number(record.supplier_increment_cost_cop ?? 0) || 0,
          0
        ),
        markup_percent: Math.max(Number(record.markup_percent ?? 30) || 0, 0),
      };
    })
    .filter((rule) => rule.key);
}

export function normalizeConfiguration(
  value: Partial<ProductConfiguration> | null | undefined
): ProductConfiguration | null {
  if (!value) return null;

  return {
    product_id: String(value.product_id ?? ""),
    selectors: normalizeSelectors(value.selectors),
    quantity_config: normalizeQuantity(value.quantity_config),
    pricing_rules: normalizePricingRules(value.pricing_rules),
    is_active: value.is_active !== false,
    created_at: value.created_at ?? null,
    updated_at: value.updated_at ?? null,
  };
}

export function buildRuleKey(
  selectors: ConfigSelector[],
  selections: Record<string, string>
) {
  if (selectors.length === 0) return "default";

  return selectors
    .map(
      (selector) =>
        `${selector.id}=${encodeURIComponent(selections[selector.id] ?? "")}`
    )
    .join("|");
}

export function getDefaultSelections(selectors: ConfigSelector[]) {
  return Object.fromEntries(
    selectors.map((selector) => [selector.id, selector.values[0] ?? ""])
  );
}

export function getRule(
  configuration: ProductConfiguration,
  selections: Record<string, string>
) {
  const key = buildRuleKey(configuration.selectors, selections);
  return configuration.pricing_rules.find((rule) => rule.key === key) ?? null;
}

export function getRuleByKey(
  configuration: ProductConfiguration,
  key: string | null | undefined
) {
  if (!key) return null;
  return configuration.pricing_rules.find((rule) => rule.key === key) ?? null;
}

export function getQuantitySteps(
  quantityConfig: ConfigQuantity | null,
  quantity: number | null | undefined
) {
  if (!quantityConfig) return 0;

  const value = Number(quantity ?? quantityConfig.base);
  if (!Number.isFinite(value)) return 0;

  return Math.max(
    Math.round((value - quantityConfig.base) / quantityConfig.step),
    0
  );
}

export function calculateConfiguredSupplierCost(
  rule: ConfigPricingRule,
  quantityConfig: ConfigQuantity | null,
  quantity: number | null | undefined
) {
  const steps = getQuantitySteps(quantityConfig, quantity);

  return Math.max(
    Number(rule.supplier_base_cost_cop ?? 0) +
      steps * Number(rule.supplier_increment_cost_cop ?? 0),
    0
  );
}

export function calculateConfiguredPrice(
  rule: ConfigPricingRule,
  quantityConfig: ConfigQuantity | null,
  quantity: number | null | undefined
) {
  const supplierCost = calculateConfiguredSupplierCost(
    rule,
    quantityConfig,
    quantity
  );

  return roundCOP(
    supplierCost * (1 + Number(rule.markup_percent ?? 0) / 100)
  );
}

export function getConfigurationPriceRange(
  configuration: ProductConfiguration | null | undefined
) {
  if (!configuration || configuration.pricing_rules.length === 0) {
    return { min: 0, max: 0 };
  }

  const quantityConfig = configuration.quantity_config;

  const prices = configuration.pricing_rules.flatMap((rule) => {
    if (!quantityConfig) {
      return [calculateConfiguredPrice(rule, null, null)];
    }

    return [
      calculateConfiguredPrice(rule, quantityConfig, quantityConfig.min),
      calculateConfiguredPrice(rule, quantityConfig, quantityConfig.max),
    ];
  });

  const valid = prices.filter((price) => price > 0);
  if (valid.length === 0) return { min: 0, max: 0 };

  return {
    min: Math.min(...valid),
    max: Math.max(...valid),
  };
}

export function buildSelectedOptions(
  configuration: ProductConfiguration,
  selections: Record<string, string>,
  quantity: number | null | undefined
) {
  const entries: [string, string | number][] = configuration.selectors.map(
    (selector) => [selector.label, selections[selector.id] ?? ""]
  );

  if (configuration.quantity_config) {
    entries.push([
      configuration.quantity_config.label,
      Number(quantity ?? configuration.quantity_config.base),
    ]);
  }

  return Object.fromEntries(entries.filter(([, value]) => String(value) !== ""));
}

export function getSelectedOptionsText(
  selectedOptions: Record<string, string | number> | null | undefined
) {
  if (!selectedOptions) return "";

  return Object.entries(selectedOptions)
    .map(([label, value]) => `${label}: ${value}`)
    .join(" · ");
}
